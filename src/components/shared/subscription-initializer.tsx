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

  useEffect(() => {
    // Load subscription once on mount if not already initialized
    if (!isInitialized) {
      loadSubscription();
    }
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
