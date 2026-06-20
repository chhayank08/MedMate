/**
 * User-friendly error message formatter for AI and API errors.
 * Converts technical error messages into polished, actionable feedback.
 */

export function formatAPIError(status: number, rawError?: string): string {
  switch (status) {
    case 400:
      return rawError || "Invalid request. Please check your input and try again.";
    case 401:
      return "Session expired. Please refresh the page and sign in again.";
    case 402:
      return "AI quota reached. Please wait a few minutes and try again.";
    case 403:
      return "Access denied. Please contact support if this persists.";
    case 404:
      return "Resource not found. Please refresh the page.";
    case 422:
      return rawError || "Unable to process the provided data. Please try different input.";
    case 429:
      return "Too many requests. Please wait 30 seconds and try again.";
    case 500:
    case 502:
    case 503:
      return "Service temporarily unavailable. Please try again in a moment.";
    case 504:
      return "Request timed out. Please try again.";
    default:
      return rawError || "An error occurred. Please try again.";
  }
}

export function formatStreamError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    
    if (msg.includes("abort") || msg.includes("cancel")) {
      return "Generation cancelled.";
    }
    if (msg.includes("timeout") || msg.includes("timed out")) {
      return "Generation timed out. Please try again.";
    }
    if (msg.includes("network") || msg.includes("fetch")) {
      return "Network error. Please check your connection and try again.";
    }
    if (msg.includes("quota") || msg.includes("402")) {
      return "AI quota reached. Please wait a few minutes and try again.";
    }
    if (msg.includes("rate") || msg.includes("429")) {
      return "Too many requests. Please wait 30 seconds and try again.";
    }
    
    return error.message;
  }
  
  return "Generation failed. Please try again.";
}

export function shouldRetry(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

export function getRetryDelay(status: number): number {
  if (status === 429) return 30000;
  if (status === 402) return 60000;
  if (status >= 500) return 5000;
  return 3000;
}
