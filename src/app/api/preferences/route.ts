// ============================================================================
// Preferences API - Load user preferences
// Task 4.1: Create preferences loading API
// Requirements: 3.1, 3.4, 3.7
// ============================================================================

import { NextResponse } from 'next/server';
import { guard } from '@/lib/api';

function validateDomain(domain: unknown): boolean {
  if (!domain || typeof domain !== 'object') return false;
  const d = domain as Record<string, unknown>;
  return Boolean(d.domain_id && d.name);
}

function validateSubject(subject: unknown): boolean {
  if (!subject || typeof subject !== 'object') return false;
  const s = subject as Record<string, unknown>;
  return Boolean(s.subject_id && s.name && s.domain_id);
}

export async function GET() {
  try {
    const auth = await guard('preferences:load');
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth;

    // Load domains with proper join
    const { data: userDomains, error: domainsError } = await supabase
      .from('user_domains')
      .select(`
        domain_id,
        domains (
          domain_id,
          name,
          description,
          icon_name,
          is_predefined,
          created_by,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', user.id);
    
    if (domainsError) {
      console.error('[Preferences API] Domains error:', domainsError);
      throw domainsError;
    }

    // Extract and validate domains
    const domains = (userDomains || [])
      .map(ud => {
        if (Array.isArray(ud.domains) && ud.domains.length > 0) {
          return ud.domains[0];
        }
        return ud.domains;
      })
      .filter(validateDomain);

    // Load subjects with domain context and enabled status
    const domainIds = domains.map(d => (d as { domain_id: string }).domain_id);
    
    let allSubjects = [];
    if (domainIds.length > 0) {
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select(`
          subject_id,
          domain_id,
          name,
          description,
          created_at,
          updated_at,
          domains (
            domain_id,
            name,
            description,
            icon_name,
            is_predefined,
            created_by,
            created_at,
            updated_at
          )
        `)
        .in('domain_id', domainIds);
      
      if (subjectsError) {
        console.error('[Preferences API] Subjects error:', subjectsError);
      } else {
        allSubjects = subjectsData || [];
      }
    }

    // Get enabled subjects
    const { data: enabledSubjects, error: enabledError } = await supabase
      .from('user_subjects')
      .select('subject_id')
      .eq('user_id', user.id);
    
    if (enabledError) {
      console.error('[Preferences API] Enabled subjects error:', enabledError);
    }

    const enabledSet = new Set((enabledSubjects || []).map(s => s.subject_id));

    // Normalize subjects structure
    const subjects = allSubjects
      .filter(s => {
        if (!validateSubject(s)) return false;
        // Ensure domain is valid
        if (Array.isArray(s.domains)) {
          return s.domains.length > 0 && validateDomain(s.domains[0]);
        }
        return validateDomain(s.domains);
      })
      .map(s => ({
        ...s,
        domain: Array.isArray(s.domains) && s.domains.length > 0 ? s.domains[0] : s.domains,
        enabled: enabledSet.has(s.subject_id)
      }));

    // Load UI settings from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('theme, language, display_density, notification_email, notification_push, notification_in_app')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('[Preferences API] Profile error:', profileError);
    }

    const preferences = {
      domains,
      subjects,
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
    console.error('[Preferences API] Error:', error);
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
