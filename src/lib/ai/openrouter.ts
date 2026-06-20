/**
 * Back-compat shim. The AI entry point is now `@/lib/ai/router` and the
 * provider adapters live in `@/lib/ai/providers/*`. This file remains so that
 * existing imports (and a single shared `AIError` class) keep working, and
 * delegates to the router. Prefer importing from `@/lib/ai/router` in new code.
 */
import "server-only";
import type { ZodType } from "zod";
import { run, runStream, runObject } from "@/lib/ai/router";
import type { BudgetTask } from "@/lib/ai/budget";

export { AIError } from "@/lib/ai/providers/types";
export type { ChatMessage, ChatRole, CompletionParams } from "@/lib/ai/providers/types";

/** @deprecated Use `aiRouter.run`. Kept for backward compatibility. */
export async function chatCompletion(opts: {
  messages: import("@/lib/ai/providers/types").ChatMessage[];
  task?: BudgetTask;
  temperature?: number;
  jsonMode?: boolean;
  signal?: AbortSignal;
}): Promise<string> {
  const { text } = await run({
    task: opts.task ?? "coach",
    messages: opts.messages,
    temperature: opts.temperature,
    jsonMode: opts.jsonMode,
    signal: opts.signal,
  });
  return text;
}

/** @deprecated Use `aiRouter.runStream`. */
export async function streamCompletion(opts: {
  messages: import("@/lib/ai/providers/types").ChatMessage[];
  task?: BudgetTask;
  temperature?: number;
  signal?: AbortSignal;
}): Promise<ReadableStream<Uint8Array>> {
  return runStream({
    task: opts.task ?? "summary",
    messages: opts.messages,
    temperature: opts.temperature,
    signal: opts.signal,
  });
}

/** @deprecated Use `aiRouter.runObject` (returns the served model too). */
export async function generateObject<T>(
  opts: {
    messages: import("@/lib/ai/providers/types").ChatMessage[];
    task?: BudgetTask;
    temperature?: number;
    signal?: AbortSignal;
  },
  schema: ZodType<T>,
): Promise<T> {
  const { data } = await runObject(
    {
      task: opts.task ?? "coach",
      messages: opts.messages,
      temperature: opts.temperature,
      signal: opts.signal,
    },
    schema,
  );
  return data;
}
