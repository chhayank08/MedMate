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
  const subscription = useSubscriptionStore(state => state.subscription);

  useEffect(() => {
    // Load subscription immediately on mount
    if (!subscription) {
      loadSubscription();
    }
  }, [loadSubscription, subscription]);

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
