// ============================================================================
// Subject Selection API
// Task 4.3: Create subject selection API
// Requirements: 2.3, 2.4, 2.7, 2.9, 3.8
// ============================================================================

import { NextResponse } from 'next/server';
import { guard } from '@/lib/api';
import { z } from 'zod';

const subjectSelectionSchema = z.object({
  subjects: z.array(z.object({
    subjectId: z.string().uuid(),
    enabled: z.boolean()
  }))
});

export async function POST(request: Request) {
  try {
    const auth = await guard('preferences:subjects');
    if (!auth.ok) return auth.response;
    const { user, supabase } = auth;

    const body = await request.json();
    const validation = subjectSelectionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR',
            message: 'Invalid subject selection',
            details: validation.error.issues,
            retryable: true
          } 
        },
        { status: 400 }
      );
    }

    const { subjects } = validation.data;
    const enabledSubjects = subjects.filter(s => s.enabled);

    // Validate at least one subject is enabled
    if (enabledSubjects.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'AT_LEAST_ONE_SUBJECT_REQUIRED',
            message: 'At least one subject must be enabled',
            retryable: false
          } 
        },
        { status: 400 }
      );
    }

    // Get user's selected domains
    const { data: userDomains } = await supabase
      .from('user_domains')
      .select('domain_id');

    const domainIds = (userDomains || []).map(d => d.domain_id);

    // Validate subjects belong to selected domains
    const subjectIds = subjects.map(s => s.subjectId);
    const { data: validSubjects, error: validateError } = await supabase
      .from('subjects')
      .select('subject_id, domain_id')
      .in('subject_id', subjectIds);

    if (validateError) throw validateError;

    const invalidSubjects = (validSubjects || []).filter(
      s => !domainIds.includes(s.domain_id)
    );

    if (invalidSubjects.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR',
            message: 'Some subjects do not belong to selected domains',
            retryable: false
          } 
        },
        { status: 400 }
      );
    }

    // Delete all current subject selections
    const { error: deleteError } = await supabase
      .from('user_subjects')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    // Insert enabled subjects
    if (enabledSubjects.length > 0) {
      const { error: insertError } = await supabase
        .from('user_subjects')
        .insert(enabledSubjects.map(s => ({
          user_id: user.id,
          subject_id: s.subjectId
        })));

      if (insertError) throw insertError;
    }

    // Load updated subjects
    const { data: allSubjects } = await supabase
      .from('subjects')
      .select('*, domains(*)')
      .in('domain_id', domainIds);

    const enabledSet = new Set(enabledSubjects.map(s => s.subjectId));

    return NextResponse.json({
      success: true,
      data: {
        subjects: (allSubjects || []).map(s => ({
          ...s,
          enabled: enabledSet.has(s.subject_id)
        }))
      }
    });
  } catch (error) {
    console.error('Error updating subjects:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'SERVER_ERROR',
          message: 'Failed to update subject selection',
          retryable: true
        } 
      },
      { status: 500 }
    );
  }
}
