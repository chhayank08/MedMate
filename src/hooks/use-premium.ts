// Centralized premium status hooks with STABLE selectors
import { useSubscriptionStore } from '@/lib/stores/subscription-store';

export function useIsPremium() {
  const isInitialized = useSubscriptionStore(state => state.isInitialized);
  const tier = useSubscriptionStore(state => state.subscription?.tier);
  const isPremium = tier === 'premium' || tier === 'pro';
  
  return { isPremium, isInitialized };
}

export function useIsLifetime() {
  const isInitialized = useSubscriptionStore(state => state.isInitialized);
  const tier = useSubscriptionStore(state => state.subscription?.tier);
  const autoRenew = useSubscriptionStore(state => state.subscription?.auto_renew);
  const isLifetime = tier === 'premium' && autoRenew === false;
  
  return { isLifetime, isInitialized };
}

export function usePremiumStatus() {
  const isInitialized = useSubscriptionStore(state => state.isInitialized);
  const tier = useSubscriptionStore(state => state.subscription?.tier);
  const autoRenew = useSubscriptionStore(state => state.subscription?.auto_renew);
  const isPremium = tier === 'premium' || tier === 'pro';
  const isLifetime = tier === 'premium' && autoRenew === false;
  
  return { isPremium, isLifetime, tier, isInitialized };
}
