// ============================================================================
// Preferences API - Load user preferences
// Task 4.1: Create preferences loading API
// Requirements: 3.1, 3.4, 3.7
// ============================================================================

import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Load domains
    const { data: userDomains, error: domainsError } = await supabase
      .from('user_domains')
      .select('domain_id, domains(*)');
    
    if (domainsError) throw domainsError;

    // Load subjects with domain context and enabled status
    const { data: allSubjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('*, domains(*)')
      .in('domain_id', (userDomains || []).map(ud => ud.domain_id));
    
    if (subjectsError) throw subjectsError;

    // Get enabled subjects
    const { data: enabledSubjects, error: enabledError } = await supabase
      .from('user_subjects')
      .select('subject_id');
    
    if (enabledError) throw enabledError;

    const enabledSet = new Set((enabledSubjects || []).map(s => s.subject_id));

    // Load UI settings from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('theme, language, display_density, notification_email, notification_push, notification_in_app')
      .eq('id', user.id)
      .single();
    
    if (profileError) throw profileError;

    const preferences = {
      domains: (userDomains || []).map(ud => ud.domains).filter(Boolean),
      subjects: (allSubjects || []).map(s => ({
        ...s,
        enabled: enabledSet.has(s.subject_id)
      })),
      uiSettings: {
        theme: profile?.theme || 'system',
        language: profile?.language || 'en',
        displayDensity: profile?.display_density || 'standard',
        notifications: {
          email: profile?.notification_email ?? true,
          push: profile?.notification_push ?? true,
          inApp: profile?.notification_in_app ?? true
        }
      }
    };

    return NextResponse.json(
      { success: true, data: preferences },
      { 
        headers: { 
          'Cache-Control': 'private, max-age=300, stale-while-revalidate=600' 
        } 
      }
    );
  } catch (error) {
    console.error('Error loading preferences:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'SERVER_ERROR', 
          message: 'Failed to load preferences',
          retryable: true
        } 
      },
      { status: 500 }
    );
  }
}
