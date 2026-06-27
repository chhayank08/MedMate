"use client";

import { useCallback, useMemo, useTransition } from "react";
import { Layers, Check } from "lucide-react";
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
  const { preferences, updateDomains } = usePreferences();
  const { predefinedDomains, customDomains } = useDomains();
  const { limits } = useSubscription();
  const [isPending, startTransition] = useTransition();

  const allDomains = useMemo(() => {
    const predefined = Array.isArray(predefinedDomains) ? predefinedDomains : [];
    const custom = Array.isArray(customDomains) ? customDomains : [];
    return [...predefined, ...custom].filter(d => d && d.domain_id);
  }, [predefinedDomains, customDomains]);

  const selectedDomainIds = useMemo(() => {
    if (!preferences?.domains || !Array.isArray(preferences.domains)) return [];
    return preferences.domains
      .map(d => d?.domain_id)
      .filter((id): id is string => Boolean(id));
  }, [preferences?.domains]);

  const handleToggle = useCallback((domainId: string) => {
    startTransition(() => {
      try {
        const isSelected = selectedDomainIds.includes(domainId);
        let newSelection: string[];

        if (isSelected) {
          newSelection = selectedDomainIds.filter(id => id !== domainId);
        } else {
          if (limits && selectedDomainIds.length >= limits.domains) {
            toast.error(`Domain limit reached. Upgrade to add more domains.`);
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
  }, [selectedDomainIds, limits, updateDomains]);

  const selectedCount = selectedDomainIds.length;
  const maxDomains = limits?.domains || 1;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2" disabled={isPending} />
        }
      >
        <Layers className="size-4" />
        <span className="hidden sm:inline">Domains</span>
        <Badge variant="secondary" className="ml-1">
          {selectedCount}/{maxDomains}
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Learning Domains</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {allDomains.map((domain) => {
          const isSelected = selectedDomainIds.includes(domain.domain_id);
          const isDisabled = !isSelected && selectedDomainIds.length >= maxDomains;

          return (
            <DropdownMenuItem
              key={domain.domain_id}
              onClick={(e) => {
                e.preventDefault();
                if (!isDisabled) {
                  handleToggle(domain.domain_id);
                }
              }}
              disabled={isDisabled}
              className="flex items-center justify-between gap-2"
            >
              <div className="flex-1">
                <div className="font-medium">{domain.name || 'Unnamed Domain'}</div>
                {domain.description && (
                  <div className="text-xs text-muted-foreground truncate">
                    {domain.description}
                  </div>
                )}
              </div>
              {isSelected && <Check className="size-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
        {allDomains.length === 0 && (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No domains available
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
