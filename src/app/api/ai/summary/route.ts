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

// Large documents are summarized section-by-section (many sequential calls), so
// allow a generous execution window on platforms that honor it.
export const runtime = "nodejs";
export const maxDuration = 300;

/** Emit a heartbeat at least this often so the connection never goes idle while
 *  a single (slow) provider call is in flight. Must stay well under both the
 *  client stall guard (120s) and typical proxy idle timeouts. */
const HEARTBEAT_MS = 10_000;

export async function POST(req: NextRequest) {
  const auth = await guard("ai:summary", { limit: 100, windowMs: 60_000 });
  if (!auth.ok) return auth.response;
  const { user, supabase } = auth;

  let input;
  try {
    input = summaryRequestSchema.parse(await req.json());
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
        // Summaries must represent the WHOLE document — chunking happens inside
        // the generators, so never RAG-reduce (which would drop sections).
        coverage: "full",
      }),
      getAcademicProfile(supabase, user.id),
    ]);
    const ctx = academicContext(profile);
    const log = { supabase, userId: user.id };

    // Flashcards: batched, validated JSON — always real Q&A pairs, never prose.
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
      return NextResponse.json(data);
    }

    // All other types stream Markdown via the chunked map-reduce pipeline.
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

    // Prime the generator so an upfront failure (config / immediate 402 /
    // credit) surfaces as a proper HTTP error instead of a broken 200 stream.
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
        // Heartbeat: while a single section/reduce call is in flight the
        // generator yields nothing, so push an (invisible, client-stripped)
        // marker on an interval to keep the connection from idling out
        // mid-stream (→ ERR_INCOMPLETE_CHUNKED_ENCODING).
        let alive = true;
        const heartbeat = setInterval(() => {
          if (!alive) return;
          try {
            controller.enqueue(heartbeatBytes);
          } catch {
            // Controller already closed — stop beating.
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
          // Success sentinel: only here does the client treat output complete.
          controller.enqueue(encoder.encode(STREAM_DONE_MARKER));
        } catch (err) {
          // Mid-stream failure: surface a short note, then close WITHOUT the
          // sentinel so the client marks the result incomplete (offers retry)
          // and never saves a truncated summary.
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
