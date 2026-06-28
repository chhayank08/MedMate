// ============================================================================
// Unified Domain Context Hook - STABLE PRIMITIVES ONLY
// Provides stable, primitive-based selectors to prevent render loops
// ============================================================================

import { useGlobalSettings, useActiveDomain, useActiveDomains } from '@/lib/stores/global-settings-store';
import { getDomainConfig, type DomainKey } from '@/lib/domain-config';
import { useMemo, useCallback } from 'react';

/**
 * STABLE primitive-only hook for domain context
 * Returns ONLY stable primitives and memoized references
 * NO unstable object creation in render
 */
export function useDomainContext() {
  // STABLE PRIMITIVES ONLY - no object destructuring
  const activeDomain = useActiveDomain();
  const isLoading = useGlobalSettings(state => state.isLoading);
  const isInitialized = useGlobalSettings(state => state.isInitialized);
  const selectDomains = useGlobalSettings(state => state.selectDomains);
  
  // Derive stable primitive values ONLY
  const domainId = activeDomain?.domain_id ?? null;
  const domainName = activeDomain?.name ?? 'Medical';
  const isReady = isInitialized && !isLoading;
  
  // STABLE memoized config using ONLY primitive dependencies
  const domainConfig = useMemo(() => {
    if (!domainId) return null;
    const domainKey = domainName.toLowerCase().replace(/\s+/g, '_') as DomainKey;
    return getDomainConfig(domainKey);
  }, [domainId, domainName]); // ONLY primitives

  return {
    // Stable primitives
    isReady,
    isLoading,
    isInitialized,
    
    // Stable objects (from Zustand - reference stable unless state changes)
    activeDomain,
    
    // Stable memoized config
    domainConfig,
    
    // Stable action reference
    selectDomains,
  };
}

/**
 * Stable hook for domain ID only
 */
export function useDomainId() {
  return useGlobalSettings(state => state.selectedDomainIds[0] ?? null);
}

/**
 * Stable hook for domain placeholders
 */
export function useDomainPlaceholders() {
  const activeDomain = useActiveDomain();
  return useMemo(() => {
    if (!activeDomain?.domain_id) return null;
    const domainKey = activeDomain.name.toLowerCase().replace(/\s+/g, '_') as DomainKey;
    const config = getDomainConfig(domainKey);
    return config.placeholders;
  }, [activeDomain?.domain_id, activeDomain?.name]);
}
