// ============================================================================
// Subjects API
// Task 5.3: Create subjects API
// Requirements: 2.1, 2.2, 13.3
// ============================================================================

import { NextResponse } from 'next/server';
import { guard } from '@/lib/api';

export async function GET(request: Request) {
  try {
    const auth = await guard('subjects:list');
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth;

    const { searchParams } = new URL(request.url);
    const domainIds = searchParams.getAll('domainId');

    let query = supabase
      .from('subjects')
      .select('*, domains(*)');

    // Filter by domain IDs if provided
    if (domainIds.length > 0) {
      query = query.in('domain_id', domainIds);
    }

    const { data: subjects, error } = await query;

    if (error) {
      if (error.code === '22P02') { // Invalid UUID format
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              code: 'VALIDATION_ERROR',
              message: 'Invalid domain ID format',
              retryable: false
            } 
          },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: { subjects: subjects || [] }
    });
  } catch (error) {
    console.error('Error loading subjects:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'SERVER_ERROR',
          message: 'Failed to load subjects',
          retryable: true
        } 
      },
      { status: 500 }
    );
  }
}
