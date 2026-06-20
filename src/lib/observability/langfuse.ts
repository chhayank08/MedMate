import "server-only";
import type { ChatMessage, ChatResult } from "@/lib/ai/providers/types";
import type { RouterTask } from "@/lib/ai/router";

let _client: import("langfuse").Langfuse | null = null;

function client() {
  if (!process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_SECRET_KEY) return null;
  if (!_client) {
    const { Langfuse } = require("langfuse");
    _client = new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      ...(process.env.LANGFUSE_HOST ? { baseUrl: process.env.LANGFUSE_HOST } : {}),
      flushAt: 1,
    });
  }
  return _client;
}

export async function langfuseTrace(
  task: RouterTask,
  messages: ChatMessage[],
  result: ChatResult,
  userId?: string,
) {
  const lf = client();
  if (!lf) return;
  try {
    const trace = lf.trace({ name: task, userId });
    trace.generation({
      name: `${task}/${result.model}`,
      model: result.model ?? task,
      input: messages,
      output: result.text,
      usage: {
        promptTokens: result.usage?.inputTokens,
        completionTokens: result.usage?.outputTokens,
      },
      metadata: { provider: result.provider },
    });
    await lf.flushAsync();
  } catch {
    // Observability must never break the app.
  }
}

export async function langfuseQuotaEvent(opts: {
  provider: string;
  model: string;
  task: string;
  errorType: string;
  reason?: string;
}) {
  const lf = client();
  if (!lf) return;
  try {
    const trace = lf.trace({ name: "quota_exhaustion" });
    trace.event({
      name: `quota_${opts.errorType}`,
      metadata: {
        provider: opts.provider,
        model: opts.model,
        task: opts.task,
        errorType: opts.errorType,
        reason: opts.reason,
        timestamp: new Date().toISOString(),
      },
    });
    await lf.flushAsync();
  } catch {
    // Observability must never break the app.
  }
}

export async function langfuseRotationEvent(opts: {
  task: string;
  fromModel: string;
  toModel: string;
  reason: string;
}) {
  const lf = client();
  if (!lf) return;
  try {
    const trace = lf.trace({ name: "model_rotation" });
    trace.event({
      name: "model_fallback",
      metadata: {
        task: opts.task,
        fromModel: opts.fromModel,
        toModel: opts.toModel,
        reason: opts.reason,
        timestamp: new Date().toISOString(),
      },
    });
    await lf.flushAsync();
  } catch {
    // Observability must never break the app.
  }
}
