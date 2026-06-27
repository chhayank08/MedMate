// ============================================================================
// Subject Toggle Panel Component - Task 17.3
// Requirements: 2.1, 2.7, 9.10
// ============================================================================

'use client';

import { SubjectWithDomain } from '@/types/domain.types';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { useMemo } from 'react';

interface SubjectTogglePanelProps {
  subjects: SubjectWithDomain[];
  onToggle: (subjectId: string, enabled: boolean) => void;
}

function validateSubject(subject: unknown): subject is SubjectWithDomain {
  if (!subject || typeof subject !== 'object') return false;
  const s = subject as Partial<SubjectWithDomain>;
  return Boolean(
    s.subject_id && 
    s.name && 
    s.domain && 
    typeof s.domain === 'object' &&
    s.domain.name
  );
}

export function SubjectTogglePanel({ subjects, onToggle }: SubjectTogglePanelProps) {
  const validSubjects = useMemo(() => {
    try {
      return (subjects || []).filter(validateSubject);
    } catch (error) {
      console.error('[SubjectTogglePanel] Validation error:', error);
      return [];
    }
  }, [subjects]);

  const subjectsByDomain = useMemo(() => {
    try {
      return validSubjects.reduce((acc, subject) => {
        const domainName = subject.domain?.name || 'Unknown Domain';
        if (!acc[domainName]) acc[domainName] = [];
        acc[domainName].push(subject);
        return acc;
      }, {} as Record<string, SubjectWithDomain[]>);
    } catch (error) {
      console.error('[SubjectTogglePanel] Grouping error:', error);
      return {};
    }
  }, [validSubjects]);

  if (!validSubjects.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          No subjects available. Select a domain to view subjects.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(subjectsByDomain).map(([domainName, domainSubjects]) => {
        try {
          const enabledCount = domainSubjects.filter(s => s.enabled).length;
          
          return (
            <div key={domainName} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{domainName}</h3>
                <Badge variant="secondary">{enabledCount} / {domainSubjects.length}</Badge>
              </div>
              <div className="space-y-2 pl-2">
                {domainSubjects.map(subject => {
                  try {
                    return (
                      <div key={subject.subject_id} className="flex items-center justify-between py-2">
                        <Label htmlFor={subject.subject_id} className="cursor-pointer">
                          {subject.name}
                        </Label>
                        <Switch
                          id={subject.subject_id}
                          checked={Boolean(subject.enabled)}
                          onCheckedChange={(checked) => onToggle(subject.subject_id, checked)}
                        />
                      </div>
                    );
                  } catch (error) {
                    console.error('[SubjectTogglePanel] Render subject error:', subject, error);
                    return null;
                  }
                })}
              </div>
            </div>
          );
        } catch (error) {
          console.error('[SubjectTogglePanel] Render domain error:', domainName, error);
          return null;
        }
      })}
    </div>
  );
}
