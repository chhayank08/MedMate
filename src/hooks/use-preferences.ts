// ============================================================================
// usePreferences Hook - Task 11.1
// Requirements: 3.4, 12.2, 12.4, 18.5
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePreferencesStore } from '@/lib/stores/preferences-store';
import { SubjectSelection } from '@/types/domain.types';
import { UISettings } from '@/types/preferences.types';
import { toast } from 'sonner';

export function usePreferences() {
  const queryClient = useQueryClient();
  const store = usePreferencesStore();

  const { data: preferences, isLoading, error } = useQuery({
    queryKey: ['preferences'],
    queryFn: async () => {
      await store.loadPreferences();
      return store.preferences;
    },
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000
  });

  const updateDomains = useMutation({
    mutationFn: async (domains: string[]) => {
      await store.updateDomains(domains);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      toast.success('Domains updated');
    },
    onError: (error: Error) => {
      toast.error('Failed to update domains', {
        action: { label: 'Retry', onClick: () => updateDomains.mutate }
      });
    }
  });

  const updateSubjects = useMutation({
    mutationFn: async (subjects: SubjectSelection[]) => {
      await store.updateSubjects(subjects);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      toast.success('Subjects updated');
    },
    onError: () => {
      toast.error('Failed to update subjects');
    }
  });

  const updateUISettings = useMutation({
    mutationFn: async (settings: Partial<UISettings>) => {
      await store.updateUISettings(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    }
  });

  const resetToDefaults = useMutation({
    mutationFn: async () => {
      await store.resetToDefaults();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
      toast.success('Preferences reset to defaults');
    }
  });

  return {
    preferences,
    isLoading,
    error,
    updateDomains: updateDomains.mutate,
    updateSubjects: updateSubjects.mutate,
    updateUISettings: updateUISettings.mutate,
    resetToDefaults: resetToDefaults.mutate
  };
}
