'use client';

import { useState, useEffect } from 'react';
import { useDomainContext } from '@/hooks/use-domain-context';
import { useDomainListener } from '@/hooks/use-domain-listener';
import { useGlobalSettings } from '@/lib/stores/global-settings-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';

/**
 * Domain System Debug Panel
 * 
 * This component helps verify that the domain system is working correctly.
 * 
 * To use: Add this component temporarily to any page to check domain state:
 * import { DomainDebugPanel } from '@/components/debug/domain-debug-panel';
 * <DomainDebugPanel />
 * 
 * Remove before production or add it to a dev-only route.
 */
export function DomainDebugPanel() {
  const [events, setEvents] = useState<Array<{ time: Date; type: string; data: any }>>([]);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  
  const {
    activeDomain,
    activeDomains,
    selectedDomainIds,
    isInitialized,
    isLoading,
    isReady
  } = useDomainContext();

  const store = useGlobalSettings();

  // Listen for domain changes
  useDomainListener((event) => {
    setEvents(prev => [{
      time: new Date(),
      type: 'domain-changed',
      data: event
    }, ...prev].slice(0, 10));
  }, []);

  useEffect(() => {
    const handlers = [
      { event: 'global-domain-updated', handler: (e: any) => addEvent('global-domain-updated', e.detail) },
      { event: 'domain-context-refreshed', handler: (e: any) => addEvent('domain-context-refreshed', e.detail) }
    ];

    const addEvent = (type: string, data: any) => {
      setEvents(prev => [{ time: new Date(), type, data }, ...prev].slice(0, 10));
    };

    if (typeof window !== 'undefined') {
      handlers.forEach(({ event, handler }) => {
        window.addEventListener(event as any, handler);
      });

      return () => {
        handlers.forEach(({ event, handler }) => {
          window.removeEventListener(event as any, handler);
        });
      };
    }
  }, []);

  useEffect(() => {
    if (store.lastSyncedAt) {
      setLastSync(store.lastSyncedAt);
    }
  }, [store.lastSyncedAt]);

  const getStatusIcon = () => {
    if (!isInitialized) return <RefreshCw className="h-4 w-4 animate-spin text-yellow-500" />;
    if (isLoading) return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  return (
    <Card className="border-2 border-purple-500/50 bg-purple-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-mono">Domain System Debug Panel</CardTitle>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge variant={isReady ? "default" : "secondary"}>
              {isReady ? "Ready" : isLoading ? "Loading" : "Initializing"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-xs font-mono">
        {/* Current State */}
        <div className="space-y-2 rounded-lg bg-muted/50 p-3">
          <div className="font-semibold text-foreground">Current State</div>
          <div className="grid gap-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Domain:</span>
              <span className="font-semibold">{activeDomain?.name || 'None'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Domain ID:</span>
              <span>{activeDomain?.domain_id || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Selected Count:</span>
              <span>{selectedDomainIds.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Domains:</span>
              <span>{store.domains.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subjects:</span>
              <span>{store.subjects.length}</span>
            </div>
          </div>
        </div>

        {/* Selected Domains */}
        <div className="space-y-2 rounded-lg bg-muted/50 p-3">
          <div className="font-semibold text-foreground">Selected Domains</div>
          <div className="flex flex-wrap gap-1">
            {activeDomains.map(domain => (
              <Badge key={domain.domain_id} variant="outline" className="text-xs">
                {domain.name}
              </Badge>
            ))}
            {activeDomains.length === 0 && (
              <span className="text-muted-foreground">None selected</span>
            )}
          </div>
        </div>

        {/* Sync Info */}
        <div className="space-y-2 rounded-lg bg-muted/50 p-3">
          <div className="font-semibold text-foreground">Synchronization</div>
          <div className="grid gap-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Synced:</span>
              <span>{lastSync ? lastSync.toLocaleTimeString() : 'Never'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">localStorage Key:</span>
              <span className="truncate max-w-[150px]">global-settings</span>
            </div>
          </div>
        </div>

        {/* Recent Events */}
        <div className="space-y-2 rounded-lg bg-muted/50 p-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-foreground">Recent Events</div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEvents([])}
              className="h-6 px-2 text-xs"
            >
              Clear
            </Button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {events.length === 0 ? (
              <div className="text-muted-foreground">No events yet</div>
            ) : (
              events.map((event, i) => (
                <div key={i} className="rounded border border-border/50 bg-background p-2">
                  <div className="flex justify-between items-start gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {event.type}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {event.time.toLocaleTimeString()}
                    </span>
                  </div>
                  {event.data && (
                    <div className="mt-1 text-[10px] text-muted-foreground truncate">
                      {JSON.stringify(event.data)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Verification Checklist */}
        <div className="space-y-2 rounded-lg bg-muted/50 p-3">
          <div className="font-semibold text-foreground">Verification Checklist</div>
          <div className="space-y-1">
            <ChecklistItem
              label="Store initialized"
              passed={isInitialized}
            />
            <ChecklistItem
              label="Not loading"
              passed={!isLoading}
            />
            <ChecklistItem
              label="Has active domain"
              passed={!!activeDomain}
            />
            <ChecklistItem
              label="Has selected IDs"
              passed={selectedDomainIds.length > 0}
            />
            <ChecklistItem
              label="Has domains list"
              passed={store.domains.length > 0}
            />
            <ChecklistItem
              label="Ready state"
              passed={isReady}
            />
          </div>
        </div>

        <div className="text-center text-[10px] text-muted-foreground pt-2 border-t">
          Remove this component before deploying to production
        </div>
      </CardContent>
    </Card>
  );
}

function ChecklistItem({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {passed ? (
        <CheckCircle className="h-3 w-3 text-green-500" />
      ) : (
        <XCircle className="h-3 w-3 text-red-500" />
      )}
      <span className={passed ? "text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
    </div>
  );
}
