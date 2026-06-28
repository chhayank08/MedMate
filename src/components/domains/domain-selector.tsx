// ============================================================================
// Domain Selector Component - Unified Domain Selection UI
// Used in Settings and supports both single and multi-domain selection
// ============================================================================

'use client';

import { useMemo, useCallback, type MouseEvent, useTransition } from 'react';
import { Domain } from '@/types/domain.types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, AlertCircle, Layers, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDomainConfig } from '@/lib/domain-config';

interface DomainSelectorProps {
  domains: Domain[];
  selectedDomains: string[];
  onSelectionChange: (domains: string[]) => void;
  maxSelections: number;
}

export function DomainSelector({ domains, selectedDomains, onSelectionChange, maxSelections }: DomainSelectorProps) {
  const [isPending, startTransition] = useTransition();
  
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
    
    if (isPending) return;
    
    startTransition(() => {
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
          
          // Trigger domain change event for global updates
          if (typeof window !== 'undefined') {
            const domain = validDomains.find(d => d.domain_id === domainId);
            window.dispatchEvent(new CustomEvent('domain-changed', { 
              detail: { domainId, domainName: domain?.name } 
            }));
          }
        }
      } catch (error) {
        console.error('[DomainSelector] Toggle error:', error);
      }
    });
  }, [validSelectedDomains, maxSelections, onSelectionChange, validDomains, isPending]);

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
          
          // Try to match domain name to config
          const domainKey = domain.name.toLowerCase().replace(/\s+/g, '_');
          const domainConfig = getDomainConfig(domainKey as any);
          const IconComponent = domainConfig?.iconComponent;

          return (
            <Card
              key={domain.domain_id}
              className={cn(
                "p-4 cursor-pointer transition-all relative",
                "hover:scale-[1.02] hover:shadow-lg",
                isSelected && "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md",
                isDisabled && "opacity-50 cursor-not-allowed",
                !isSelected && !isDisabled && "hover:border-primary/50",
                isPending && "pointer-events-none"
              )}
              onClick={(e) => !isDisabled && handleToggle(domain.domain_id, e)}
              role="button"
              tabIndex={isDisabled ? -1 : 0}
              aria-pressed={isSelected}
              aria-disabled={isDisabled}
            >
              {isPending && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg backdrop-blur-sm">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className={cn("mt-0.5 shrink-0 transition-all", domainConfig?.color, isSelected && "scale-110")}>
                  {IconComponent ? (
                    <IconComponent className="h-6 w-6" />
                  ) : domain.icon_name ? (
                    <span className="text-2xl">{domain.icon_name}</span>
                  ) : (
                    <Layers className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-base leading-tight">{domain.name || 'Unnamed Domain'}</h3>
                    {isSelected && (
                      <Badge variant="default" className="shrink-0">
                        <Check className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                  {domain.description && (
                    <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{domain.description}</p>
                  )}
                </div>
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
