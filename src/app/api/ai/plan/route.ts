import { NextResponse, type NextRequest } from "next/server";
import { guard, errorMessage } from "@/lib/api";
import { aiRouter } from "@/lib/ai/router";
import { AIError } from "@/lib/ai/providers/types";
import { studyPlanMessages } from "@/lib/ai/prompts";
import { planRequestSchema, generatedPlanSchema } from "@/lib/validations/ai";
import type { Json } from "@/types/database.types";
import { getAcademicProfile, academicContext } from "@/lib/ai/academic-context";

export async function POST(req: NextRequest) {
  const auth = await guard("ai:plan", { limit: 100 });
  if (!auth.ok) return auth.response;
  const { user, supabase } = auth;

  let input;
  try {
    input = planRequestSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 400 });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const profile = await getAcademicProfile(supabase, user.id);
    const ctx = academicContext(profile);
    const { data: plan, result } = await aiRouter.runObject(
      {
        task: "plan",
        messages: studyPlanMessages({
          examDate: input.examDate,
          todayDate: today,
          subjects: input.subjects,
          hoursPerDay: input.hoursPerDay,
          notes: input.notes,
          academicContext: ctx || undefined,
        }),
        temperature: 0.6,
        log: { supabase, userId: user.id },
      },
      generatedPlanSchema,
    );

    // Only one active plan at a time.
    await supabase.from("study_plans").update({ active: false }).eq("active", true);

    const { data, error } = await supabase
      .from("study_plans")
      .insert({
        user_id: user.id,
        title: plan.title || "Study Plan",
        exam_date: input.examDate,
        subjects: input.subjects as unknown as Json,
        hours_per_day: input.hoursPerDay,
        plan: plan as unknown as Json,
        model: result.model ?? null,
        active: true,
      })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ planId: data.id });
  } catch (err) {
    const status = err instanceof AIError ? err.status : 500;
    return NextResponse.json({ error: errorMessage(err) }, { status });
  }
}
