// ============================================================================
// Domain Selector Component - Task 16.2
// Requirements: 1.1, 1.4, 1.6, 6.6
// ============================================================================

'use client';

import { useMemo, useCallback, type MouseEvent } from 'react';
import { Domain } from '@/types/domain.types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DomainSelectorProps {
  domains: Domain[];
  selectedDomains: string[];
  onSelectionChange: (domains: string[]) => void;
  maxSelections: number;
}

export function DomainSelector({ domains, selectedDomains, onSelectionChange, maxSelections }: DomainSelectorProps) {
  const validDomains = useMemo(() => {
    try {
      return (domains || []).filter(d => d && d.domain_id && d.name);
    } catch (error) {
      console.error('[DomainSelector] Error filtering domains:', error);
      return [];
    }
  }, [domains]);

  const validSelectedDomains = useMemo(() => {
    try {
      return (selectedDomains || []).filter(id => id && typeof id === 'string');
    } catch (error) {
      console.error('[DomainSelector] Error filtering selected domains:', error);
      return [];
    }
  }, [selectedDomains]);

  const handleToggle = useCallback((domainId: string, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (!domainId || typeof domainId !== 'string') {
        console.warn('[DomainSelector] Invalid domain ID:', domainId);
        return;
      }

      const isSelected = validSelectedDomains.includes(domainId);
      let newSelection: string[];
      
      if (maxSelections === 1) {
        // Single selection mode (free users): always replace
        newSelection = [domainId];
      } else {
        // Multi-selection mode (paid users): toggle
        newSelection = isSelected 
          ? validSelectedDomains.filter(id => id !== domainId)
          : validSelectedDomains.length < maxSelections 
            ? [...validSelectedDomains, domainId] 
            : validSelectedDomains;
      }
      
      if (JSON.stringify(newSelection.sort()) !== JSON.stringify(validSelectedDomains.sort())) {
        onSelectionChange(newSelection);
      }
    } catch (error) {
      console.error('[DomainSelector] Toggle error:', error);
    }
  }, [validSelectedDomains, maxSelections, onSelectionChange]);

  if (!validDomains.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No domains available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {validDomains.map(domain => {
        try {
          const isSelected = validSelectedDomains.includes(domain.domain_id);
          const isDisabled = maxSelections > 1 && !isSelected && validSelectedDomains.length >= maxSelections;

          return (
            <Card
              key={domain.domain_id}
              className={cn(
                "p-4 cursor-pointer transition-all hover:scale-102",
                isSelected && "border-primary bg-primary/5",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={(e) => !isDisabled && handleToggle(domain.domain_id, e)}
              role="button"
              tabIndex={isDisabled ? -1 : 0}
              aria-pressed={isSelected}
              aria-disabled={isDisabled}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{domain.name || 'Unnamed Domain'}</h3>
                  {domain.description && <p className="text-sm text-muted-foreground mt-1">{domain.description}</p>}
                </div>
                {isSelected && (
                  <Badge variant="default" className="shrink-0">
                    <Check className="h-3 w-3" />
                  </Badge>
                )}
              </div>
            </Card>
          );
        } catch (error) {
          console.error('[DomainSelector] Error rendering domain:', domain, error);
          return null;
        }
      })}
    </div>
  );
}
