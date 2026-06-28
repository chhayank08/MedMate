// ============================================================================
// useDomains Hook - Task 11.4
// Requirements: 1.1, 1.2, 1.8, 1.9
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Domain } from '@/types/domain.types';
import { toast } from 'sonner';
import { useMemo } from 'react';

// Stable empty arrays
const EMPTY_DOMAINS: Domain[] = Object.freeze([]);

export function useDomains() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['domains'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/domains', { 
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store'
        });
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error?.message || 'Failed to load domains');
        }
        
        const data = json.data;
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid domains data');
        }
        
        return {
          predefined: Array.isArray(data.predefined) ? data.predefined : EMPTY_DOMAINS,
          custom: Array.isArray(data.custom) ? data.custom : EMPTY_DOMAINS
        };
      } catch (error) {
        console.error('[useDomains] Query error:', error);
        throw error;
      }
    },
    staleTime: Infinity,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000)
  });

  const createCustomDomain = useMutation({
    mutationFn: async (domain: { name: string; description?: string }) => {
      if (!domain?.name?.trim()) {
        throw new Error('Domain name is required');
      }

      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(domain)
      });
      
      if (!res.ok) {
        const json = await res.json().catch(() => ({ error: { message: 'Failed to create domain' } }));
        throw new Error(json.error?.message || 'Failed to create domain');
      }
      
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to create domain');
      }
      
      return json.data?.domain;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      toast.success('Custom domain created');
    },
    onError: (error: Error) => {
      console.error('[useDomains] Create error:', error);
      toast.error(error.message || 'Failed to create domain');
    }
  });

  const deleteDomain = useMutation({
    mutationFn: async (domainId: string) => {
      if (!domainId) {
        throw new Error('Domain ID is required');
      }

      const res = await fetch(`/api/domains/${domainId}`, { method: 'DELETE' });
      
      if (!res.ok) {
        const json = await res.json().catch(() => ({ error: { message: 'Failed to delete domain' } }));
        throw new Error(json.error?.message || 'Failed to delete domain');
      }
      
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to delete domain');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      toast.success('Domain deleted');
    },
    onError: (error: Error) => {
      console.error('[useDomains] Delete error:', error);
      toast.error(error.message || 'Failed to delete domain');
    }
  });

  const predefinedDomains = useMemo(() => data?.predefined ?? EMPTY_DOMAINS, [data?.predefined]);
  const customDomains = useMemo(() => data?.custom ?? EMPTY_DOMAINS, [data?.custom]);

  return {
    predefinedDomains,
    customDomains,
    isLoading,
    error,
    createCustomDomain: createCustomDomain.mutate,
    deleteDomain: deleteDomain.mutate
  };
}
