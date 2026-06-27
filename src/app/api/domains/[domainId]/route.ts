// ============================================================================
// Domain Delete API
// Task 5.2: Create domain delete API
// Requirements: 13.9
// ============================================================================

import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ domainId: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { domainId } = await params;

    // Verify user owns this custom domain
    const { data: domain, error: fetchError } = await supabase
      .from('domains')
      .select('*')
      .eq('domain_id', domainId)
      .eq('created_by', user.id)
      .eq('is_predefined', false)
      .single();

    if (fetchError || !domain) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'NOT_FOUND',
            message: 'Domain not found or you do not have permission to delete it',
            retryable: false
          } 
        },
        { status: 404 }
      );
    }

    // Check for content references
    const { count: quizCount } = await supabase
      .from('quizzes')
      .select('*', { count: 'exact', head: true })
      .eq('domain_id', domainId);

    const { count: summaryCount } = await supabase
      .from('summaries')
      .select('*', { count: 'exact', head: true })
      .eq('domain_id', domainId);

    const { count: taskCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('domain_id', domainId);

    const totalReferences = (quizCount || 0) + (summaryCount || 0) + (taskCount || 0);

    if (totalReferences > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'DOMAIN_HAS_REFERENCES',
            message: 'Domain has associated content. Reassign or delete content first.',
            details: {
              quizzes: quizCount || 0,
              summaries: summaryCount || 0,
              tasks: taskCount || 0
            },
            retryable: false
          } 
        },
        { status: 400 }
      );
    }

    // Delete domain (cascade will handle user_domains)
    const { error: deleteError } = await supabase
      .from('domains')
      .delete()
      .eq('domain_id', domainId);

    if (deleteError) throw deleteError;

    return NextResponse.json({
      success: true,
      data: { message: 'Domain deleted successfully' }
    });
  } catch (error) {
    console.error('Error deleting domain:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'SERVER_ERROR',
          message: 'Failed to delete domain',
          retryable: true
        } 
      },
      { status: 500 }
    );
  }
}
