/**
 * Aggregations over `ai_usage` for cost/usage analytics. Data is captured on
 * every AI call by the router; this surfaces it (e.g. a future Settings or
 * Analytics panel) without requiring any UI changes now.
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export interface UsageBucket {
  key: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface UsageSummary {
  totalCalls: number;
  totalCostUsd: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  byModel: UsageBucket[];
  byTask: UsageBucket[];
  byProvider: UsageBucket[];
}

/** Summarize a user's AI usage over the last `days` days. */
export async function getUsageSummary(
  supabase: SupabaseClient<Database>,
  userId: string,
  days = 30,
): Promise<UsageSummary> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from("ai_usage")
    .select("task, provider, model, input_tokens, output_tokens, cost_usd")
    .eq("user_id", userId)
    .gte("created_at", since);
  if (error) throw error;

  const rows = data ?? [];
  const summary: UsageSummary = {
    totalCalls: rows.length,
    totalCostUsd: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    byModel: [],
    byTask: [],
    byProvider: [],
  };

  const buckets = { model: new Map<string, UsageBucket>(), task: new Map<string, UsageBucket>(), provider: new Map<string, UsageBucket>() };
  const add = (map: Map<string, UsageBucket>, key: string, r: (typeof rows)[number]) => {
    const b = map.get(key) ?? { key, calls: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 };
    b.calls += 1;
    b.inputTokens += r.input_tokens;
    b.outputTokens += r.output_tokens;
    b.costUsd = Number((b.costUsd + r.cost_usd).toFixed(6));
    map.set(key, b);
  };

  for (const r of rows) {
    summary.totalCostUsd = Number((summary.totalCostUsd + r.cost_usd).toFixed(6));
    summary.totalInputTokens += r.input_tokens;
    summary.totalOutputTokens += r.output_tokens;
    add(buckets.model, r.model, r);
    add(buckets.task, r.task, r);
    add(buckets.provider, r.provider, r);
  }

  const sort = (m: Map<string, UsageBucket>) =>
    Array.from(m.values()).sort((a, b) => b.costUsd - a.costUsd);
  summary.byModel = sort(buckets.model);
  summary.byTask = sort(buckets.task);
  summary.byProvider = sort(buckets.provider);
  return summary;
}
