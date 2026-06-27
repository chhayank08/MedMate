// ============================================================================
// Domain Selector Component - Task 16.2
// Requirements: 1.1, 1.4, 1.6, 6.6
// ============================================================================

'use client';

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
  const handleToggle = (domainId: string) => {
    const isSelected = selectedDomains.includes(domainId);
    const newSelection = isSelected 
      ? selectedDomains.filter(id => id !== domainId)
      : selectedDomains.length < maxSelections ? [...selectedDomains, domainId] : selectedDomains;
    onSelectionChange(newSelection);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {domains.map(domain => {
        const isSelected = selectedDomains.includes(domain.domain_id);
        const isDisabled = !isSelected && selectedDomains.length >= maxSelections;

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
                <h3 className="font-semibold">{domain.name}</h3>
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
