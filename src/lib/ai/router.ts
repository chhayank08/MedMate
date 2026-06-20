import "server-only";
import type { ZodType } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { geminiProvider } from "@/lib/ai/providers/gemini";
import { openrouterProvider } from "@/lib/ai/providers/openrouter";
import {
  AIError,
  type ChatMessage,
  type ChatResult,
  type CompletionParams,
  type Provider,
} from "@/lib/ai/providers/types";
import { messagesTokens, outputBudget, FREE_TIER_MAX_OUTPUT, type BudgetTask } from "@/lib/ai/budget";
import { logUsage } from "@/lib/ai/cost";
import { parseJsonLoose } from "@/lib/ai/json";
import { traceCompletion, traceQuotaExhaustion, traceModelRotation } from "@/lib/observability";
import { markExhausted, isExhausted } from "@/lib/ai/quota-tracker";
import { getCandidates, getTaskCategory, getModelInfo, type ProviderName, type Candidate } from "@/lib/ai/model-pools";
import "@/lib/ai/quota-init"; // Initialize quota tracking

/**
 * AI Router — the single entry point for every AI request in the app.
 *
 * Responsibilities:
 *  - Pick a model per task using task-specific pools (vision, generation, etc.).
 *  - Track quota exhaustion per model AND per task.
 *  - Handle daily quota resets (midnight Pacific time for Gemini).
 *  - Retry transient failures, then fall back to the next candidate.
 *  - Surface credit/budget (402) errors instead of silently burning fallbacks.
 *  - Log token usage + cost to `ai_usage` and observability platforms.
 *
 * Routes call `runObject` (structured), `runStream` (streaming) or `run` (text)
 * with a `task`; everything else (model, tokens, retries) is handled here.
 */

export type RouterTask = BudgetTask | "vision" | "ocr" | "image_parse" | "embedding";

const PROVIDERS: Record<ProviderName, Provider> = {
  gemini: geminiProvider,
  openrouter: openrouterProvider,
};

/** Clamp the per-provider output budget. OpenRouter free models reject requests
 *  whose max_tokens exceeds the affordable credit, so cap them hard. */
function providerMaxTokens(provider: ProviderName, budget: number): number {
  return provider === "openrouter" ? Math.min(budget, FREE_TIER_MAX_OUTPUT) : budget;
}

/**
 * Resolve available model candidates for a task, filtering out:
 * - Unavailable providers (missing API keys)
 * - Currently exhausted models (quota/rate-limited)
 * 
 * Uses task-specific pools from model-pools.ts for optimal routing.
 */
function resolveCandidates(task: RouterTask): Candidate[] {
  const category = getTaskCategory(task);
  const poolCandidates = getCandidates(category);
  const out: Candidate[] = [];
  
  // Filter candidates by availability and exhaustion state
  for (const c of poolCandidates) {
    const provider = PROVIDERS[c.provider];
    
    // Skip if provider not available (missing API key)
    if (!provider.available()) {
      continue;
    }
    
    // Skip if model is currently exhausted (task-specific check)
    if (isExhausted(c.provider, c.model, task)) {
      const modelInfo = getModelInfo(c.model);
      console.log(
        `[AI Router] ⏭️  Skipping ${c.provider}/${c.model} for ${task} (${modelInfo.description || 'exhausted'})`
      );
      continue;
    }
    
    out.push(c);
  }
  
  if (out.length === 0) {
    throw new AIError(
      "All AI models are temporarily exhausted. Please wait a few minutes and try again.",
      503,
      false,
      "rate_limit",
    );
  }
  
  const modelList = out.map(c => `${c.provider}/${c.model}`).join(', ');
  console.log(`[AI Router] 🎯 Resolved ${out.length} candidates for "${task}" (${category}): ${modelList}`);
  return out;
}

const MAX_RETRIES = 2;
const MAX_BACKOFF_MS = 5000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Backoff before the next retry: honor a provider `Retry-After` hint (rate
 *  limits) when present, otherwise exponential with jitter. Capped so a single
 *  call can't stall the request — if the limit persists we fall back to the
 *  next (free) candidate instead of waiting it out. */
function backoffMs(attempt: number, err: unknown): number {
  if (err instanceof AIError && err.retryAfterMs != null) {
    return Math.min(MAX_BACKOFF_MS, Math.max(250, err.retryAfterMs));
  }
  return Math.min(MAX_BACKOFF_MS, 250 * 2 ** attempt + Math.random() * 250);
}

/**
 * After every candidate has failed, turn the raw provider error into a clean,
 * user-facing one for the common exhaustion cases — so the UI shows actionable
 * guidance instead of raw provider JSON ("Gemini request failed (429). {…}").
 * Non-exhaustion errors pass through unchanged.
 */
