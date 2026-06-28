// Centralized premium status hooks
import { useSubscriptionStore } from '@/lib/stores/subscription-store';

export function useIsPremium() {
  const isInitialized = useSubscriptionStore(state => state.isInitialized);
  const isPremium = useSubscriptionStore(state => state.isPremium());
  
  return { isPremium, isInitialized };
}

export function useIsLifetime() {
  const isInitialized = useSubscriptionStore(state => state.isInitialized);
  const isLifetime = useSubscriptionStore(state => state.isLifetime());
  
  return { isLifetime, isInitialized };
}

export function usePremiumStatus() {
  const isInitialized = useSubscriptionStore(state => state.isInitialized);
  const isPremium = useSubscriptionStore(state => state.isPremium());
  const isLifetime = useSubscriptionStore(state => state.isLifetime());
  const tier = useSubscriptionStore(state => state.subscription?.tier);
  
  return { isPremium, isLifetime, tier, isInitialized };
}
