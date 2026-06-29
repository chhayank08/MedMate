"use client";

import { useEffect } from "react";
import { useSubscriptionStore } from "@/lib/stores/subscription-store";

/**
 * Initializes subscription state on app mount
 * Ensures premium/lifetime status loads before UI renders
 * Handles caching and instant hydration for seamless premium experience
 */
export function SubscriptionInitializer() {
  const loadSubscription = useSubscriptionStore(state => state.loadSubscription);
  const isInitialized = useSubscriptionStore(state => state.isInitialized);
  const subscription = useSubscriptionStore(state => state.subscription);
  const lastSyncedAt = useSubscriptionStore(state => state.lastSyncedAt);

  useEffect(() => {
    // If we have hydrated subscription data that's recent, don't reload
    if (isInitialized && subscription && lastSyncedAt) {
      const age = Date.now() - (typeof lastSyncedAt === 'string' ? new Date(lastSyncedAt).getTime() : lastSyncedAt.getTime());
      if (age < 60_000) { // Less than 1 minute old
        console.log('[SubscriptionInitializer] Using hydrated subscription (age:', Math.round(age / 1000), 's)');
        return;
      }
    }
    
    // Otherwise load fresh subscription data
    console.log('[SubscriptionInitializer] Loading subscription...');
    loadSubscription();
  }, []); // Run only once on mount

  // Listen for auth state changes
  useEffect(() => {
    const handleAuthChange = () => {
      console.log('[SubscriptionInitializer] Auth state changed, reloading subscription');
      loadSubscription();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth-state-changed', handleAuthChange);
      return () => window.removeEventListener('auth-state-changed', handleAuthChange);
    }
  }, [loadSubscription]);

  return null;
}