function exhaustedError(lastErr: unknown): Error {
  if (lastErr instanceof AIError) {
    if (lastErr.kind === "rate_limit") {
      return new AIError(
        "AI service is temporarily at capacity. Please wait 30 seconds and try again.",
        429,
        false,
        "rate_limit",
        30000,
      );
    }
    if (lastErr.kind === "credit") {
      return new AIError(
        "AI service quota reached. Please wait a few minutes before retrying.",
        402,
        false,
        "credit",
      );
    }
    return lastErr;
  }
  return lastErr instanceof Error
    ? lastErr
    : new AIError("AI generation temporarily unavailable. Please try again in a moment.", 502, false, "outage");
}

/** A throttled free model often advertises a long Retry-After (20-60s); burning
 *  the full retry budget waiting it out is pointless when we have other,
 *  independent candidates to fail over to. Skip retries on rate-limits entirely. */
const RATE_LIMIT_RETRIES = 0;

/** Retry a call on transient (retryable) errors with backoff. */
async function withRetries<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= MAX_RETRIES; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      // Non-AIError (network/abort) is treated as retryable; AIError carries its flag.
      const retryable = err instanceof AIError ? err.retryable : true;
      // Fail over to the next candidate quickly when a model is rate-limited.
      const budget = err instanceof AIError && err.kind === "rate_limit" ? RATE_LIMIT_RETRIES : MAX_RETRIES;
      if (!retryable || i >= budget) throw err;
      await sleep(backoffMs(i, err));
    }
  }
  throw lastErr;
}

export interface RunOptions {
  task: RouterTask;
  messages: ChatMessage[];
  temperature?: number;
  jsonMode?: boolean;
  /** Override the computed output budget (rarely needed). */
  maxTokens?: number;
  signal?: AbortSignal;
  /** When set, usage/cost is logged to ai_usage owned by this user. */
  log?: { supabase: SupabaseClient<Database>; userId: string };
}

/**
 * Full text completion. Tries each candidate in order; retries transient
 * errors; falls back on outage. Credit (402) errors are surfaced immediately.
 */
export async function run(opts: RunOptions): Promise<ChatResult> {
  const candidates = resolveCandidates(opts.task);
  const inputTokens = messagesTokens(opts.messages);
  let lastErr: unknown;
  let previousModel: string | undefined;

  for (const c of candidates) {
    const provider = PROVIDERS[c.provider];
    const budget = opts.maxTokens ?? outputBudget(opts.task, inputTokens, c.model);
    const params: CompletionParams = {
      model: c.model,
      messages: opts.messages,
      temperature: opts.temperature,
      maxTokens: providerMaxTokens(c.provider, budget),
      jsonMode: opts.jsonMode,
      signal: opts.signal,
    };
    try {
      console.log(`[AI Router] Attempting ${c.provider}/${c.model} for task "${opts.task}"`);
      
      // Trace model rotation if switching from a previous model
      if (previousModel && previousModel !== c.model) {
        void traceModelRotation({
          task: opts.task,
          fromModel: previousModel,
          toModel: c.model,
          reason: lastErr instanceof Error ? lastErr.message : "fallback",
        });
      }
      
      const result = await withRetries(() => provider.chat(params));
      console.log(`[AI Router] ✅ Success with ${result.provider}/${result.model}`);
      if (opts.log) {
        await logUsage(opts.log.supabase, {
          userId: opts.log.userId,
          task: opts.task,
          provider: result.provider,
          model: result.model,
          usage: result.usage,
        });
      }
      void traceCompletion({
        task: opts.task,
        messages: opts.messages,
        result,
        userId: opts.log?.userId,
      });
      return result;
    } catch (err) {
      lastErr = err;
      previousModel = c.model;
      const errMsg = err instanceof AIError ? `${err.kind} (${err.status})` : 'unknown error';
      console.log(`[AI Router] ❌ Failed with ${c.provider}/${c.model}: ${errMsg}`);
      
      // Mark model as exhausted in quota tracker (task-specific)
      if (err instanceof AIError && (err.kind === "rate_limit" || err.kind === "quota")) {
        const reason = err.message || `${err.kind} error`;
        markExhausted(c.provider, c.model, err.kind, opts.task, reason);
        console.log(`[AI Router] ⚠️  ${c.model} ${err.kind} for task "${opts.task}", rotating to next candidate...`);
        
        // Trace quota exhaustion event
        void traceQuotaExhaustion({
          provider: c.provider,
          model: c.model,
          task: opts.task,
          errorType: err.kind,
          reason,
        });
      }
      
      // A paid 402 is the real problem we're fixing — never silently retry it
      // on a fallback provider; surface so the user sees the true cause.
      if (err instanceof AIError && err.kind === "credit") throw err;
      // Otherwise (outage / exhausted retries) move to the next candidate.
    }
  }
  throw exhaustedError(lastErr);
}

