"use client";

import { useEffect } from "react";
import { useGlobalSettings } from "@/lib/stores/global-settings-store";

/**
 * Initializes global settings on app mount
 * This component should be mounted once in the layout
 */
export function SettingsInitializer() {
  const initialize = useGlobalSettings(state => state.initialize);
  const isInitialized = useGlobalSettings(state => state.isInitialized);

  useEffect(() => {
    if (!isInitialized) {
      initialize().catch(error => {
        console.error('[SettingsInitializer] Failed to initialize:', error);
      });
    }
  }, [initialize, isInitialized]);

  return null;
}
