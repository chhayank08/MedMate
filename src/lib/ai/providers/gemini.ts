/**
 * Gemini provider adapter (direct Google Generative Language API over raw
 * fetch). Used when GEMINI_API_KEY is set; otherwise the router routes the same
 * logical model through OpenRouter. Also the embeddings backend for RAG.
 */
import "server-only";
import {
  AIError,
  classifyStatus,
  parseRetryAfterMs,
  type ChatMessage,
  type CompletionParams,
  type ChatResult,
  type Provider,
} from "@/lib/ai/providers/types";
import { estimateTokens } from "@/lib/ai/budget";

const BASE = "https://generativelanguage.googleapis.com/v1beta";
// gemini-embedding-001 is the stable embedding model; request 768 dims (MRL
// truncation) to match the vector(768) DB schema. (text-embedding-004 is not
// available on all keys.) Cosine ranking is unaffected by the truncation.
export const GEMINI_EMBED_MODEL = "gemini-embedding-001";
export const GEMINI_EMBED_DIMS = 768;

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) {
    throw new AIError("GEMINI_API_KEY is not configured on the server.", 500, false, "config");
  }
  return key;
}

/** Split chat messages into Gemini's systemInstruction + contents shape. */
function toGeminiPayload(messages: ChatMessage[]) {
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
  return {
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    contents,
  };
}

async function fail(res: Response): Promise<never> {
  const detail = await res.text().catch(() => "");
  const { retryable, kind } = classifyStatus(res.status);
  
  // Parse Gemini error details to distinguish quota types
  let detectedKind = kind;
  if (res.status === 429) {
    // Check error message for specific quota exhaustion patterns
    if (detail.includes("exceeded your current quota") || 
        detail.includes("quota exceeded") ||
        detail.includes("RATE_LIMIT_EXCEEDED")) {
      detectedKind = "quota"; // Daily/monthly quota exhausted
    } else if (detail.includes("Resource has been exhausted")) {
      detectedKind = "rate_limit"; // RPM/TPM temporarily exhausted
    } else {
      detectedKind = "rate_limit"; // Default to rate_limit for 429
    }
  }
  
  const clientStatus = res.status === 429 ? 429 : res.status >= 500 ? 502 : res.status;
  
  let userMessage = "AI generation failed. Please try again.";
  if (res.status === 429) {
    userMessage = "AI service at capacity. Switching to another model...";
  } else if (res.status === 402) {
    userMessage = "AI quota reached. Please wait a few minutes and try again.";
  } else if (res.status >= 500) {
    userMessage = "AI service temporarily unavailable. Please try again.";
  }
  
  console.log(`[Gemini Provider] Error detail: ${detail.slice(0, 200)}`);
  
  throw new AIError(
    userMessage,
    clientStatus,
    retryable,
    detectedKind,
    parseRetryAfterMs(res.headers.get("retry-after")),
  );
}

