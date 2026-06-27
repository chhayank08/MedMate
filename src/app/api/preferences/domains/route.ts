// ============================================================================
// Domain Selection API
// Task 4.2: Create domain selection API
// Requirements: 1.3, 1.4, 1.7, 6.5, 15.1, 15.5
// ============================================================================

import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const domainSelectionSchema = z.object({
  domains: z.array(z.string().uuid()).min(1).max(20)
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = domainSelectionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Invalid domain selection',
            details: validation.error.errors,
            retryable: true
          } 
        },
        { status: 400 }
      );
    }

    const { domains } = validation.data;

    // Check tier limits
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .single();

    const tier = subscription?.tier || 'free';
    const limits = { free: 1, pro: 3, premium: 10 };
    
    if (domains.length > limits[tier]) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'TIER_LIMIT_EXCEEDED',
            message: `Your ${tier} plan allows ${limits[tier]} domain(s). Upgrade to select more.`,
            retryable: false,
            upgradeRequired: {
              currentTier: tier,
              requiredTier: tier === 'free' ? 'pro' : 'premium',
              feature: 'domains'
            }
          } 
        },
        { status: 402 }
      );
    }

    // Validate domains exist
    const { data: validDomains, error: validateError } = await supabase
      .from('domains')
      .select('domain_id')
      .in('domain_id', domains);

    if (validateError) throw validateError;

    if (validDomains.length !== domains.length) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR',
            message: 'One or more domain IDs are invalid',
            retryable: false
          } 
        },
        { status: 400 }
      );
    }

    // Atomically update user_domains (delete all + insert new)
    const { error: deleteError } = await supabase
      .from('user_domains')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    const { error: insertError } = await supabase
      .from('user_domains')
      .insert(domains.map(domain_id => ({ user_id: user.id, domain_id })));

    if (insertError) throw insertError;

    // Load updated preferences
    const { data: updatedDomains } = await supabase
      .from('user_domains')
      .select('domain_id, domains(*)');

    const { data: allSubjects } = await supabase
      .from('subjects')
      .select('*, domains(*)')
      .in('domain_id', domains);

    const { data: enabledSubjects } = await supabase
      .from('user_subjects')
      .select('subject_id');

    const enabledSet = new Set((enabledSubjects || []).map(s => s.subject_id));

    return NextResponse.json({
      success: true,
      data: {
        domains: (updatedDomains || []).map(ud => ud.domains).filter(Boolean),
        subjects: (allSubjects || []).map(s => ({
          ...s,
          enabled: enabledSet.has(s.subject_id)
        }))
      }
    });
  } catch (error) {
    console.error('Error updating domains:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'SERVER_ERROR',
          message: 'Failed to update domain selection',
          retryable: true
        } 
      },
      { status: 500 }
    );
  }
}
