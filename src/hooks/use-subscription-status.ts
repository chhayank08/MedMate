// ============================================================================
// Centralized Subscription Status Hook
// Use this instead of individual selectors to prevent hydration flicker
// ============================================================================

import { useSubscriptionStore } from '@/lib/stores/subscription-store';
import { useMemo } from 'react';

/**
 * CRITICAL: Use this hook for ALL subscription status checks
 * Returns stable primitive values with proper hydration handling
 * Prevents free-tier UI from flashing before premium UI renders
 */
export function useSubscriptionStatus() {
  // Split into primitive selectors for React 19 stability
  const isInitialized = useSubscriptionStore(state => state.isInitialized);
  const isLoading = useSubscriptionStore(state => state.isLoading);
  const tier = useSubscriptionStore(state => state.subscription?.tier);
  const autoRenew = useSubscriptionStore(state => state.subscription?.auto_renew);
  const subscription = useSubscriptionStore(state => state.subscription);
  
  // Derive status from primitives (React will memoize based on primitive changes)
  const isPremium = tier === 'premium' || tier === 'pro';
  const isLifetime = tier === 'premium' && autoRenew === false;
  const isFree = tier === 'free' || !tier;
  
  // CRITICAL: Component should wait for initialization before rendering tier-specific UI
  const isReady = isInitialized && !isLoading;
  
  return useMemo(() => ({
    // Status flags
    isReady,
    isInitialized,
    isLoading,
    
    // Tier information
    tier: tier || 'free',
    isPremium,
    isLifetime,
    isFree,
    
    // Raw subscription (use sparingly, prefer primitives above)
    subscription,
  }), [isReady, isInitialized, isLoading, tier, isPremium, isLifetime, isFree, subscription]);
}

/**
 * Lightweight hook for components that ONLY need to know if user is premium
 * More efficient than full useSubscriptionStatus
 */
export function useIsPremium() {
  const tier = useSubscriptionStore(state => state.subscription?.tier);
  return tier === 'premium' || tier === 'pro';
}

/**
 * Lightweight hook for components that ONLY need to know if user is lifetime
 * More efficient than full useSubscriptionStatus
 */
export function useIsLifetime() {
  const tier = useSubscriptionStore(state => state.subscription?.tier);
  const autoRenew = useSubscriptionStore(state => state.subscription?.auto_renew);
  return tier === 'premium' && autoRenew === false;
}