/**
 * Structured output: ask for JSON, validate with a Zod schema, repair once.
 * Returns the parsed data plus the raw ChatResult (so callers can persist the
 * actual model that served the request).
 */
export async function runObject<T>(
  opts: RunOptions,
  schema: ZodType<T>,
): Promise<{ data: T; result: ChatResult }> {
  const messages = [...opts.messages];

  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await run({ ...opts, messages, jsonMode: true });
    try {
      return { data: schema.parse(parseJsonLoose(result.text)), result };
    } catch (err) {
      if (attempt === 1) {
        throw new AIError(
          `The AI returned data that did not match the expected format. ${
            err instanceof Error ? err.message : ""
          }`,
          502,
          false,
          "bad_response",
        );
      }
      messages.push(
        { role: "assistant", content: result.text },
        {
          role: "user",
          content:
            "That response could not be parsed as the required JSON. Reply with ONLY valid JSON matching the requested schema — no prose, no code fences.",
        },
      );
    }
  }
  throw new AIError("Failed to generate structured output.", 502, false, "bad_response");
}

/**
 * Streaming completion → a UTF-8 text stream of delta content for Route
 * Handlers. Usage is logged (estimated from streamed output) when the stream
 * finishes. Candidate fallback applies to the initial connection only; a
 * mid-stream failure cannot be retried.
 */
export async function runStream(opts: RunOptions): Promise<ReadableStream<Uint8Array>> {
  const candidates = resolveCandidates(opts.task);
  const inputTokens = messagesTokens(opts.messages);
  let lastErr: unknown;
  let previousModel: string | undefined;

  for (const c of candidates) {
    const provider = PROVIDERS[c.provider];
    const budget = opts.maxTokens ?? outputBudget(opts.task, inputTokens, c.model);
    const params: CompletionParams = {
      model: c.model,
      messages: opts.messages,
      temperature: opts.temperature,
      maxTokens: providerMaxTokens(c.provider, budget),
      signal: opts.signal,
    };
    try {
      console.log(`[AI Router Stream] Attempting ${c.provider}/${c.model} for task "${opts.task}"`);
      
      // Trace model rotation if switching from a previous model
      if (previousModel && previousModel !== c.model) {
        void traceModelRotation({
          task: opts.task,
          fromModel: previousModel,
          toModel: c.model,
          reason: lastErr instanceof Error ? lastErr.message : "fallback",
        });
      }
      
      const raw = await withRetries(() => provider.stream(params));
      console.log(`[AI Router Stream] ✅ Success with ${c.provider}/${c.model}`);
      if (!opts.log) return raw;
      return tapUsage(raw, opts.log, opts.task, c.provider, c.model, inputTokens);
    } catch (err) {
      lastErr = err;
      previousModel = c.model;
      const errMsg = err instanceof AIError ? `${err.kind} (${err.status})` : 'unknown error';
      console.log(`[AI Router Stream] ❌ Failed with ${c.provider}/${c.model}: ${errMsg}`);
      
      // Mark model as exhausted in quota tracker (task-specific)
      if (err instanceof AIError && (err.kind === "rate_limit" || err.kind === "quota")) {
        const reason = err.message || `${err.kind} error`;
        markExhausted(c.provider, c.model, err.kind, opts.task, reason);
        console.log(`[AI Router Stream] ⚠️  ${c.model} ${err.kind} for task "${opts.task}", rotating to next candidate...`);
        
        // Trace quota exhaustion event
        void traceQuotaExhaustion({
          provider: c.provider,
          model: c.model,
          task: opts.task,
          errorType: err.kind,
          reason,
        });
      }
      
      if (err instanceof AIError && err.kind === "credit") throw err;
    }
  }
  throw exhaustedError(lastErr);
}

/** Pass bytes through unchanged; log estimated usage when the stream ends. */
function tapUsage(
  src: ReadableStream<Uint8Array>,
  log: NonNullable<RunOptions["log"]>,
  task: RouterTask,
  provider: string,
  model: string,
  inputTokens: number,
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  let chars = 0;
  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      chars += decoder.decode(chunk, { stream: true }).length;
      controller.enqueue(chunk);
    },
    async flush() {
      await logUsage(log.supabase, {
        userId: log.userId,
        task,
        provider,
        model,
        usage: { inputTokens, outputTokens: Math.ceil(chars / 4) },
      });
    },
  });
  return src.pipeThrough(transform);
}

export const aiRouter = { run, runObject, runStream };
