// ============================================================================
// Subscription Status API - Task 6.1
// Requirements: 6.10, 7.10, 9.4, 15.4
// ============================================================================

import { NextResponse } from 'next/server';
import { guard } from '@/lib/api';
import { TIER_LIMITS } from '@/types/subscription.types';

export async function GET() {
  try {
    const auth = await guard('subscription:status');
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth;

    const { data: subscription } = await supabase.from('subscriptions').select('*').eq('user_id', user.id).single();
    const tier = subscription?.tier || 'free';
    const limits = TIER_LIMITS[tier];

    const { data: usage } = await supabase.from('usage_tracking').select('*').eq('user_id', user.id).eq('billing_period_start', subscription?.billing_period_start || new Date().toISOString()).single();
    const { count: domainCount } = await supabase.from('user_domains').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    const { count: subjectCount } = await supabase.from('user_subjects').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      data: {
        subscription: {
          tier,
          billingPeriodStart: subscription?.billing_period_start || new Date().toISOString(),
          billingPeriodEnd: subscription?.billing_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          autoRenew: subscription?.auto_renew ?? true
        },
        usage: {
          domains: { current: domainCount || 0, limit: limits.domains },
          subjects: { current: subjectCount || 0, limit: limits.subjects },
          quizzes: { current: usage?.quiz_count || 0, limit: limits.quizzes, resetsAt: subscription?.billing_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
          summaries: { current: usage?.summary_count || 0, limit: limits.summaries, resetsAt: subscription?.billing_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }
        },
        limits
      }
    });
  } catch (error) {
    console.error('Error loading subscription:', error);
    return NextResponse.json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to load subscription', retryable: true } }, { status: 500 });
  }
}
