/**
 * Central observability facade.
 * Fires traces to every enabled backend (Langfuse, LangSmith).
 * All failures are swallowed — observability must never break the app.
 */
import "server-only";
import type { ChatMessage, ChatResult } from "@/lib/ai/providers/types";
import type { RouterTask } from "@/lib/ai/router";

export interface TraceOptions {
  task: RouterTask;
  messages: ChatMessage[];
  result: ChatResult;
  userId?: string;
}

export interface QuotaEventOptions {
  provider: string;
  model: string;
  task: string;
  errorType: "rate_limit" | "quota" | "credit";
  reason?: string;
  cooldownMs?: number;
}

export interface ModelRotationOptions {
  task: string;
  fromModel: string;
  toModel: string;
  reason: string;
}

export async function traceCompletion(opts: TraceOptions): Promise<void> {
  const { task, messages, result, userId } = opts;

  const backends: Promise<void>[] = [];

  if (process.env.LANGFUSE_PUBLIC_KEY) {
    backends.push(
      import("./langfuse").then((m) => m.langfuseTrace(task, messages, result, userId)),
    );
  }

  if (process.env.LANGSMITH_API_KEY) {
    backends.push(
      import("./langsmith").then((m) => m.langsmithTrace(task, messages, result, userId)),
    );
  }

  await Promise.allSettled(backends);
}

export async function traceQuotaExhaustion(opts: QuotaEventOptions): Promise<void> {
  const backends: Promise<void>[] = [];

  if (process.env.LANGFUSE_PUBLIC_KEY) {
    backends.push(
      import("./langfuse")
        .then((m) => m.langfuseQuotaEvent?.(opts))
        .catch(() => {}),
    );
  }

  await Promise.allSettled(backends);
}

export async function traceModelRotation(opts: ModelRotationOptions): Promise<void> {
  const backends: Promise<void>[] = [];

  if (process.env.LANGFUSE_PUBLIC_KEY) {
    backends.push(
      import("./langfuse")
        .then((m) => m.langfuseRotationEvent?.(opts))
        .catch(() => {}),
    );
  }

  await Promise.allSettled(backends);
}
