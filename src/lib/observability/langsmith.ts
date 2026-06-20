import "server-only";
import type { ChatMessage, ChatResult } from "@/lib/ai/providers/types";
import type { RouterTask } from "@/lib/ai/router";

export async function langsmithTrace(
  task: RouterTask,
  messages: ChatMessage[],
  result: ChatResult,
  userId?: string,
) {
  if (!process.env.LANGSMITH_API_KEY) return;
  try {
    const { Client } = await import("langsmith");
    const ls = new Client({ apiKey: process.env.LANGSMITH_API_KEY });
    const project = process.env.LANGSMITH_PROJECT || "medmate";
    const startTime = new Date();
    await ls.createRun({
      name: task,
      run_type: "llm",
      project_name: project,
      inputs: { messages },
      outputs: { text: result.text },
      start_time: startTime.getTime(),
      end_time: Date.now(),
      extra: {
        metadata: {
          model: result.model,
          provider: result.provider,
          userId,
          input_tokens: result.usage?.inputTokens,
          output_tokens: result.usage?.outputTokens,
        },
      },
    });
  } catch {
    // Observability must never break the app.
  }
}
