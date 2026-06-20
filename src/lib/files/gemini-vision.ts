/**
 * Gemini Vision image extractor. Routes through vision-router for proper
 * quota management and model fallback separate from generation tasks.
 */
import "server-only";
import { extractImageText } from "@/lib/ai/vision-router";

/** Mime types Gemini accepts inline. */
export const GEMINI_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

/**
 * Extract study text from an image via Gemini Vision. Throws an AIError on a
 * failed request or when the model finds nothing readable.
 */
export async function extractImageWithGemini(
  bytes: ArrayBuffer,
  mimeType: string,
): Promise<string> {
  const result = await extractImageText(bytes, mimeType);
  return result.text;
}
