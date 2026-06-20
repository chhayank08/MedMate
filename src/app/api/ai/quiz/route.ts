import { NextResponse, type NextRequest } from "next/server";
import { guard, errorMessage } from "@/lib/api";
import { AIError } from "@/lib/ai/providers/types";
import { generateQuiz } from "@/lib/ai/quiz-batch";
import { resolveStudyMaterial } from "@/lib/rag/source";
import { cacheKey, getCachedResponse, putCachedResponse } from "@/lib/ai/response-cache";
import { quizRequestSchema, type GeneratedQuiz } from "@/lib/validations/ai";
import { getAcademicProfile, academicContext } from "@/lib/ai/academic-context";

// Quiz generation runs several sequential batched calls, so allow a generous
// execution window (the vercel.json functions config sets the platform cap).
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const auth = await guard("ai:quiz", { limit: 100 });
  if (!auth.ok) return auth.response;
  const { user, supabase } = auth;

  let input;
  try {
    input = quizRequestSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 400 });
  }

  try {
    const primarySubject = input.subjects?.[0] ?? input.subject ?? null;

    const [{ material }, profile] = await Promise.all([
      resolveStudyMaterial({
        supabase,
        userId: user.id,
        sourceText: input.sourceText,
        subject: primarySubject,
        documentId: input.documentId,
        title: input.title,
        // Quiz is generated section-by-section (batched), so feed the WHOLE
        // document — top-k retrieval would ignore most of the user's input.
        coverage: "full",
      }),
      getAcademicProfile(supabase, user.id),
    ]);
    const ctx = academicContext(profile);

    // Dedupe identical requests within a short TTL (guards double-submits /
    // retries from re-billing tokens). Fresh requests still generate anew.
    const key = cacheKey(user.id, "quiz", {
      material,
      subjects: input.subjects ?? null,
      subject: primarySubject,
      customTopics: input.customTopics ?? null,
      difficulty: input.difficulty,
      types: input.types,
      numQuestions: input.numQuestions,
      academicContext: ctx || null,
    });
    const cached = await getCachedResponse<{ generated: GeneratedQuiz; model: string | null }>(
      supabase,
      key,
    );

    let generated: GeneratedQuiz;
    let model: string | null;
    if (cached) {
      generated = cached.generated;
      model = cached.model;
    } else {
      // Generate in small batches (free-tier safe, never truncates the JSON);
      // large material is covered section-by-section so all input is used.
      const out = await generateQuiz({
        material,
        subject: input.subject,
        subjects: input.subjects,
        customTopics: input.customTopics,
        difficulty: input.difficulty,
        numQuestions: input.numQuestions,
        types: input.types,
        academicContext: ctx || undefined,
        log: { supabase, userId: user.id },
        signal: req.signal,
      });
      generated = { title: out.title, questions: out.questions };
      model = out.model;
      await putCachedResponse(supabase, key, user.id, "quiz", { generated, model });
    }

    const questions = generated.questions.slice(0, input.numQuestions);
    const spq = input.secPerQuestion ?? 60;

    const { data: quiz, error: quizErr } = await supabase
      .from("quizzes")
      .insert({
        user_id: user.id,
        title: input.title || generated.title || "Untitled quiz",
        subject: primarySubject,
        difficulty: input.difficulty,
        num_questions: questions.length,
        timed: input.timed,
        time_limit_sec: input.timed ? questions.length * spq : null,
        source_text: input.sourceText ?? null,
        model,
        note_id: input.noteId ?? null,
      })
      .select()
      .single();
    if (quizErr) throw quizErr;

    const rows = questions.map((q, i) => {
      const options =
        q.type === "true_false"
          ? ["True", "False"]
          : q.type === "mcq"
            ? (q.options ?? [])
            : null;
      return {
        quiz_id: quiz.id,
        user_id: user.id,
        position: i,
        type: q.type,
        prompt: q.prompt,
        options,
        correct_answer: q.correct_answer,
        explanation: q.explanation || null,
      };
    });

    const { error: qErr } = await supabase.from("questions").insert(rows);
    if (qErr) throw qErr;

    return NextResponse.json({ quizId: quiz.id });
  } catch (err) {
    const status = err instanceof AIError ? err.status : 500;
    return NextResponse.json({ error: errorMessage(err) }, { status });
  }
}
