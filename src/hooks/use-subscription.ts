// ============================================================================
// useSubscription Hook - STABLE PRIMITIVE SELECTORS
// Requirements: 6.5, 6.6, 15.5, 15.6
// ============================================================================

import { useSubscriptionStore } from '@/lib/stores/subscription-store';
import { ActionType } from '@/types/subscription.types';
import { useEffect } from 'react';

/**
 * STABLE subscription hook using ONLY primitive selectors
 * Prevents infinite rerenders by avoiding object recreation
 */
export function useSubscription() {
  // STABLE primitive selectors - no object creation
  const loadSubscription = useSubscriptionStore(state => state.loadSubscription);
  const subscription = useSubscriptionStore(state => state.subscription);
  const usage = useSubscriptionStore(state => state.usage);
  const limits = useSubscriptionStore(state => state.limits);
  const isLoading = useSubscriptionStore(state => state.isLoading);
  const isInitialized = useSubscriptionStore(state => state.isInitialized);
  const checkLimit = useSubscriptionStore(state => state.checkLimit);
  const getRemainingQuota = useSubscriptionStore(state => state.getRemainingQuota);
  const getUsagePercentage = useSubscriptionStore(state => state.getUsagePercentage);

  // Load on mount ONCE
  useEffect(() => {
    if (!isInitialized) {
      loadSubscription();
    }
  }, [isInitialized, loadSubscription]);

  const canPerformAction = (action: ActionType): boolean => {
    const result = checkLimit(action);
    return result?.allowed ?? false;
  };

  const getUpgradePrompt = (action: ActionType) => {
    const result = checkLimit(action);
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
    subscription,
    usage,
    limits,
    isLoading,
    isInitialized,
    canPerformAction,
    getUpgradePrompt,
    getRemainingQuota,
    getUsagePercentage
  };
}
