/**
 * Vision Router for Image/OCR Tasks
 * 
 * Handles vision-specific AI requests (OCR, image parsing) separately from
 * generation tasks to prevent vision quota exhaustion from blocking summaries.
 * 
 * Uses only vision-capable models with automatic fallback rotation.
 */
import "server-only";
import { geminiProvider } from "@/lib/ai/providers/gemini";
import { AIError } from "@/lib/ai/providers/types";
import { markExhausted, isExhausted } from "@/lib/ai/quota-tracker";
import { getCandidates, getModelInfo } from "@/lib/ai/model-pools";

const MAX_RETRIES = 2;
const MAX_BACKOFF_MS = 5000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function backoffMs(attempt: number, err: unknown): number {
  if (err instanceof AIError && err.retryAfterMs != null) {
    return Math.min(MAX_BACKOFF_MS, Math.max(250, err.retryAfterMs));
  }
  return Math.min(MAX_BACKOFF_MS, 250 * 2 ** attempt + Math.random() * 250);
}

async function withRetries<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= MAX_RETRIES; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const retryable = err instanceof AIError ? err.retryable : true;
      const budget = err instanceof AIError && err.kind === "rate_limit" ? 0 : MAX_RETRIES;
      if (!retryable || i >= budget) throw err;
      await sleep(backoffMs(i, err));
    }
  }
  throw lastErr;
}

export interface VisionResult {
  text: string;
  provider: string;
  model: string;
}

export async function extractImageText(
  bytes: ArrayBuffer,
  mimeType: string,
  signal?: AbortSignal
): Promise<VisionResult> {
  const candidates = getCandidates("vision");
  let lastErr: unknown;

  for (const c of candidates) {
    if (c.provider !== "gemini" || !geminiProvider.available()) {
      continue;
    }

    if (isExhausted(c.provider, c.model, "vision")) {
      const modelInfo = getModelInfo(c.model);
      console.log(`[Vision Router] ⏭️  Skipping ${c.provider}/${c.model} (${modelInfo.description})`);
      continue;
    }

    try {
      console.log(`[Vision Router] 🖼️  Attempting ${c.provider}/${c.model} for image extraction`);
      
      const data = Buffer.from(bytes).toString("base64");
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${c.model}:generateContent?key=${
        process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
      }`;

      const prompt = `Extract all content from this study image. Transcribe text, render tables as markdown, and explain diagrams/charts. Output only the extracted content. If no content found, reply: NO_CONTENT`;

      const result = await withRetries(async () => {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [{ inline_data: { mime_type: mimeType, data } }, { text: prompt }],
            }],
            generationConfig: { temperature: 0.2 },
          }),
          signal,
        });

        if (!res.ok) {
          const detail = await res.text().catch(() => "");
          const retryable = res.status === 429 || res.status >= 500;
          const kind = res.status === 429 ? "rate_limit" : res.status === 402 ? "quota" : "bad_response";
          throw new AIError(`Vision extraction failed (${res.status})`, res.status, retryable, kind);
        }

        const json = await res.json();
        const text: string = json?.candidates?.[0]?.content?.parts
          ?.map((p: { text?: string }) => p.text ?? "").join("").trim() ?? "";

        if (!text || text === "NO_CONTENT") {
          throw new Error("No readable text found in the image.");
        }
        return text;
      });

      console.log(`[Vision Router] ✅ Success with ${c.provider}/${c.model}`);
      return { text: result, provider: c.provider, model: c.model };
    } catch (err) {
      lastErr = err;
      const errMsg = err instanceof AIError ? `${err.kind} (${err.status})` : "unknown error";
      console.log(`[Vision Router] ❌ Failed with ${c.provider}/${c.model}: ${errMsg}`);

      if (err instanceof AIError && (err.kind === "rate_limit" || err.kind === "quota")) {
        const reason = err.message || `${err.kind} error`;
        markExhausted(c.provider, c.model, err.kind, "vision", reason);
        console.log(`[Vision Router] ⚠️  ${c.model} ${err.kind} for vision, rotating...`);
      }

      if (err instanceof AIError && err.kind === "credit") throw err;
    }
  }

  throw lastErr instanceof Error
    ? lastErr
    : new AIError("All vision models are temporarily exhausted. Please wait a few minutes and try again.", 503, false, "rate_limit");
}
