// ============================================================================
// useSubscription Hook - Task 11.2
// Requirements: 6.5, 6.6, 15.5, 15.6
// ============================================================================

import { useQuery } from '@tanstack/react-query';
import { useSubscriptionStore } from '@/lib/stores/subscription-store';
import { ActionType } from '@/types/subscription.types';

export function useSubscription() {
  const store = useSubscriptionStore();

  const { data, isLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      await store.loadSubscription();
      return { subscription: store.subscription, usage: store.usage, limits: store.limits };
    },
    staleTime: 2 * 60 * 1000
  });

  const canPerformAction = (action: ActionType): boolean => {
    const result = store.checkLimit(action);
    return result?.allowed ?? false;
  };

  const getUpgradePrompt = (action: ActionType) => {
    const result = store.checkLimit(action);
    if (!result || result.allowed) return null;
    
    return {
      limitType: action.replace('_', ' '),
      currentUsage: result.currentUsage,
      currentLimit: result.limit,
      reason: result.reason,
      upgradeRequired: result.upgradeRequired
    };
  };

  return {
    subscription: data?.subscription,
    usage: data?.usage,
    limits: data?.limits,
    isLoading,
    canPerformAction,
    getUpgradePrompt,
    getRemainingQuota: store.getRemainingQuota,
    getUsagePercentage: store.getUsagePercentage
  };
}
