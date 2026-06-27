// ============================================================================
// UI Settings API
// Task 4.4: Create UI settings API
// Requirements: 3.3, 3.8, 9.3, 9.5
// ============================================================================

import { NextResponse } from 'next/server';
import { guard } from '@/lib/api';
import { z } from 'zod';

const uiSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.enum(['en', 'es', 'fr', 'de']).optional(),
  displayDensity: z.enum(['compact', 'standard', 'comfortable']).optional(),
  notifications: z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    inApp: z.boolean().optional()
  }).optional()
});

export async function POST(request: Request) {
  try {
    const auth = await guard('preferences:ui-settings');
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth;

    const body = await request.json();
    const validation = uiSettingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR',
            message: 'Invalid UI settings',
            details: validation.error.errors,
            retryable: true
          } 
        },
        { status: 400 }
      );
    }

    const { theme, language, displayDensity, notifications } = validation.data;

    // Build update object
    const updates: Record<string, any> = {};
    if (theme) updates.theme = theme;
    if (language) updates.language = language;
    if (displayDensity) updates.display_density = displayDensity;
    if (notifications?.email !== undefined) updates.notification_email = notifications.email;
    if (notifications?.push !== undefined) updates.notification_push = notifications.push;
    if (notifications?.inApp !== undefined) updates.notification_in_app = notifications.inApp;

    // Update profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (updateError) throw updateError;

    // Load updated settings
    const { data: profile, error: loadError } = await supabase
      .from('profiles')
      .select('theme, language, display_density, notification_email, notification_push, notification_in_app')
      .eq('id', user.id)
      .single();

    if (loadError) throw loadError;

    return NextResponse.json({
      success: true,
      data: {
        uiSettings: {
          theme: profile.theme,
          language: profile.language,
          displayDensity: profile.display_density,
          notifications: {
            email: profile.notification_email,
            push: profile.notification_push,
            inApp: profile.notification_in_app
          }
        }
      }
    });
  } catch (error) {
    console.error('Error updating UI settings:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'SERVER_ERROR',
          message: 'Failed to update UI settings',
          retryable: true
        } 
      },
      { status: 500 }
    );
  }
}
