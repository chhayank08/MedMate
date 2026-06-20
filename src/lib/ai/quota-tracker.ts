/**
 * AI Provider Quota Tracker with Daily Reset Awareness
 * 
 * Tracks which models/providers have hit rate limits or quota exhaustion.
 * Prevents retrying exhausted models until their cooldown expires OR until
 * the daily quota resets (midnight Pacific time for Gemini free tier).
 * 
 * Integration with observability tools (Langfuse, Helicone, Phoenix) for
 * real-time quota monitoring happens in the router.
 */
import "server-only";

interface QuotaState {
  exhaustedAt: number;
  cooldownUntil: number;
  resetAt: number; // Daily quota reset timestamp (midnight PT)
  errorType: "rate_limit" | "quota" | "credit";
  attempts: number;
  reason?: string; // Human-readable exhaustion reason
}

/**
 * In-memory quota state. Tracks exhausted models with exponential backoff.
 * Key format: "{provider}/{model}/{task}" for task-specific tracking
 * or "{provider}/{model}" for global model state.
 */
const exhaustedModels = new Map<string, QuotaState>();

/**
 * Get the next daily quota reset time (midnight Pacific Time).
 * Gemini free-tier RPD limits reset at midnight PT daily.
 */
function getNextResetTime(): number {
  const now = new Date();
  
  // Convert current time to Pacific timezone
  const ptNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  
  // Get midnight tonight in Pacific time
  const midnight = new Date(ptNow);
  midnight.setHours(24, 0, 0, 0);
  
  // Convert back to UTC timestamp
  const midnightUTC = new Date(
    midnight.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
  ).getTime();
  
  return midnightUTC;
}

/**
 * Cooldown periods based on error type and attempt count.
 * For daily quotas, cooldown until the next reset time.
 */
function getCooldownMs(errorType: string, attempts: number): number {
  if (errorType === "quota") {
    // Daily quota exhaustion: wait until midnight PT reset
    const resetTime = getNextResetTime();
    return Math.max(0, resetTime - Date.now());
  }
  
  const base = {
    rate_limit: 90_000,    // 1.5 minutes for RPM rate limits
    credit: 600_000,       // 10 minutes for credit issues
  }[errorType] || 60_000;

  // Exponential backoff: double cooldown for each retry, max 30 minutes
  // (shorter than before to allow faster recovery)
  return Math.min(base * Math.pow(2, Math.min(attempts - 1, 3)), 1_800_000);
}

/**
 * Mark a model as exhausted with cooldown period.
 * Optionally scope to a specific task for fine-grained tracking.
 */
export function markExhausted(
  provider: string,
  model: string,
  errorType: "rate_limit" | "quota" | "credit" = "rate_limit",
  task?: string,
  reason?: string
): void {
  const key = task ? `${provider}/${model}/${task}` : `${provider}/${model}`;
  const existing = exhaustedModels.get(key);
  const attempts = existing ? existing.attempts + 1 : 1;
  const cooldownMs = getCooldownMs(errorType, attempts);
  const resetAt = getNextResetTime();

  exhaustedModels.set(key, {
    exhaustedAt: Date.now(),
    cooldownUntil: Date.now() + cooldownMs,
    resetAt,
    errorType,
    attempts,
    reason: reason || `${errorType} exhaustion`,
  });

  const cooldownDesc = errorType === "quota" 
    ? `until midnight PT (${new Date(resetAt).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit' })})`
    : `${Math.round(cooldownMs / 1000)}s`;
    
  console.log(
    `[Quota Tracker] 🚫 ${key} exhausted (${errorType}${reason ? `: ${reason}` : ''}), cooldown: ${cooldownDesc}, attempt: ${attempts}`
  );
}

/**
 * Check if a model is currently exhausted (task-specific or global).
 * Automatically re-enables models after daily quota resets.
 */
export function isExhausted(provider: string, model: string, task?: string): boolean {
  const key = task ? `${provider}/${model}/${task}` : `${provider}/${model}`;
  const state = exhaustedModels.get(key);

  if (!state) return false;

  const now = Date.now();
  
  // Check if daily quota has reset (takes priority over cooldown)
  if (state.errorType === "quota" && now >= state.resetAt) {
    exhaustedModels.delete(key);
    console.log(`[Quota Tracker] ✅ ${key} daily quota reset, re-enabling`);
    return false;
  }

  // Check if cooldown has expired
  if (now >= state.cooldownUntil) {
    exhaustedModels.delete(key);
    console.log(`[Quota Tracker] ✅ ${key} cooldown expired, re-enabling`);
    return false;
  }

  const remainingSec = Math.round((state.cooldownUntil - now) / 1000);
  const remainingMin = Math.round(remainingSec / 60);
  const timeDesc = remainingMin > 90 
    ? `${Math.round(remainingMin / 60)}h` 
    : remainingMin > 2 
      ? `${remainingMin}m` 
      : `${remainingSec}s`;
      
  if (task) {
    console.log(`[Quota Tracker] ⏳ ${key} still cooling down (${timeDesc} remaining)`);
  }
  
  return true;
}

/**
 * Manually clear exhaustion state (for testing or manual override).
 */
export function clearExhaustion(provider: string, model: string, task?: string): void {
  const key = task ? `${provider}/${model}/${task}` : `${provider}/${model}`;
  exhaustedModels.delete(key);
  console.log(`[Quota Tracker] 🔄 ${key} manually cleared`);
}

/**
 * Clear all exhaustion states for a specific provider.
 */
export function clearProvider(provider: string): void {
  let cleared = 0;
  for (const key of exhaustedModels.keys()) {
    if (key.startsWith(`${provider}/`)) {
      exhaustedModels.delete(key);
      cleared++;
    }
  }
  console.log(`[Quota Tracker] 🔄 Cleared ${cleared} models for provider ${provider}`);
}

/**
 * Get all currently exhausted models
 */
export function getExhaustedModels(): Array<{ key: string; state: QuotaState }> {
  const now = Date.now();
  return Array.from(exhaustedModels.entries())
    .filter(([_, state]) => now < state.cooldownUntil)
    .map(([key, state]) => ({ key, state }));
}

/**
 * Cleanup: remove expired cooldowns and reset quotas periodically.
 */
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    let quotaReset = 0;
    
    for (const [key, state] of exhaustedModels) {
      // Daily quota reset takes priority
      if (state.errorType === "quota" && now >= state.resetAt) {
        exhaustedModels.delete(key);
        quotaReset++;
      } else if (now >= state.cooldownUntil) {
        exhaustedModels.delete(key);
        cleaned++;
      }
    }
    
    if (quotaReset > 0) {
      console.log(`[Quota Tracker] 🌅 Daily reset: ${quotaReset} models re-enabled`);
    }
    if (cleaned > 0) {
      console.log(`[Quota Tracker] 🧹 Cleaned ${cleaned} expired cooldowns`);
    }
  }, 60_000).unref?.(); // Every minute
}
