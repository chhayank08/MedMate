import { NextResponse, type NextRequest } from "next/server";
import { guard, errorMessage } from "@/lib/api";
import { AIError } from "@/lib/ai/providers/types";
import { generateQuiz } from "@/lib/ai/quiz-batch";
import { resolveStudyMaterial } from "@/lib/rag/source";
import { cacheKey, getCachedResponse, putCachedResponse } from "@/lib/ai/response-cache";
import { quizRequestSchema, type GeneratedQuiz } from "@/lib/validations/ai";
import { getAcademicProfile, academicContext } from "@/lib/ai/academic-context";
import { checkTierLimit, incrementUsage } from "@/lib/services/tier-limits";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const auth = await guard("ai:quiz", { limit: 100 });
  if (!auth.ok) return auth.response;
  const { user, supabase } = auth;

  // Check tier limits before generation
  const limitCheck = await checkTierLimit(user.id, 'generate_quiz');
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { 
        error: limitCheck.reason,
        upgradeRequired: limitCheck.upgradeRequired,
        currentUsage: limitCheck.currentUsage,
        limit: limitCheck.limit
      },
      { status: 402 }
    );
  }

  let input;
  try {
    input = quizRequestSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 400 });
  }

  try {
    const primarySubject = input.subjects?.[0] ?? input.subject ?? null;

    // Get user's enabled domains and subjects
    const { data: userDomains } = await supabase.from('user_domains').select('domain_id');
    const domainIds = (userDomains || []).map(d => d.domain_id);
    
    if (domainIds.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one domain in settings before generating quizzes' },
        { status: 400 }
      );
    }

    const { data: userSubjects } = await supabase.from('user_subjects').select('subject_id, subjects(name, domain_id)');
    const enabledSubjects = (userSubjects || []).map(us => us.subjects);
    
    if (enabledSubjects.length === 0) {
      return NextResponse.json(
        { error: 'Please enable at least one subject in settings before generating quizzes' },
        { status: 400 }
      );
    }

    // Default to first enabled domain/subject if not specified
    const targetDomainId = domainIds[0];
    const targetSubjectId = enabledSubjects.find(s => s.domain_id === targetDomainId)?.subject_id || enabledSubjects[0]?.subject_id;

    const [{ material }, profile] = await Promise.all([
      resolveStudyMaterial({
        supabase,
        userId: user.id,
        sourceText: input.sourceText,
        subject: primarySubject,
        documentId: input.documentId,
        title: input.title,
        coverage: "full",
      }),
      getAcademicProfile(supabase, user.id),
    ]);
    const ctx = academicContext(profile);

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
        domain_id: targetDomainId,
        subject_id: targetSubjectId,
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

    // Increment usage counter
    await incrementUsage(user.id, 'quiz');

    return NextResponse.json({ quizId: quiz.id });
  } catch (err) {
    const status = err instanceof AIError ? err.status : 500;
    return NextResponse.json({ error: errorMessage(err) }, { status });
  }
}
