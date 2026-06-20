import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/api";
import { extractText } from "@/lib/files/extract";
import { indexDocument } from "@/lib/rag/index-document";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  const auth = await guard("parse-file", { limit: 30, windowMs: 60_000 });
  if (!auth.ok) return auth.response;
  const { user, supabase } = auth;

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 10 MB)." }, { status: 400 });
  }

  // Opt-in: index the extracted text for RAG and return a documentId.
  const shouldIndex = formData.get("index") === "true";

  try {
    const bytes = await file.arrayBuffer();
    const { text } = await extractText({ name: file.name.toLowerCase(), bytes });

    let documentId: string | undefined;
    if (shouldIndex) {
      try {
        const res = await indexDocument({
          supabase,
          userId: user.id,
          title: file.name,
          text,
          sourceType: "upload",
          fileType: file.type || null,
        });
        documentId = res.documentId;
      } catch (err) {
        // Indexing is best-effort — still return the extracted text.
        console.error("[parse-file] indexing failed", err);
      }
    }

    // Cap at 200 000 chars (the summary input max) for the inline text response.
    return NextResponse.json({ text: text.slice(0, 200_000), documentId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to extract text from file.";
    const status = /unsupported/i.test(message) ? 400 : /no readable text/i.test(message) ? 422 : 500;
    if (status === 500) console.error("[parse-file]", err);
    
    // User-friendly error messages
    let userMessage = message;
    if (status === 400) {
      userMessage = "File type not supported. Please upload PDF, DOCX, TXT, MD, or image files.";
    } else if (status === 422) {
      userMessage = "No readable text found in file. Please try a different file.";
    } else {
      userMessage = "Failed to process file. Please try again.";
    }
    
    return NextResponse.json({ error: userMessage }, { status });
  }
}
