/**
 * Paragraph/sentence-aware text chunking for RAG. Pure and side-effect free.
 * Sizes are in approximate tokens (~4 chars/token). Chunks carry a small
 * overlap so context isn't lost at boundaries.
 */
import { estimateTokens } from "@/lib/ai/budget";

export interface Chunk {
  index: number;
  content: string;
  tokenCount: number;
}

export interface ChunkOptions {
  maxTokens?: number; // target chunk size
  overlapTokens?: number; // overlap carried between adjacent chunks
}

/** Split a long paragraph that exceeds the budget into sentence-sized pieces. */
function splitParagraph(paragraph: string, maxChars: number): string[] {
  if (paragraph.length <= maxChars) return [paragraph];
  const sentences = paragraph.match(/[^.!?]+[.!?]+|\S+\s*/g) ?? [paragraph];
  const pieces: string[] = [];
  let buf = "";
  for (const s of sentences) {
    if (buf.length + s.length > maxChars && buf) {
      pieces.push(buf.trim());
      buf = "";
    }
    // A single sentence longer than maxChars is hard-split.
    if (s.length > maxChars) {
      for (let i = 0; i < s.length; i += maxChars) pieces.push(s.slice(i, i + maxChars).trim());
    } else {
      buf += s;
    }
  }
  if (buf.trim()) pieces.push(buf.trim());
  return pieces.filter(Boolean);
}

export function chunkText(text: string, opts: ChunkOptions = {}): Chunk[] {
  const maxTokens = opts.maxTokens ?? 400;
  const overlapTokens = opts.overlapTokens ?? 50;
  const maxChars = maxTokens * 4;
  const overlapChars = overlapTokens * 4;

  const clean = text.replace(/\r\n/g, "\n").trim();
  if (!clean) return [];

  const paragraphs = clean
    .split(/\n{2,}/)
    .flatMap((p) => splitParagraph(p.trim(), maxChars))
    .filter(Boolean);

  const chunks: Chunk[] = [];
  let buf = "";
  const push = () => {
    const content = buf.trim();
    if (content) {
      chunks.push({ index: chunks.length, content, tokenCount: estimateTokens(content) });
    }
  };

  for (const para of paragraphs) {
    if (buf.length + para.length + 2 > maxChars && buf) {
      push();
      // Start the next chunk with an overlap tail from the previous one.
      buf = overlapChars > 0 ? buf.slice(-overlapChars) + "\n\n" : "";
    }
    buf += (buf ? "\n\n" : "") + para;
  }
  push();

  return chunks;
}
