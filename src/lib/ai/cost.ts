/**
 * Cost accounting for AI calls. The router calls `logUsage` after every
 * completion. Logging is best-effort: any failure (e.g. the `ai_usage` table
 * not migrated yet, or no Supabase client available) is swallowed so it can
 * never break a user-facing generation.
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { TokenUsage } from "@/lib/ai/providers/types";
import type { BudgetTask } from "@/lib/ai/budget";

/** USD per 1M tokens, {input, output}, keyed by a model substring match. */
const PRICES: { match: string; input: number; output: number }[] = [
  // Gemini Flash — the bulk workload, far cheaper than Claude 3.5.
  { match: "gemini-2.5-flash", input: 0.3, output: 2.5 },
  { match: "gemini-2.0-flash", input: 0.1, output: 0.4 },
  { match: "gemini-1.5-flash", input: 0.075, output: 0.3 },
  { match: "gemini-1.5-pro", input: 1.25, output: 5 },
  { match: "gemini-embedding-001", input: 0.15, output: 0.0 },
  { match: "text-embedding-004", input: 0.0, output: 0.0 },
  // Routed through OpenRouter (approx list prices).
  { match: "claude-sonnet-4", input: 3, output: 15 },
  { match: "claude-3.5-sonnet", input: 3, output: 15 },
  { match: "claude-3-5-sonnet", input: 3, output: 15 },
  { match: "gpt-4.1", input: 2, output: 8 },
  { match: "gpt-4o", input: 2.5, output: 10 },
];

const DEFAULT_PRICE = { input: 1, output: 3 };

export function priceFor(model: string): { input: number; output: number } {
  const m = model.toLowerCase();
  return PRICES.find((p) => m.includes(p.match)) ?? DEFAULT_PRICE;
}

/** Estimated USD cost for a single completion. */
export function costUsd(model: string, usage: TokenUsage): number {
  const price = priceFor(model);
  const cost =
    (usage.inputTokens / 1_000_000) * price.input +
    (usage.outputTokens / 1_000_000) * price.output;
  return Number(cost.toFixed(6));
}

export interface UsageRecord {
  userId: string;
  task: BudgetTask;
  provider: string;
  model: string;
  usage: TokenUsage;
  cacheHit?: boolean;
}

/**
 * Persist one usage row. Best-effort — never throws. Pass the request's
 * RLS-scoped Supabase client so the row is owned by the user.
 */
export async function logUsage(
  supabase: SupabaseClient<Database>,
  record: UsageRecord,
): Promise<void> {
  try {
    await supabase.from("ai_usage").insert({
      user_id: record.userId,
      task: record.task,
      provider: record.provider,
      model: record.model,
      input_tokens: record.usage.inputTokens,
      output_tokens: record.usage.outputTokens,
      cost_usd: costUsd(record.model, record.usage),
      cache_hit: record.cacheHit ?? false,
    });
  } catch {
    // Telemetry must never break generation.
  }
}
