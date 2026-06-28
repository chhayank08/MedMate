// Centralized premium status hooks with STABLE PRIMITIVE selectors ONLY
import { useSubscriptionStore } from '@/lib/stores/subscription-store';

/**
 * STABLE hook for premium status - primitive selector only
 */
export function useIsPremium() {
  const tier = useSubscriptionStore(state => state.subscription?.tier);
  return tier === 'premium' || tier === 'pro';
}

/**
 * STABLE hook for lifetime status - primitive selectors only
 */
export function useIsLifetime() {
  const tier = useSubscriptionStore(state => state.subscription?.tier);
  const autoRenew = useSubscriptionStore(state => state.subscription?.auto_renew);
  return tier === 'premium' && autoRenew === false;
}

/**
 * STABLE hook for full premium status - primitive selectors only
 */
export function usePremiumStatus() {
  const tier = useSubscriptionStore(state => state.subscription?.tier);
  const autoRenew = useSubscriptionStore(state => state.subscription?.auto_renew);
  const isInitialized = useSubscriptionStore(state => state.isInitialized);
  
  const isPremium = tier === 'premium' || tier === 'pro';
  const isLifetime = tier === 'premium' && autoRenew === false;
  
  return { isPremium, isLifetime, tier, isInitialized };
}
