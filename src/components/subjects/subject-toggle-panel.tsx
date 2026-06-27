// ============================================================================
// Subject Toggle Panel Component - Task 17.3
// Requirements: 2.1, 2.7, 9.10
// ============================================================================

'use client';

import { SubjectWithDomain } from '@/types/domain.types';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface SubjectTogglePanelProps {
  subjects: SubjectWithDomain[];
  onToggle: (subjectId: string, enabled: boolean) => void;
}

export function SubjectTogglePanel({ subjects, onToggle }: SubjectTogglePanelProps) {
  const subjectsByDomain = subjects.reduce((acc, subject) => {
    const domainName = subject.domain.name;
    if (!acc[domainName]) acc[domainName] = [];
    acc[domainName].push(subject);
    return acc;
  }, {} as Record<string, SubjectWithDomain[]>);

  return (
    <div className="space-y-6">
      {Object.entries(subjectsByDomain).map(([domainName, domainSubjects]) => {
        const enabledCount = domainSubjects.filter(s => s.enabled).length;
        
        return (
          <div key={domainName} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{domainName}</h3>
              <Badge variant="secondary">{enabledCount} / {domainSubjects.length}</Badge>
            </div>
            <div className="space-y-2 pl-2">
              {domainSubjects.map(subject => (
                <div key={subject.subject_id} className="flex items-center justify-between py-2">
                  <Label htmlFor={subject.subject_id} className="cursor-pointer">
                    {subject.name}
                  </Label>
                  <Switch
                    id={subject.subject_id}
                    checked={subject.enabled}
                    onCheckedChange={(checked) => onToggle(subject.subject_id, checked)}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
