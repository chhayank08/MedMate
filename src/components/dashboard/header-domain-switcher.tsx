"use client";

import { useEffect, useState, useMemo, useCallback, useTransition } from "react";
import { Check, Layers, Loader2, ChevronDown, Search, Sparkles } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useGlobalSettings } from "@/lib/stores/global-settings-store";
import { useDomains } from "@/hooks/use-domains";
import { useSubscription } from "@/hooks/use-subscription";
import { getDomainConfig } from "@/lib/domain-config";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function HeaderDomainSwitcher() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { predefinedDomains, customDomains, isLoading: domainsLoading } = useDomains();
  const { limits } = useSubscription();
  const {
    domains: storeDomains,
    selectedDomainIds,
    selectDomains,
    isLoading: settingsLoading,
    isInitialized,
    getActiveDomain
  } = useGlobalSettings();

  useEffect(() => {
    setMounted(true);
  }, []);

  const allDomains = useMemo(() => {
    if (!mounted) return [];
    const predefined = Array.isArray(predefinedDomains) ? predefinedDomains : [];
    const custom = Array.isArray(customDomains) ? customDomains : [];
    return [...predefined, ...custom].filter(d => d?.domain_id && d?.name);
  }, [predefinedDomains, customDomains, mounted]);

  const filteredDomains = useMemo(() => {
    if (!search) return allDomains;
    const query = search.toLowerCase();
    return allDomains.filter(d => 
      d.name.toLowerCase().includes(query) ||
      d.description?.toLowerCase().includes(query)
    );
  }, [allDomains, search]);

  const activeDomain = useMemo(() => {
    if (!mounted || !isInitialized) return null;
    return getActiveDomain();
  }, [mounted, isInitialized, getActiveDomain]);

  const handleSelect = useCallback(async (domainId: string) => {
    if (!mounted || isPending) return;

    startTransition(async () => {
      try {
        const isSelected = selectedDomainIds.includes(domainId);
        const maxDomains = limits?.domains || 1;
        let newSelection: string[];

        if (isSelected) {
          // Must keep at least one domain
          if (selectedDomainIds.length <= 1) {
            toast.error("You must have at least one domain selected");
            return;
          }
          newSelection = selectedDomainIds.filter(id => id !== domainId);
        } else {
          // For free users (maxDomains === 1), replace the current domain
          if (maxDomains === 1) {
            newSelection = [domainId];
          } else {
            // For paid users, check limit and add
            if (selectedDomainIds.length >= maxDomains) {
              toast.error(`Domain limit reached (${maxDomains}). Upgrade to add more.`);
              return;
            }
            newSelection = [...selectedDomainIds, domainId];
          }
        }

        await selectDomains(newSelection);
        const domainName = allDomains.find(d => d.domain_id === domainId)?.name;
        setOpen(false);
        setSearch("");
        
        // Trigger page refresh to update all domain-dependent content
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('domain-changed', { detail: { domainId, domainName } }));
        }
        
        toast.success(`Switched to ${domainName || 'selected domain'}`);
      } catch (error) {
        console.error("[HeaderDomainSwitcher] Selection error:", error);
        toast.error("Failed to update domains");
      }
    });
  }, [mounted, isPending, selectedDomainIds, limits, selectDomains, allDomains]);

  const isLoading = domainsLoading || settingsLoading || !mounted || !isInitialized || isPending;
  const maxDomains = limits?.domains || 1;
  const selectedCount = selectedDomainIds.length;

  if (!mounted) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="truncate">Loading...</span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {(() => {
                  if (!activeDomain) return <Layers className="h-4 w-4 shrink-0" />;
                  const domainKey = activeDomain.name.toLowerCase().replace(/\s+/g, '_') as any;
                  const config = getDomainConfig(domainKey);
                  const IconComponent = config?.iconComponent;
                  
                  return IconComponent ? (
                    <IconComponent className={cn("h-4 w-4 shrink-0", config?.color)} />
                  ) : activeDomain.icon_name ? (
                    <span className="text-base shrink-0">{activeDomain.icon_name}</span>
                  ) : (
                    <Layers className="h-4 w-4 shrink-0" />
                  );
                })()}
                <span className="truncate">
                  {activeDomain?.name || "Select domain"}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Badge variant="secondary" className="ml-1">
                  {selectedCount}/{maxDomains}
                </Badge>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="flex flex-col gap-2 p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search domains..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="flex items-center justify-between px-2 py-1 text-xs text-muted-foreground">
            <span>Learning Domains</span>
            <span>{selectedCount} / {maxDomains} selected</span>
          </div>
        </div>

        <ScrollArea className="h-[300px]">
          <div className="p-1">
            {filteredDomains.length > 0 ? (
              filteredDomains.map((domain) => {
                const isSelected = selectedDomainIds.includes(domain.domain_id);
                const isDisabled = !isSelected && selectedCount >= maxDomains;

                return (
                  <button
                    key={domain.domain_id}
                    onClick={() => !isDisabled && handleSelect(domain.domain_id)}
                    disabled={isDisabled}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      "disabled:pointer-events-none disabled:opacity-50",
                      isSelected && "bg-accent/50"
                    )}
                  >
                    {(() => {
                      const domainKey = domain.name.toLowerCase().replace(/\s+/g, '_') as any;
                      const config = getDomainConfig(domainKey);
                      const IconComponent = config?.iconComponent;
                      
                      return IconComponent ? (
                        <IconComponent className={cn("h-5 w-5 shrink-0", config?.color)} />
                      ) : domain.icon_name ? (
                        <span className="text-lg shrink-0">{domain.icon_name}</span>
                      ) : (
                        <Layers className="h-5 w-5 shrink-0 text-muted-foreground" />
                      );
                    })()}
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-medium truncate">{domain.name}</div>
                      {domain.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {domain.description}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {search ? "No domains found" : "No domains available"}
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator />
        {maxDomains === 1 ? (
          <div className="p-3">
            <div className="flex items-start gap-2 text-xs">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Free plan:</span> Switch between domains anytime.
                </p>
                <Link
                  href="/subscription"
                  className="inline-flex items-center gap-1 text-primary font-semibold hover:underline"
                  onClick={() => setOpen(false)}
                >
                  Upgrade for multiple domains →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Pro tip:</span> Select up to {maxDomains} domains to customize your learning experience across multiple fields.
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
