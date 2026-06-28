// ============================================================================
// Unified Domain Context Hook
// Provides a single interface for domain state management across the app
// ============================================================================

import { useGlobalSettings, useActiveDomain, useActiveDomains } from '@/lib/stores/global-settings-store';
import { getDomainConfig, type DomainKey } from '@/lib/domain-config';
import { useMemo, useEffect } from 'react';
import { useDomainListener } from './use-domain-listener';

/**
 * Comprehensive hook for accessing domain context throughout the application
 * This hook provides:
 * - Current active domain (primary selection)
 * - All active domains (for multi-domain users)
 * - Domain configuration (colors, icons, placeholders)
 * - Domain switching functionality
 * - Loading and initialization states
 * - Automatic refresh on domain changes
 */
export function useDomainContext(options?: { refreshOnChange?: boolean }) {
  const activeDomain = useActiveDomain();
  const activeDomains = useActiveDomains();
  const selectDomains = useGlobalSettings(state => state.selectDomains);
  const isLoading = useGlobalSettings(state => state.isLoading);
  const isInitialized = useGlobalSettings(state => state.isInitialized);
  const selectedDomainIds = useGlobalSettings(state => state.selectedDomainIds);
  
  // Get domain configuration for the active domain - use stable domain ID for memoization
  const domainConfig = useMemo(() => {
    if (!activeDomain?.domain_id) return null;
    const domainKey = activeDomain.name.toLowerCase().replace(/\s+/g, '_') as DomainKey;
    return getDomainConfig(domainKey);
  }, [activeDomain?.domain_id]); // FIXED: Only depend on stable domain_id

  // Listen for domain changes and optionally trigger refresh
  useDomainListener((event) => {
    if (options?.refreshOnChange) {
      console.log('[useDomainContext] Domain changed, refreshing...', event);
      // Trigger any necessary refreshes here
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('domain-context-refreshed'));
      }
    }
  }, [options?.refreshOnChange]);

  // Switch to a single domain (replaces current selection)
  const switchDomain = async (domainId: string) => {
    await selectDomains([domainId]);
  };

  // Toggle a domain in multi-domain mode
  const toggleDomain = async (domainId: string) => {
    const isSelected = selectedDomainIds.includes(domainId);
    
    if (isSelected) {
      // Remove domain (keep at least one)
      if (selectedDomainIds.length > 1) {
        await selectDomains(selectedDomainIds.filter(id => id !== domainId));
      }
    } else {
      // Add domain
      await selectDomains([...selectedDomainIds, domainId]);
    }
  };

  return {
    // Current state
    activeDomain,
    activeDomains,
    selectedDomainIds,
    domainConfig,
    
    // Actions
    switchDomain,
    toggleDomain,
    selectDomains,
    
    // Status
    isLoading,
    isInitialized,
    isReady: isInitialized && !isLoading,
    
    // Helpers
    isDomainSelected: (domainId: string) => selectedDomainIds.includes(domainId),
    getDomainName: () => activeDomain.name,
    getDomainIcon: () => domainConfig?.iconComponent,
    getPlaceholders: () => domainConfig?.placeholders,
  };
}
