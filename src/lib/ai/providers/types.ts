/**
 * Common contract every AI provider adapter implements so the router can treat
 * Gemini (direct) and OpenRouter interchangeably. Server-only — adapters read
 * provider API keys.
 */
import "server-only";

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface CompletionParams {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  /** Hard cap on output tokens. The router fills this from the budgeter. */
  maxTokens?: number;
  /** Ask the model for a JSON object response. */
  jsonMode?: boolean;
  signal?: AbortSignal;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface ChatResult {
  text: string;
  usage: TokenUsage;
  /** The provider that actually served the request. */
  provider: string;
  /** The model id that actually served the request. */
  model: string;
}

export interface StreamResult {
  stream: ReadableStream<Uint8Array>;
  provider: string;
  model: string;
}

export interface Provider {
  readonly name: string;
  /** True when this provider's API key is configured. */
  available(): boolean;
  chat(params: CompletionParams): Promise<ChatResult>;
  stream(params: CompletionParams): Promise<ReadableStream<Uint8Array>>;
  /** Optional embeddings support (Gemini implements this). */
  embed?(texts: string[], model?: string): Promise<number[][]>;
}

/**
 * Error raised by providers/router. `status` maps to an HTTP status for the
 * route. `retryable` tells the router whether a transient retry is worthwhile;
 * `kind: "credit"` marks 402/quota-exhaustion which must surface, never retry.
 */
export class AIError extends Error {
  constructor(
    message: string,
    readonly status = 500,
    readonly retryable = false,
    readonly kind: "credit" | "rate_limit" | "quota" | "outage" | "bad_response" | "config" | "unknown" = "unknown",
    /** Provider `Retry-After` hint (ms), used by the router to time 429 backoff. */
    readonly retryAfterMs?: number,
  ) {
    super(message);
    this.name = "AIError";
  }
}

/**
 * Parse a `Retry-After` header (delta-seconds or HTTP-date) into milliseconds.
 * Returns `undefined` when absent/unparseable so the caller falls back to its
 * default backoff.
 */
export function parseRetryAfterMs(header: string | null): number | undefined {
  if (!header) return undefined;
  const secs = Number(header);
  if (Number.isFinite(secs)) return Math.max(0, secs * 1000);
  const when = Date.parse(header);
  if (!Number.isNaN(when)) return Math.max(0, when - Date.now());
  return undefined;
}

/** Classify an HTTP status from a provider into router-actionable metadata. */
export function classifyStatus(status: number): {
  retryable: boolean;
  kind: AIError["kind"];
} {
  if (status === 402) return { retryable: false, kind: "credit" };
  if (status === 429) return { retryable: true, kind: "rate_limit" };
  if (status === 408 || status === 425 || status >= 500) {
    return { retryable: true, kind: "outage" };
  }
  return { retryable: false, kind: "unknown" };
}
