/**
 * Quota initialization on server startup.
 * 
 * The quota tracker now handles daily resets automatically (midnight PT),
 * so we no longer pre-mark models as exhausted. Models are discovered
 * dynamically and rotated as needed.
 */
import "@/lib/ai/quota-tracker";

console.log("[Quota Init] Quota tracker initialized with daily reset awareness (midnight PT)");
