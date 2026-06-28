// ============================================================================
// Domain Change Listener Hook
// Subscribe to domain changes across the application
// ============================================================================

import { useEffect } from 'react';

export interface DomainChangeEvent {
  domainId: string;
  domainName?: string;
}

/**
 * Hook to listen for domain changes from any component in the app
 * Automatically syncs when domains are changed from header, settings, or any other location
 * 
 * @param callback - Function to call when domain changes
 * @param deps - Dependencies for the callback (optional)
 */
export function useDomainListener(
  callback: (event: DomainChangeEvent) => void,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    const handleDomainChange = (event: CustomEvent<DomainChangeEvent>) => {
      callback(event.detail);
    };

    const handleGlobalDomainUpdate = (event: CustomEvent<{ domainIds: string[] }>) => {
      // Extract primary domain from the list
      if (event.detail.domainIds && event.detail.domainIds.length > 0) {
        callback({ domainId: event.detail.domainIds[0] });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('domain-changed' as any, handleDomainChange);
      window.addEventListener('global-domain-updated' as any, handleGlobalDomainUpdate);

      return () => {
        window.removeEventListener('domain-changed' as any, handleDomainChange);
        window.removeEventListener('global-domain-updated' as any, handleGlobalDomainUpdate);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Hook that returns a boolean indicating if domain is currently being changed
 * Useful for showing loading states during domain transitions
 */
export function useIsDomainChanging() {
  const [isChanging, setIsChanging] = React.useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleStart = () => {
      setIsChanging(true);
      // Auto-reset after 3 seconds as fallback
      timeout = setTimeout(() => setIsChanging(false), 3000);
    };

    const handleComplete = () => {
      clearTimeout(timeout);
      setIsChanging(false);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('domain-change-start' as any, handleStart);
      window.addEventListener('domain-changed' as any, handleComplete);
      window.addEventListener('global-domain-updated' as any, handleComplete);

      return () => {
        clearTimeout(timeout);
        window.removeEventListener('domain-change-start' as any, handleStart);
        window.removeEventListener('domain-changed' as any, handleComplete);
        window.removeEventListener('global-domain-updated' as any, handleComplete);
      };
    }
  }, []);

  return isChanging;
}

import React from 'react';