export const geminiProvider: Provider = {
  name: "gemini",

  available() {
    return Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  },

  async chat(params: CompletionParams): Promise<ChatResult> {
    const url = `${BASE}/models/${params.model}:generateContent?key=${apiKey()}`;

    // One generation pass; reports the finish reason so we can detect truncation.
    const onePass = async (
      messages: ChatMessage[],
    ): Promise<{ text: string; finishReason: string; inputTokens: number; outputTokens: number }> => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...toGeminiPayload(messages),
          generationConfig: {
            temperature: params.temperature ?? 0.7,
            ...(params.maxTokens ? { maxOutputTokens: params.maxTokens } : {}),
            ...(params.jsonMode ? { responseMimeType: "application/json" } : {}),
          },
        }),
        signal: params.signal,
      });
      if (!res.ok) await fail(res);
      const data = await res.json();
      const cand = data?.candidates?.[0];
      const text: string =
        cand?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
      const inputTokens =
        data?.usageMetadata?.promptTokenCount ??
        messages.reduce((n, m) => n + estimateTokens(m.content), 0);
      const outputTokens = data?.usageMetadata?.candidatesTokenCount ?? estimateTokens(text);
      return { text, finishReason: cand?.finishReason ?? "", inputTokens, outputTokens };
    };

    // If the model is cut off by the token cap, transparently continue so free-
    // form notes never end mid-sentence. JSON is NOT continued (concatenating
    // partial JSON is unsafe) — the router's `parseJsonLoose` repairs a
    // truncated tail instead.
    const MAX_CONTINUATIONS = params.jsonMode ? 0 : 5;  // Increased from 3 to 5
    const messages: ChatMessage[] = [...params.messages];
    let full = "";
    let inputTokens = 0;
    let outputTokens = 0;
    for (let i = 0; i <= MAX_CONTINUATIONS; i++) {
      const pass = await onePass(messages);
      full += pass.text;
      inputTokens += pass.inputTokens;
      outputTokens += pass.outputTokens;
      if (pass.finishReason !== "MAX_TOKENS" || !pass.text) break;
      messages.push(
        { role: "assistant", content: pass.text },
        {
          role: "user",
          content:
            "Continue exactly where you left off. Do not repeat any earlier text or add a preamble — output only the remaining content.",
        },
      );
    }
    if (!full) {
      throw new AIError("AI generation returned no content. Please try again.", 502, true, "bad_response");
    }
    return {
      text: full,
      usage: { inputTokens, outputTokens },
      provider: "gemini",
      model: params.model,
    };
  },

  async stream(params: CompletionParams): Promise<ReadableStream<Uint8Array>> {
    const encoder = new TextEncoder();
    // If the model stops because it hit maxOutputTokens, transparently ask it to
    // continue and keep streaming — so long outputs never end mid-sentence.
    const MAX_CONTINUATIONS = 6;  // Increased from 4 to 6

    // One generation pass: streams deltas via `onDelta`, returns the finish
    // reason (from the final SSE frame) and the text produced this pass.
    const runPass = async (
      messages: ChatMessage[],
      onDelta: (text: string) => void,
    ): Promise<{ finishReason: string; text: string }> => {
      const url = `${BASE}/models/${params.model}:streamGenerateContent?alt=sse&key=${apiKey()}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...toGeminiPayload(messages),
          generationConfig: {
            temperature: params.temperature ?? 0.7,
            ...(params.maxTokens ? { maxOutputTokens: params.maxTokens } : {}),
          },
        }),
        signal: params.signal,
      });
      if (!res.ok) await fail(res);
      const body = res.body;
      if (!body) throw new AIError("No response body from Gemini.", 502, false, "bad_response");

      const decoder = new TextDecoder();
      const reader = body.getReader();
      let buffer = "";
      let finishReason = "";
      let text = "";
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (!payload) continue;
            try {
              const json = JSON.parse(payload);
              const cand = json?.candidates?.[0];
              const delta: string =
                cand?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
              if (delta) {
                text += delta;
                onDelta(delta);
              }
              if (cand?.finishReason) finishReason = cand.finishReason;
            } catch {
              // Ignore partial frames.
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
      return { finishReason, text };
    };

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          const messages: ChatMessage[] = [...params.messages];
          for (let i = 0; i <= MAX_CONTINUATIONS; i++) {
            const { finishReason, text } = await runPass(messages, (delta) =>
              controller.enqueue(encoder.encode(delta)),
            );
            // Stop unless we were cut off by the token cap (and produced text).
            if (finishReason !== "MAX_TOKENS" || !text) break;
            messages.push(
              { role: "assistant", content: text },
              {
                role: "user",
                content:
                  "Continue exactly where you left off. Do not repeat any earlier text or add a preamble — output only the remaining content.",
              },
            );
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });
  },

  /** Batch embeddings via gemini-embedding-001 (768-dim vectors, MRL-truncated). */
  async embed(texts: string[], model = GEMINI_EMBED_MODEL): Promise<number[][]> {
    if (texts.length === 0) return [];
    const url = `${BASE}/models/${model}:batchEmbedContents?key=${apiKey()}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: texts.map((text) => ({
          model: `models/${model}`,
          content: { parts: [{ text }] },
          outputDimensionality: GEMINI_EMBED_DIMS,
        })),
      }),
    });
    if (!res.ok) await fail(res);
    const data = await res.json();
    const embeddings: number[][] = (data?.embeddings ?? []).map(
      (e: { values: number[] }) => e.values,
    );
    if (embeddings.length !== texts.length) {
      throw new AIError("Gemini returned a mismatched number of embeddings.", 502, false, "bad_response");
    }
    return embeddings;
  },
};
