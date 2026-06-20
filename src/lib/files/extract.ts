/**
 * Text extraction pipeline.
 *
 *   PDF   → LlamaParse (LLAMAPARSE_API_KEY) else pdf-parse
 *   DOCX  → mammoth
 *   TXT/MD→ native decode
 *   image → Gemini Vision (the only image-understanding backend; see
 *           gemini-vision.ts). No Tesseract / Google Vision.
 */
import "server-only";
import { extractImageWithGemini } from "@/lib/files/gemini-vision";

export interface ExtractInput {
  name: string;
  bytes: ArrayBuffer;
}

export interface ExtractResult {
  text: string;
  /** How the text was obtained (for logging / debugging). */
  method: string;
}

/** Gemini Vision-native image formats. */
const IMAGE_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};
const IMAGE_EXT = Object.keys(IMAGE_MIME);

function ext(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i).toLowerCase();
}

// ─── PDF ────────────────────────────────────────────────────────────────────
async function extractPdf(bytes: ArrayBuffer): Promise<ExtractResult> {
  if (process.env.LLAMAPARSE_API_KEY) {
    try {
      return { text: await llamaParse(bytes, "document.pdf"), method: "llamaparse" };
    } catch {
      // Fall through to the free parser.
    }
  }
  const { PDFParse } = await import("pdf-parse");
  PDFParse.setWorker("");
  const parser = new PDFParse({ data: bytes, verbosity: 0 });
  const result = await parser.getText();
  return { text: result.text, method: "pdf-parse" };
}

// ─── Premium hooks (no-ops unless keys are set) ───────────────────────────────
async function llamaParse(bytes: ArrayBuffer, filename: string): Promise<string> {
  const key = process.env.LLAMAPARSE_API_KEY!;
  const base = "https://api.cloud.llamaindex.ai/api/parsing";
  const form = new FormData();
  form.append("file", new Blob([bytes]), filename);
  const upload = await fetch(`${base}/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!upload.ok) throw new Error(`LlamaParse upload failed (${upload.status}).`);
  const { id } = await upload.json();

  // Poll until the job completes (bounded).
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const status = await fetch(`${base}/job/${id}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const job = await status.json();
    if (job.status === "SUCCESS") break;
    if (job.status === "ERROR") throw new Error("LlamaParse job failed.");
  }
  const res = await fetch(`${base}/job/${id}/result/markdown`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`LlamaParse result failed (${res.status}).`);
  const data = await res.json();
  return data.markdown ?? "";
}

/** The list of extensions this pipeline can handle, for UI/validation. */
export const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md", ...IMAGE_EXT];

/**
 * Extract plain text from a file's bytes. Throws on unsupported types or when
 * no readable text is found.
 */
export async function extractText(input: ExtractInput): Promise<ExtractResult> {
  const e = ext(input.name);

  let result: ExtractResult;
  if (e === ".pdf") {
    result = await extractPdf(input.bytes);
  } else if (e === ".docx") {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer: Buffer.from(input.bytes) });
    result = { text: value, method: "mammoth" };
  } else if (e === ".txt" || e === ".md") {
    result = { text: new TextDecoder().decode(input.bytes), method: "native" };
  } else if (IMAGE_EXT.includes(e)) {
    const text = await extractImageWithGemini(input.bytes, IMAGE_MIME[e]);
    result = { text, method: "gemini-vision" };
  } else {
    throw new Error("Unsupported file type. Allowed: PDF, DOCX, TXT, MD, images.");
  }

  const text = result.text.trim();
  if (!text) throw new Error("No readable text found in the file.");
  return { text, method: result.method };
}
