// ============================================================================
// Subscription Store - Task 10.2
// Requirements: 6.10, 9.4, 15.4, 15.5
// ============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Subscription, UsageStats, TierLimits, LimitCheckResult, ActionType, TIER_LIMITS } from '@/types/subscription.types';

// Request deduplication: track in-flight subscription request
let subscriptionRequest: Promise<void> | null = null;
const CACHE_DURATION_MS = 30_000; // 30 seconds

interface SubscriptionState {
  subscription: Subscription | null;
  usage: UsageStats | null;
  limits: TierLimits | null;
  isLoading: boolean;
  isInitialized: boolean;
  lastSyncedAt: Date | null;
  error: Error | null;
  loadSubscription: () => Promise<void>;
  checkLimit: (action: ActionType) => LimitCheckResult | null;
  incrementUsage: (type: 'quiz' | 'summary') => void;
  getRemainingQuota: (type: 'domains' | 'subjects' | 'quizzes' | 'summaries') => number;
  getUsagePercentage: (type: 'domains' | 'subjects' | 'quizzes' | 'summaries') => number;
  isPremium: () => boolean;
  isLifetime: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscription: null,
      usage: null,
      limits: null,
      isLoading: false,
      isInitialized: false,
      lastSyncedAt: null,
      error: null,

      loadSubscription: async () => {
        // Deduplicate: reuse in-flight request
        if (subscriptionRequest) {
          console.log('[SubscriptionStore] Reusing in-flight request');
          return subscriptionRequest;
        }

        // Don't reload if recently synced (within cache duration)
        const state = get();
        if (state.isInitialized && state.subscription && state.lastSyncedAt) {
          // Convert to Date if it's a string (from localStorage)
          const lastSync = typeof state.lastSyncedAt === 'string' 
            ? new Date(state.lastSyncedAt).getTime()
            : state.lastSyncedAt.getTime();
          const elapsed = Date.now() - lastSync;
          if (elapsed < CACHE_DURATION_MS) {
            console.log('[SubscriptionStore] Using cached data (age:', Math.round(elapsed / 1000), 's)');
            return;
          }
        }

        set({ isLoading: true, error: null });
        
        subscriptionRequest = (async () => {
          try {
            const res = await fetch('/api/subscription/status');
            const json = await res.json();
            if (!json.success) throw new Error(json.error.message);
            
            const { subscription, usage, limits } = json.data;
            
            // Validate subscription tier
            const validTiers = ['free', 'pro', 'premium'];
            const tier = validTiers.includes(subscription.tier) ? subscription.tier : 'free';
            
            const validatedSubscription = {
              ...subscription,
              tier
            };
            
            set({ 
              subscription: validatedSubscription, 
              usage, 
              limits, 
              isLoading: false,
              isInitialized: true,
              lastSyncedAt: new Date()
            });
            
            console.log('[SubscriptionStore] Loaded successfully:', validatedSubscription.tier);
          } catch (error) {
            console.error('[SubscriptionStore] Load error:', error);
            set({ error: error as Error, isLoading: false, isInitialized: true });
          } finally {
            subscriptionRequest = null;
          }
        })();

        return subscriptionRequest;
      },

      checkLimit: (action: ActionType) => {
        const { usage, limits } = get();
        if (!usage || !limits) return null;

        switch (action) {
          case 'add_domain':
            return {
              allowed: usage.domains.current < limits.domains,
              currentUsage: usage.domains.current,
              limit: limits.domains,
              reason: usage.domains.current >= limits.domains ? 'Domain limit reached' : undefined
            };
          case 'add_subject':
            return {
              allowed: usage.subjects.current < limits.subjects,
              currentUsage: usage.subjects.current,
              limit: limits.subjects,
              reason: usage.subjects.current >= limits.subjects ? 'Subject limit reached' : undefined
            };
          case 'generate_quiz':
            return {
              allowed: usage.quizzes.current < limits.quizzes,
              currentUsage: usage.quizzes.current,
              limit: limits.quizzes,
              reason: usage.quizzes.current >= limits.quizzes ? 'Quiz limit reached for this billing period' : undefined
            };
          case 'generate_summary':
            return {
              allowed: usage.summaries.current < limits.summaries,
              currentUsage: usage.summaries.current,
              limit: limits.summaries,
              reason: usage.summaries.current >= limits.summaries ? 'Summary limit reached for this billing period' : undefined
            };
        }
      },

      incrementUsage: (type: 'quiz' | 'summary') => {
        set(state => {
          if (!state.usage) return state;
          const key = type === 'quiz' ? 'quizzes' : 'summaries';
          return {
            usage: {
              ...state.usage,
              [key]: { ...state.usage[key], current: state.usage[key].current + 1 }
            }
          };
        });
      },

      getRemainingQuota: (type) => {
        const { usage } = get();
        if (!usage) return 0;
        return usage[type].limit - usage[type].current;
      },

      getUsagePercentage: (type) => {
        const { usage } = get();
        if (!usage) return 0;
        return (usage[type].current / usage[type].limit) * 100;
      },

      isPremium: () => {
        const { subscription } = get();
        return subscription?.tier === 'premium' || subscription?.tier === 'pro';
      },

      isLifetime: () => {
        const { subscription } = get();
        return subscription?.tier === 'premium' && subscription?.auto_renew === false;
      }
    }),
    {
      name: 'subscription-store',
      partialize: (state) => ({
        subscription: state.subscription,
        limits: state.limits,
        lastSyncedAt: state.lastSyncedAt,
      }),
      onRehydrateStorage: () => {
        console.log('[SubscriptionStore] Rehydrating from localStorage...');
        return (state, error) => {
          if (error) {
            console.error('[SubscriptionStore] Hydration error:', error);
          } else if (state) {
            // Convert lastSyncedAt from string to Date if needed
            if (state.lastSyncedAt && typeof state.lastSyncedAt === 'string') {
              state.lastSyncedAt = new Date(state.lastSyncedAt);
            }
            
            console.log('[SubscriptionStore] Hydrated successfully:', {
              tier: state.subscription?.tier,
              initialized: state.isInitialized,
              lastSynced: state.lastSyncedAt
            });
            
            // Mark as initialized if we have cached data
            if (state.subscription && !state.isInitialized) {
              state.isInitialized = true;
            }
          }
        };
      },
    }
  )
);
