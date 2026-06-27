"use client";

import { useCallback, useMemo, useTransition, useState, useEffect } from "react";
import { Layers, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { usePreferences } from "@/hooks/use-preferences";
import { useDomains } from "@/hooks/use-domains";
import { useSubscription } from "@/hooks/use-subscription";
import { toast } from "sonner";

export function DomainSelectorButton() {
  const { preferences, updateDomains, isLoading: prefsLoading } = usePreferences();
  const { predefinedDomains, customDomains, isLoading: domainsLoading } = useDomains();
  const { limits, isLoading: subsLoading } = useSubscription();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const allDomains = useMemo(() => {
    if (!mounted) return [];
    const predefined = Array.isArray(predefinedDomains) ? predefinedDomains : [];
    const custom = Array.isArray(customDomains) ? customDomains : [];
    return [...predefined, ...custom].filter(d => d && d.domain_id && d.name);
  }, [predefinedDomains, customDomains, mounted]);

  const selectedDomainIds = useMemo(() => {
    if (!mounted || !preferences?.domains || !Array.isArray(preferences.domains)) return [];
    return preferences.domains
      .map(d => d?.domain_id)
      .filter((id): id is string => Boolean(id));
  }, [preferences?.domains, mounted]);

  const handleToggle = useCallback((domainId: string) => {
    if (!mounted) return;
    
    startTransition(() => {
      try {
        const isSelected = selectedDomainIds.includes(domainId);
        let newSelection: string[];

        if (isSelected) {
          if (selectedDomainIds.length <= 1) {
            toast.error('You must have at least one domain selected');
            return;
          }
          newSelection = selectedDomainIds.filter(id => id !== domainId);
        } else {
          const maxDomains = limits?.domains || 1;
          if (selectedDomainIds.length >= maxDomains) {
            toast.error(`Domain limit reached (${maxDomains}). Upgrade to add more domains.`);
            return;
          }
          newSelection = [...selectedDomainIds, domainId];
        }

        updateDomains(newSelection);
      } catch (error) {
        console.error('[DomainSelector] Toggle failed:', error);
        toast.error('Failed to update domain selection');
      }
    });
  }, [selectedDomainIds, limits, updateDomains, mounted]);

  const selectedCount = selectedDomainIds.length;
  const maxDomains = limits?.domains || 1;
  const isLoading = prefsLoading || domainsLoading || subsLoading || !mounted;

  if (!mounted) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2" 
            disabled={isPending || isLoading}
          />
        }
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Layers className="size-4" />
        )}
        <span className="hidden sm:inline">Domains</span>
        <Badge variant="secondary" className="ml-1">
          {selectedCount}/{maxDomains}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Learning Domains</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {allDomains.length > 0 ? (
          allDomains.map((domain) => {
            const isSelected = selectedDomainIds.includes(domain.domain_id);
            const isDisabled = !isSelected && selectedDomainIds.length >= maxDomains;

            return (
              <DropdownMenuItem
                key={domain.domain_id}
                onClick={(e) => {
                  e.preventDefault();
                  if (!isDisabled && !isPending) {
                    handleToggle(domain.domain_id);
                  }
                }}
                disabled={isDisabled || isPending}
                className="flex items-center justify-between gap-2 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{domain.name}</div>
                  {domain.description && (
                    <div className="text-xs text-muted-foreground truncate">
                      {domain.description}
                    </div>
                  )}
                </div>
                {isSelected && <Check className="size-4 text-primary shrink-0" />}
              </DropdownMenuItem>
            );
          })
        ) : (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            {isLoading ? 'Loading domains...' : 'No domains available'}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
