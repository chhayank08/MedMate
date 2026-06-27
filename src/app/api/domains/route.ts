// ============================================================================
// Domains API
// Task 5.1: Create domains API
// Requirements: 1.1, 1.2, 1.8, 1.9, 13.8
// ============================================================================

import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createDomainSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-zA-Z0-9\s-]+$/, 'Only letters, numbers, spaces, and hyphens allowed'),
  description: z.string().max(500).optional()
});

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

    // Get predefined domains
    const { data: predefined, error: predefinedError } = await supabase
      .from('domains')
      .select('*')
      .eq('is_predefined', true);

    if (predefinedError) throw predefinedError;

    // Get user's custom domains
    const { data: custom, error: customError } = await supabase
      .from('domains')
      .select('*')
      .eq('created_by', user.id)
      .eq('is_predefined', false);

    if (customError) throw customError;

    return NextResponse.json({
      success: true,
      data: {
        predefined: predefined || [],
        custom: custom || []
      }
    });
  } catch (error) {
    console.error('Error loading domains:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'SERVER_ERROR',
          message: 'Failed to load domains',
          retryable: true
        } 
      },
      { status: 500 }
    );
  }
}

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
    const validation = createDomainSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR',
            message: validation.error.errors[0].message,
            details: validation.error.errors,
            retryable: true
          } 
        },
        { status: 400 }
      );
    }

    // Check custom domain limit (max 10)
    const { count, error: countError } = await supabase
      .from('domains')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', user.id)
      .eq('is_predefined', false);

    if (countError) throw countError;

    if ((count || 0) >= 10) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'CUSTOM_DOMAIN_LIMIT_EXCEEDED',
            message: 'Maximum 10 custom domains allowed',
            retryable: false
          } 
        },
        { status: 400 }
      );
    }

    const { name, description } = validation.data;

    // Create custom domain
    const { data: domain, error: insertError } = await supabase
      .from('domains')
      .insert({
        name,
        description,
        is_predefined: false,
        created_by: user.id
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'VALIDATION_ERROR',
              message: 'A domain with this name already exists',
              retryable: false
            } 
          },
          { status: 400 }
        );
      }
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      data: { domain }
    });
  } catch (error) {
    console.error('Error creating domain:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'SERVER_ERROR',
          message: 'Failed to create domain',
          retryable: true
        } 
      },
      { status: 500 }
    );
  }
}
