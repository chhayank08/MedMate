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

    // Check if user is a lifetime member (hardcoded list)
    const LIFETIME_MEMBERS = [
      'keerthisuga7@gmail.com'
    ];
    
    const { data: userData } = await supabase.auth.getUser();
    const userEmail = userData?.user?.email;
    const isLifetimeMember = userEmail && LIFETIME_MEMBERS.includes(userEmail.toLowerCase());

    // Fetch subscription from database (ONLY SOURCE OF TRUTH)
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (subError) {
      console.error('[Subscription API] Error fetching subscription:', subError);
    }

    // Validate and normalize tier (prevent invalid states)
    const validTiers = ['free', 'pro', 'premium'];
    let tier: 'free' | 'pro' | 'premium' = 'free';
    
    // Override with premium for lifetime members
    if (isLifetimeMember) {
      tier = 'premium';
      console.log(`[Subscription API] Lifetime member detected: ${userEmail}`);
      
      // Ensure subscription record exists in database
      if (!subscription || subscription.tier !== 'premium') {
        const { error: upsertError } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: user.id,
            tier: 'premium',
            billing_period_start: subscription?.billing_period_start || new Date().toISOString(),
            billing_period_end: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(),
            auto_renew: false,
            stripe_customer_id: subscription?.stripe_customer_id || null,
            stripe_subscription_id: subscription?.stripe_subscription_id || null
          }, { onConflict: 'user_id' });
        
        if (upsertError) {
          console.error('[Subscription API] Error updating lifetime member subscription:', upsertError);
        } else {
          console.log('[Subscription API] Lifetime member subscription updated to premium');
        }
      }
    } else if (subscription && validTiers.includes(subscription.tier)) {
      tier = subscription.tier as 'free' | 'pro' | 'premium';
    }
    
    const limits = TIER_LIMITS[tier];

    // Fetch usage tracking
    const billingPeriodStart = subscription?.billing_period_start || new Date().toISOString();
    const { data: usage } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', user.id)
      .eq('billing_period_start', billingPeriodStart)
      .maybeSingle();
    
    // Count actual domain and subject usage
    const { count: domainCount } = await supabase
      .from('user_domains')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    const { count: subjectCount } = await supabase
      .from('user_subjects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const billingPeriodEnd = subscription?.billing_period_end || 
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    return NextResponse.json({
      success: true,
      data: {
        subscription: {
          tier,
          billingPeriodStart,
          billingPeriodEnd,
          autoRenew: subscription?.auto_renew ?? true,
          stripeCustomerId: subscription?.stripe_customer_id || null,
          stripeSubscriptionId: subscription?.stripe_subscription_id || null,
          isLifetimeMember
        },
        usage: {
          domains: { 
            current: Math.min(domainCount || 0, limits.domains), 
            limit: limits.domains 
          },
          subjects: { 
            current: Math.min(subjectCount || 0, limits.subjects), 
            limit: limits.subjects 
          },
          quizzes: { 
            current: Math.min(usage?.quiz_count || 0, limits.quizzes), 
            limit: limits.quizzes, 
            resetsAt: billingPeriodEnd 
          },
          summaries: { 
            current: Math.min(usage?.summary_count || 0, limits.summaries), 
            limit: limits.summaries, 
            resetsAt: billingPeriodEnd 
          }
        },
        limits
      }
    });
  } catch (error) {
    console.error('[Subscription API] Fatal error:', error);
    return NextResponse.json({ 
      success: false, 
      error: { 
        code: 'SERVER_ERROR', 
        message: 'Failed to load subscription', 
        retryable: true 
      } 
    }, { status: 500 });
  }
}
