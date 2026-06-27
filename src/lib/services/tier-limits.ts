// ============================================================================
// Tier Limits Service
// Task 8.1: Create tier limits service module
// Requirements: 6.2, 6.3, 6.4, 6.5, 15.5, 15.6
// ============================================================================

import { createClient } from '@/lib/supabase/server';
import { TIER_LIMITS, SubscriptionTier, LimitCheckResult, ActionType } from '@/types/subscription.types';

export async function checkTierLimit(
  userId: string,
  action: ActionType
): Promise<LimitCheckResult> {
  const supabase = await createClient();

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('tier, billing_period_start')
    .eq('user_id', userId)
    .single();

  const tier = (subscription?.tier || 'free') as SubscriptionTier;
  const limits = TIER_LIMITS[tier];

  switch (action) {
    case 'add_domain': {
      const { count } = await supabase
        .from('user_domains')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const current = count || 0;
      return {
        allowed: current < limits.domains,
        currentUsage: current,
        limit: limits.domains,
        reason: current >= limits.domains ? `Domain limit reached for ${tier} tier` : undefined,
        upgradeRequired: current >= limits.domains ? (tier === 'free' ? 'pro' : 'premium') : undefined
      };
    }

    case 'add_subject': {
      const { count } = await supabase
        .from('user_subjects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const current = count || 0;
      return {
        allowed: current < limits.subjects,
        currentUsage: current,
        limit: limits.subjects,
        reason: current >= limits.subjects ? `Subject limit reached for ${tier} tier` : undefined,
        upgradeRequired: current >= limits.subjects ? 'premium' : undefined
      };
    }

    case 'generate_quiz': {
      const { data: usage } = await supabase
        .from('usage_tracking')
        .select('quiz_count')
        .eq('user_id', userId)
        .eq('billing_period_start', subscription?.billing_period_start || new Date().toISOString())
        .single();

      const current = usage?.quiz_count || 0;
      return {
        allowed: current < limits.quizzes,
        currentUsage: current,
        limit: limits.quizzes,
        reason: current >= limits.quizzes ? `Quiz limit reached for ${tier} tier` : undefined,
        upgradeRequired: current >= limits.quizzes ? (tier === 'free' ? 'pro' : 'premium') : undefined
      };
    }

    case 'generate_summary': {
      const { data: usage } = await supabase
        .from('usage_tracking')
        .select('summary_count')
        .eq('user_id', userId)
        .eq('billing_period_start', subscription?.billing_period_start || new Date().toISOString())
        .single();

      const current = usage?.summary_count || 0;
      return {
        allowed: current < limits.summaries,
        currentUsage: current,
        limit: limits.summaries,
        reason: current >= limits.summaries ? `Summary limit reached for ${tier} tier` : undefined,
        upgradeRequired: current >= limits.summaries ? (tier === 'free' ? 'pro' : 'premium') : undefined
      };
    }
  }
}

export async function incrementUsage(userId: string, type: 'quiz' | 'summary'): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('increment_usage_counter', {
    p_user_id: userId,
    p_counter_type: type
  });
  if (error) throw error;
}
