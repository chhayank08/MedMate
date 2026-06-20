import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { guard, errorMessage } from "@/lib/api";
import { aiRouter } from "@/lib/ai/router";
import { AIError } from "@/lib/ai/providers/types";
import { extractScheduleMessages } from "@/lib/ai/prompts";
import { extractScheduleRequestSchema, extractedScheduleSchema } from "@/lib/validations/ai";

export async function POST(req: NextRequest) {
  const auth = await guard("ai:extract-schedule", { limit: 10 });
  if (!auth.ok) return auth.response;
  const { user, supabase } = auth;

  let input;
  try {
    input = extractScheduleRequestSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 400 });
  }

  if (!input.text && !input.imageBase64) {
    return NextResponse.json({ error: "Provide text or an image to extract from." }, { status: 400 });
  }

  try {
    const { data } = await aiRouter.runObject(
      {
        task: "extract_schedule",
        messages: extractScheduleMessages({ text: input.text, imageBase64: input.imageBase64 }),
        temperature: 0.2,
        log: { supabase, userId: user.id },
      },
      extractedScheduleSchema,
    );
    return NextResponse.json(data);
  } catch (err) {
    const status = err instanceof AIError ? err.status : 500;
    return NextResponse.json({ error: errorMessage(err) }, { status });
  }
}
