// ============================================================================
// Domain Selector Component - Task 16.2
// Requirements: 1.1, 1.4, 1.6, 6.6
// ============================================================================

'use client';

import { useMemo, useCallback } from 'react';
import { Domain } from '@/types/domain.types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DomainSelectorProps {
  domains: Domain[];
  selectedDomains: string[];
  onSelectionChange: (domains: string[]) => void;
  maxSelections: number;
}

export function DomainSelector({ domains, selectedDomains, onSelectionChange, maxSelections }: DomainSelectorProps) {
  const validDomains = useMemo(() => 
    (domains || []).filter(d => d && d.domain_id), 
    [domains]
  );

  const validSelectedDomains = useMemo(() => 
    (selectedDomains || []).filter(Boolean),
    [selectedDomains]
  );

  const handleToggle = useCallback((domainId: string) => {
    try {
      const isSelected = validSelectedDomains.includes(domainId);
      const newSelection = isSelected 
        ? validSelectedDomains.filter(id => id !== domainId)
        : validSelectedDomains.length < maxSelections 
          ? [...validSelectedDomains, domainId] 
          : validSelectedDomains;
      
      if (newSelection !== validSelectedDomains) {
        onSelectionChange(newSelection);
      }
    } catch (error) {
      console.error('[DomainSelector] Toggle error:', error);
    }
  }, [validSelectedDomains, maxSelections, onSelectionChange]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {validDomains.map(domain => {
        const isSelected = validSelectedDomains.includes(domain.domain_id);
        const isDisabled = !isSelected && validSelectedDomains.length >= maxSelections;

        return (
          <Card
            key={domain.domain_id}
            className={cn(
              "p-4 cursor-pointer transition-all hover:scale-102",
              isSelected && "border-primary bg-primary/5",
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !isDisabled && handleToggle(domain.domain_id)}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{domain.name || 'Unnamed Domain'}</h3>
                {domain.description && <p className="text-sm text-muted-foreground mt-1">{domain.description}</p>}
              </div>
              {isSelected && <Badge><Check className="h-3 w-3" /></Badge>}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
