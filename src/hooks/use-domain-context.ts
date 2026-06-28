// ============================================================================
// Unified Domain Context Hook
// Provides a single interface for domain state management across the app
// ============================================================================

import { useGlobalSettings, useActiveDomain, useActiveDomains } from '@/lib/stores/global-settings-store';
import { getDomainConfig, type DomainKey } from '@/lib/domain-config';
import { useMemo, useEffect, useCallback } from 'react';

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
  
  // CRITICAL: Use only primitive domain_id for memoization stability
  const activeDomainId = activeDomain?.domain_id;
  const activeDomainName = activeDomain?.name;
  
  // Get domain configuration for the active domain - STABLE memoization using only primitives
  const domainConfig = useMemo(() => {
    if (!activeDomainId || !activeDomainName) return null;
    const domainKey = activeDomainName.toLowerCase().replace(/\s+/g, '_') as DomainKey;
    return getDomainConfig(domainKey);
  }, [activeDomainId, activeDomainName]);

  // Listen for domain changes - stable effect
  const shouldRefresh = options?.refreshOnChange ?? false;
  useEffect(() => {
    if (!shouldRefresh) return;
    
    const handleDomainChange = (event: CustomEvent) => {
      console.log('[useDomainContext] Domain changed, refreshing...', event.detail);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('domain-context-refreshed'));
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('domain-changed' as any, handleDomainChange);
      window.addEventListener('global-domain-updated' as any, handleDomainChange);
      
      return () => {
        window.removeEventListener('domain-changed' as any, handleDomainChange);
        window.removeEventListener('global-domain-updated' as any, handleDomainChange);
      };
    }
  }, [shouldRefresh]);

  // Switch to a single domain (replaces current selection) - wrapped in useCallback
  const switchDomain = useCallback(async (domainId: string) => {
    await selectDomains([domainId]);
  }, [selectDomains]);

  // Toggle a domain in multi-domain mode - wrapped in useCallback
  const toggleDomain = useCallback(async (domainId: string) => {
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
  }, [selectDomains, selectedDomainIds]);

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
