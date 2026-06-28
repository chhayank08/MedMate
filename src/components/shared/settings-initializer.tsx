"use client";

import { useEffect, useState } from "react";
import { useGlobalSettings } from "@/lib/stores/global-settings-store";

/**
 * Initializes global settings on app mount
 * This component should be mounted once in the layout
 * Handles initialization, error recovery, and cross-tab sync
 */
export function SettingsInitializer() {
  const initialize = useGlobalSettings(state => state.initialize);
  const isInitialized = useGlobalSettings(state => state.isInitialized);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    if (isInitialized) return;

    const initWithRetry = async () => {
      try {
        await initialize();
      } catch (error) {
        console.error('[SettingsInitializer] Initialization failed:', error);
        
        // Retry with exponential backoff
        if (retryCount < MAX_RETRIES) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, delay);
        }
      }
    };

    initWithRetry();
  }, [initialize, isInitialized, retryCount]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'global-settings' && e.newValue) {
        console.log('[SettingsInitializer] Settings changed in another tab');
        // Zustand persist already handles this, just log
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  return null;
}
