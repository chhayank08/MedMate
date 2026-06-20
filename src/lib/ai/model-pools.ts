/**
 * Model Pool Management with Task-Specific Routing
 * 
 * Different AI tasks require different model capabilities:
 * - Vision tasks (OCR, image parsing) need vision-capable models
 * - Embedding tasks need embedding models
 * - Generation tasks can use any text model
 * 
 * This module maintains separate fallback chains for each task type,
 * preventing exhausted parsing models from blocking generation tasks.
 */
import "server-only";

export type ProviderName = "gemini" | "openrouter";

export interface Candidate {
  provider: ProviderName;
  model: string;
}

export type TaskCategory = 
  | "generation"  // Summaries, quizzes, plans, flashcards
  | "vision"      // Image OCR, diagram parsing
  | "embedding"   // RAG embeddings
  | "reasoning";  // Medical reasoning, coach responses

/**
 * Gemini model capabilities and quotas (verified via API list-models)
 * All are FREE tier with RPD (requests per day) and RPM (requests per minute) limits.
 */
const GEMINI_MODELS = {
  // Vision-capable models (can handle images + text)
  "gemini-2.5-flash": { 
    vision: true, 
    rpd: 20, 
    rpm: 5,
    priority: 1,
    description: "Primary vision + generation model"
  },
  "gemini-3.5-flash": { 
    vision: true, 
    rpd: 20, 
    rpm: 5,
    priority: 2,
    description: "Newest vision model"
  },
  
  // High-quota text models (generation only)
  "gemini-3.1-flash-lite": { 
    vision: false, 
    rpd: 500, 
    rpm: 15,
    priority: 3,
    description: "High-quota fallback"
  },
  "gemini-2.0-flash-lite": { 
    vision: false, 
    rpd: 1500, 
    rpm: 10,
    priority: 4,
    description: "Highest-quota model"
  },
  "gemini-2.5-flash-lite": { 
    vision: false, 
    rpd: 20, 
    rpm: 10,
    priority: 5,
    description: "Alternative lite model"
  },
} as const;

/**
 * OpenRouter free models (verified available, non-Google pools)
 * These provide fallback when all Gemini models are exhausted.
 */
export const FREE_OPENROUTER_MODELS = [
  "openai/gpt-oss-120b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "openai/gpt-oss-20b:free",
] as const;

/**
 * Get ordered model candidates for a specific task category.
 * Vision tasks only use vision-capable models; generation tasks prefer
 * high-quota models for better reliability.
 */
export function getCandidates(category: TaskCategory): Candidate[] {
  const candidates: Candidate[] = [];
  
  switch (category) {
    case "vision":
      // Vision tasks: ONLY vision-capable Gemini models
      candidates.push(
        { provider: "gemini", model: "gemini-2.5-flash" },
        { provider: "gemini", model: "gemini-3.5-flash" },
      );
      // Note: OpenRouter free models generally don't support vision reliably
      break;
      
    case "embedding":
      // Embeddings use dedicated embedding models (handled in gemini provider)
      candidates.push(
        { provider: "gemini", model: "gemini-embedding-001" },
      );
      break;
      
    case "generation":
      // Generation: prioritize high-quota models first for reliability
      candidates.push(
        { provider: "gemini", model: "gemini-3.1-flash-lite" },  // 500 RPD
        { provider: "gemini", model: "gemini-2.0-flash-lite" },  // 1500 RPD
        { provider: "gemini", model: "gemini-2.5-flash" },       // 20 RPD
        { provider: "gemini", model: "gemini-3.5-flash" },       // 20 RPD
        { provider: "gemini", model: "gemini-2.5-flash-lite" },  // 20 RPD
      );
      break;
      
    case "reasoning":
      // Reasoning: use primary models for best quality
      candidates.push(
        { provider: "gemini", model: "gemini-2.5-flash" },
        { provider: "gemini", model: "gemini-3.5-flash" },
        { provider: "gemini", model: "gemini-3.1-flash-lite" },
        { provider: "gemini", model: "gemini-2.0-flash-lite" },
      );
      break;
  }
  
  // Add OpenRouter fallbacks for non-embedding tasks
  if (category !== "embedding" && category !== "vision") {
    // Check for custom OPENROUTER_MODEL override
    const customModel = process.env.OPENROUTER_MODEL;
    if (customModel && !candidates.some(c => c.model === customModel)) {
      candidates.push({ provider: "openrouter", model: customModel });
    }
    
    // Add free OpenRouter models as ultimate fallback
    for (const model of FREE_OPENROUTER_MODELS) {
      if (!candidates.some(c => c.provider === "openrouter" && c.model === model)) {
        candidates.push({ provider: "openrouter", model });
      }
    }
  }
  
  return candidates;
}

/**
 * Map router tasks to task categories.
 */
export function getTaskCategory(task: string): TaskCategory {
  if (task === "vision" || task === "ocr" || task === "image_parse") {
    return "vision";
  }
  if (task === "embedding") {
    return "embedding";
  }
  if (task === "medical_reasoning" || task === "coach") {
    return "reasoning";
  }
  return "generation"; // summary, quiz, flashcards, plan, etc.
}

/**
 * Get model info for logging/observability.
 */
export function getModelInfo(model: string) {
  const geminiInfo = GEMINI_MODELS[model as keyof typeof GEMINI_MODELS];
  if (geminiInfo) {
    return {
      provider: "gemini",
      ...geminiInfo,
    };
  }
  return {
    provider: "openrouter",
    vision: false,
    description: "OpenRouter free model",
  };
}
