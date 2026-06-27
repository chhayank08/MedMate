import { NextResponse, type NextRequest } from "next/server";
import { guard, errorMessage } from "@/lib/api";
import { AIError } from "@/lib/ai/providers/types";
import { resolveStudyMaterial } from "@/lib/rag/source";
import { summaryRequestSchema } from "@/lib/validations/ai";
import { getAcademicProfile, academicContext } from "@/lib/ai/academic-context";
import { getSummaryProfile } from "@/lib/ai/summary-profiles";
import { summarizeLarge } from "@/lib/ai/summarize-large";
import { generateFlashcards } from "@/lib/ai/flashcards-batch";
import { STREAM_DONE_MARKER, STREAM_HEARTBEAT_MARKER } from "@/lib/constants";
import { checkTierLimit, incrementUsage } from "@/lib/services/tier-limits";

export const runtime = "nodejs";
export const maxDuration = 300;

const HEARTBEAT_MS = 10_000;

export async function POST(req: NextRequest) {
  const auth = await guard("ai:summary", { limit: 100, windowMs: 60_000 });
  if (!auth.ok) return auth.response;
  const { user, supabase } = auth;

  // Check tier limits
  const limitCheck = await checkTierLimit(user.id, 'generate_summary');
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
    input = summaryRequestSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 400 });
  }

  try {
    // Get user's enabled domains and subjects
    const { data: userDomains } = await supabase.from('user_domains').select('domain_id');
    const domainIds = (userDomains || []).map(d => d.domain_id);
    
    if (domainIds.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one domain in settings before generating summaries' },
        { status: 400 }
      );
    }

    const { data: userSubjects } = await supabase
      .from('user_subjects')
      .select('subject_id, subjects!inner(subject_id, name, domain_id)');
    
    type SubjectData = { subject_id: string; name: string; domain_id: string };
    const enabledSubjects: SubjectData[] = [];
    
    if (userSubjects) {
      for (const us of userSubjects) {
        if (us.subjects && typeof us.subjects === 'object' && 'subject_id' in us.subjects) {
          enabledSubjects.push(us.subjects as unknown as SubjectData);
        }
      }
    }
    
    if (enabledSubjects.length === 0) {
      return NextResponse.json(
        { error: 'Please enable at least one subject in settings before generating summaries' },
        { status: 400 }
      );
    }

    const targetDomainId = domainIds[0];
    const targetSubjectId = enabledSubjects.find(s => s.domain_id === targetDomainId)?.subject_id || enabledSubjects[0]?.subject_id;

    const primarySubject = input.subjects?.[0] ?? input.subject ?? null;

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
    const log = { supabase, userId: user.id };

    if (getSummaryProfile(input.type).kind === "flashcards") {
      const data = await generateFlashcards({
        material,
        subject: input.subject,
        subjects: input.subjects,
        customTopics: input.customTopics,
        academicContext: ctx || undefined,
        log,
        signal: req.signal,
      });
      await incrementUsage(user.id, 'summary');
      return NextResponse.json(data);
    }

    const iterator = summarizeLarge({
      type: input.type,
      material,
      subject: input.subject,
      subjects: input.subjects,
      customTopics: input.customTopics,
      academicContext: ctx || undefined,
      log,
      signal: req.signal,
    });

    let primed: IteratorResult<string>;
    try {
      primed = await iterator.next();
    } catch (err) {
      const status = err instanceof AIError ? err.status : 500;
      return NextResponse.json({ error: errorMessage(err) }, { status });
    }

    const encoder = new TextEncoder();
    const heartbeatBytes = encoder.encode(STREAM_HEARTBEAT_MARKER);
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let alive = true;
        const heartbeat = setInterval(() => {
          if (!alive) return;
          try {
            controller.enqueue(heartbeatBytes);
          } catch {
            alive = false;
          }
        }, HEARTBEAT_MS);
        try {
          let step = primed;
          for (;;) {
            if (step.done) break;
            if (step.value) controller.enqueue(encoder.encode(step.value));
            step = await iterator.next();
          }
          controller.enqueue(encoder.encode(STREAM_DONE_MARKER));
          await incrementUsage(user.id, 'summary');
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Generation failed.";
          controller.enqueue(encoder.encode(`\n\n_⚠️ Generation stopped: ${msg}_`));
        } finally {
          alive = false;
          clearInterval(heartbeat);
          controller.close();
        }
      },
      async cancel() {
        await iterator.return?.(undefined);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    const status = err instanceof AIError ? err.status : 500;
    return NextResponse.json({ error: errorMessage(err) }, { status });
  }
}
