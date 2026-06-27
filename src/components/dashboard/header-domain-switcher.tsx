"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Check, Layers, Loader2, ChevronDown, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGlobalSettings } from "@/lib/stores/global-settings-store";
import { useDomains } from "@/hooks/use-domains";
import { useSubscription } from "@/hooks/use-subscription";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function HeaderDomainSwitcher() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);

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
    if (!mounted) return;

    try {
      const isSelected = selectedDomainIds.includes(domainId);
      let newSelection: string[];

      if (isSelected) {
        // Must keep at least one domain
        if (selectedDomainIds.length <= 1) {
          toast.error("You must have at least one domain selected");
          return;
        }
        newSelection = selectedDomainIds.filter(id => id !== domainId);
      } else {
        const maxDomains = limits?.domains || 1;
        if (selectedDomainIds.length >= maxDomains) {
          toast.error(`Domain limit reached (${maxDomains}). Upgrade to add more.`);
          return;
        }
        newSelection = [...selectedDomainIds, domainId];
      }

      await selectDomains(newSelection);
      setOpen(false);
      setSearch("");
      toast.success("Domains updated");
    } catch (error) {
      console.error("[HeaderDomainSwitcher] Selection error:", error);
      toast.error("Failed to update domains");
    }
  }, [mounted, selectedDomainIds, limits, selectDomains]);

  const isLoading = domainsLoading || settingsLoading || !mounted || !isInitialized;
  const maxDomains = limits?.domains || 1;
  const selectedCount = selectedDomainIds.length;

  if (!mounted) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
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
                <Layers className="h-4 w-4 shrink-0" />
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
                      "flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      "disabled:pointer-events-none disabled:opacity-50",
                      isSelected && "bg-accent/50"
                    )}
                  >
                    <div className="flex h-5 w-5 items-center justify-center shrink-0">
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-medium truncate">{domain.name}</div>
                      {domain.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {domain.description}
                        </div>
                      )}
                    </div>
                    {domain.icon_name && (
                      <span className="text-lg shrink-0">{domain.icon_name}</span>
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

        {maxDomains > 1 && (
          <div className="border-t p-2 text-xs text-muted-foreground">
            💡 Tip: Select multiple domains to customize your learning experience
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
