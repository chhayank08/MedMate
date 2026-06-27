// ============================================================================
// Preferences Reset API
// Task 4.5: Create preferences reset API
// Requirements: 9.9
// ============================================================================

import { NextResponse } from 'next/server';
import { guard } from '@/lib/api';

export async function POST() {
  try {
    const auth = await guard('preferences:reset');
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth;

    // Delete all domains
    const { error: domainsError } = await supabase
      .from('user_domains')
      .delete()
      .eq('user_id', user.id);

    if (domainsError) throw domainsError;

    // Delete all subjects
    const { error: subjectsError } = await supabase
      .from('user_subjects')
      .delete()
      .eq('user_id', user.id);

    if (subjectsError) throw subjectsError;

    // Reset profile to defaults
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        theme: 'system',
        language: 'en',
        display_density: 'standard',
        notification_email: true,
        notification_push: true,
        notification_in_app: true
      })
      .eq('id', user.id);

    if (profileError) throw profileError;

    return NextResponse.json({
      success: true,
      data: {
        domains: [],
        subjects: [],
        uiSettings: {
          theme: 'system',
          language: 'en',
          displayDensity: 'standard',
          notifications: {
            email: true,
            push: true,
            inApp: true
          }
        }
      }
    });
  } catch (error) {
    console.error('Error resetting preferences:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'SERVER_ERROR',
          message: 'Failed to reset preferences',
          retryable: true
        } 
      },
      { status: 500 }
    );
  }
}
