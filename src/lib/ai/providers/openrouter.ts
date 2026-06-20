/**
 * OpenRouter provider adapter. OpenAI-compatible chat + SSE streaming over raw
 * fetch (no SDK, matching the codebase style). Serves as the universal fallback
 * and the route for models we don't yet have a direct key for (Claude, GPT).
 *
 * Adds explicit 402 handling: a credit/budget exhaustion is surfaced as a
 * non-retryable AIError(kind: "credit") rather than the previous generic 502.
 */
import "server-only";
import {
  AIError,
  classifyStatus,
  parseRetryAfterMs,
  type CompletionParams,
  type ChatResult,
  type Provider,
} from "@/lib/ai/providers/types";
import { estimateTokens } from "@/lib/ai/budget";

/** When HELICONE_API_KEY is set, route through Helicone's OpenRouter-specific proxy
 *  for latency/error tracking. Falls back to OpenRouter directly otherwise. */
function endpoint() {
  return process.env.HELICONE_API_KEY
    ? "https://openrouter.helicone.ai/api/v1/chat/completions"
    : "https://openrouter.ai/api/v1/chat/completions";
}

/**
 * Some models (e.g. Gemini via OpenRouter) emit literal control characters
 * inside JSON string values, which makes JSON.parse throw. We sanitize
 * them before parsing so a successful generation never results in a 502.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function parseJsonBody(res: Response): Promise<any> {
  const text = await res.text();
  const sanitized = sanitizeJsonControlChars(text);
  return JSON.parse(sanitized);
}

function sanitizeJsonControlChars(json: string): string {
  let result = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    if (escaped) { result += ch; escaped = false; continue; }
    if (ch === "\\") { result += ch; escaped = true; continue; }
    if (ch === '"') { inString = !inString; result += ch; continue; }
    if (inString && ch.charCodeAt(0) < 0x20) {
      switch (ch) {
        case "\n": result += "\\n"; break;
        case "\r": result += "\\r"; break;
        case "\t": result += "\\t"; break;
        default: result += `\\u${ch.charCodeAt(0).toString(16).padStart(4, "0")}`; break;
      }
      continue;
    }
    result += ch;
  }
  return result;
}

function config() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new AIError("OPENROUTER_API_KEY is not configured on the server.", 500, false, "config");
  }
  return {
    apiKey,
    // Default to a FREE, currently-available model so a $0 OpenRouter account
    // never 402s on fallback. NOT a Google model — the router falls back here
    // precisely when Google's free quota is exhausted, so the fallback must use
    // an independent provider pool. Override with OPENROUTER_MODEL (":free").
    defaultModel: process.env.OPENROUTER_MODEL || "openai/gpt-oss-120b:free",
    referer: process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
    title: process.env.OPENROUTER_SITE_NAME || "MedMate AI",
  };
}

/**
 * Parse the affordable token count out of an OpenRouter 402 body, e.g.
 * "You requested up to 12000 tokens, but can only afford 3023." Lets us retry
 * once with a budget the account can actually serve instead of hard-failing.
 */
function parseAffordableTokens(detail: string): number | null {
  const afford = detail.match(/can only afford (\d+)/i);
  if (afford) return Number(afford[1]);
  return null;
}

async function request(params: CompletionParams, stream: boolean, attempt = 0): Promise<Response> {
  const { apiKey, defaultModel, referer, title } = config();

  const heliconeKey = process.env.HELICONE_API_KEY;
  const res = await fetch(endpoint(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": referer,
      "X-Title": title,
      ...(heliconeKey ? { "Helicone-Auth": `Bearer ${heliconeKey}` } : {}),
    },
    body: JSON.stringify({
      model: params.model || defaultModel,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens,
      stream,
      ...(stream ? { stream_options: { include_usage: true } } : {}),
      ...(params.jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: params.signal,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    const { retryable, kind } = classifyStatus(res.status);
    // 402 recovery: if the account can only afford fewer tokens than we asked
    // for, retry ONCE with a budget it can serve (guarded against recursion).
    if (res.status === 402 && attempt === 0) {
      const affordable = parseAffordableTokens(detail);
      if (affordable && affordable >= 256 && (!params.maxTokens || affordable < params.maxTokens)) {
        return request({ ...params, maxTokens: Math.max(256, affordable - 256) }, stream, attempt + 1);
      }
    }
    const message =
      res.status === 402
        ? `AI quota reached. Please wait a few minutes and try again.`
        : res.status === 429
        ? `AI service at capacity. Please wait 30 seconds and try again.`
        : `AI generation failed. Please try again. ${detail.slice(0, 100)}`;
    // Map provider status to a client-facing status: keep 402/429, else 502.
    const clientStatus = res.status === 402 ? 402 : res.status === 429 ? 429 : 502;
    throw new AIError(message, clientStatus, retryable, kind, parseRetryAfterMs(res.headers.get("retry-after")));
  }
  return res;
}

export const openrouterProvider: Provider = {
  name: "openrouter",

  available() {
    return Boolean(process.env.OPENROUTER_API_KEY);
  },

  async chat(params: CompletionParams): Promise<ChatResult> {
    const res = await request(params, false);
    const data = await parseJsonBody(res);
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new AIError("Malformed response from OpenRouter.", 502, false, "bad_response");
    }
    const inputTokens =
      data?.usage?.prompt_tokens ??
      params.messages.reduce((n: number, m) => n + estimateTokens(m.content), 0);
    const outputTokens = data?.usage?.completion_tokens ?? estimateTokens(content);
    return {
      text: content,
      usage: { inputTokens, outputTokens },
      provider: "openrouter",
      model: data?.model || params.model,
    };
  },

  async stream(params: CompletionParams): Promise<ReadableStream<Uint8Array>> {
    const res = await request(params, true);
    const body = res.body;
    if (!body) throw new AIError("No response body from OpenRouter.", 502, false, "bad_response");

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = "";

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = body.getReader();
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
              if (payload === "[DONE]") {
                controller.close();
                return;
              }
              try {
                const json = JSON.parse(payload);
                const delta = json?.choices?.[0]?.delta?.content;
                if (delta) controller.enqueue(encoder.encode(delta));
              } catch {
                // Ignore keep-alive comments / partial frames.
              }
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        } finally {
          reader.releaseLock();
        }
      },
    });
  },
};
