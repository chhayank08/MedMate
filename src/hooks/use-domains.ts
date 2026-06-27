// ============================================================================
// useDomains Hook - Task 11.4
// Requirements: 1.1, 1.2, 1.8, 1.9
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Domain } from '@/types/domain.types';
import { toast } from 'sonner';

export function useDomains() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['domains'],
    queryFn: async () => {
      const res = await fetch('/api/domains');
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);
      return json.data;
    },
    staleTime: Infinity
  });

  const createCustomDomain = useMutation({
    mutationFn: async (domain: { name: string; description?: string }) => {
      const res = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(domain)
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);
      return json.data.domain;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      toast.success('Custom domain created');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const deleteDomain = useMutation({
    mutationFn: async (domainId: string) => {
      const res = await fetch(`/api/domains/${domainId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
      toast.success('Domain deleted');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  return {
    predefinedDomains: data?.predefined || [],
    customDomains: data?.custom || [],
    isLoading,
    createCustomDomain: createCustomDomain.mutate,
    deleteDomain: deleteDomain.mutate
  };
}
