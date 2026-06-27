// ============================================================================
// Subscription Store - Task 10.2
// Requirements: 6.10, 9.4, 15.4, 15.5
// ============================================================================

import { create } from 'zustand';
import { Subscription, UsageStats, TierLimits, LimitCheckResult, ActionType, SubscriptionTier, TIER_LIMITS } from '@/types/subscription.types';

interface SubscriptionState {
  subscription: Subscription | null;
  usage: UsageStats | null;
  limits: TierLimits | null;
  isLoading: boolean;
  error: Error | null;
  loadSubscription: () => Promise<void>;
  checkLimit: (action: ActionType) => LimitCheckResult | null;
  incrementUsage: (type: 'quiz' | 'summary') => void;
  getRemainingQuota: (type: 'domains' | 'subjects' | 'quizzes' | 'summaries') => number;
  getUsagePercentage: (type: 'domains' | 'subjects' | 'quizzes' | 'summaries') => number;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: null,
  usage: null,
  limits: null,
  isLoading: false,
  error: null,

  loadSubscription: async () => {
    set({ isLoading: true, error: null });
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
        isLoading: false 
      });
      
      // Cache subscription state (read-only, never write to modify tier)
      localStorage.setItem('subscription_cache', JSON.stringify({
        tier,
        cachedAt: new Date().toISOString()
      }));
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      
      // Fallback to cached state ONLY for display, never for authorization
      const cached = localStorage.getItem('subscription_cache');
      if (cached) {
        try {
          const { tier, cachedAt } = JSON.parse(cached);
          const cacheAge = Date.now() - new Date(cachedAt).getTime();
          
          // Only use cache if less than 5 minutes old
          if (cacheAge < 5 * 60 * 1000) {
            set({ 
              subscription: { tier } as any,
              usage: null,
              limits: tier === 'premium' ? {
                domains: 10,
                subjects: 10000,
                quizzes: 500,
                summaries: 500,
                summaryTypes: []
              } : tier === 'pro' ? {
                domains: 3,
                subjects: 10000,
                quizzes: 50,
                summaries: 50,
                summaryTypes: []
              } : {
                domains: 1,
                subjects: 3,
                quizzes: 5,
                summaries: 5,
                summaryTypes: []
              }
            });
          }
        } catch {
          // Invalid cache, default to free
          set({
            subscription: { tier: 'free' } as any,
            limits: {
              domains: 1,
              subjects: 3,
              quizzes: 5,
              summaries: 5,
              summaryTypes: []
            }
          });
        }
      } else {
        // No cache, default to free tier
        set({
          subscription: { tier: 'free' } as any,
          limits: {
            domains: 1,
            subjects: 3,
            quizzes: 5,
            summaries: 5,
            summaryTypes: []
          }
        });
      }
    }
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
  }
}));
