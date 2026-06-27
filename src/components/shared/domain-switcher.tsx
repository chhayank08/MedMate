'use client';

import { useState } from 'react';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useActiveDomain, useDomainSelection, useGlobalSettings } from '@/lib/stores/global-settings-store';
import { toast } from 'sonner';

export function DomainSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const activeDomain = useActiveDomain();
  const { selectDomains, isLoading } = useDomainSelection();
  const domains = useGlobalSettings(state => state.domains);

  const handleSelectDomain = async (domainId: string) => {
    if (domainId === activeDomain.domain_id || isLoading) return;

    try {
      await selectDomains([domainId]);
      toast.success(`Switched to ${domains.find(d => d.domain_id === domainId)?.name}`);
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to switch domain');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card/60 backdrop-blur-xl border border-white/10 hover:bg-card/80 transition-all"
      >
        <span className="text-xl">{activeDomain.icon_name || '🎓'}</span>
        <span className="font-medium text-sm hidden sm:inline">{activeDomain.name}</span>
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-2 w-64 bg-card/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden"
            >
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                  Switch Domain
                </div>
                <div className="space-y-1">
                  {domains.map((domain) => (
                    <button
                      key={domain.domain_id}
                      onClick={() => handleSelectDomain(domain.domain_id)}
                      disabled={isLoading}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                        transition-all text-left
                        ${domain.domain_id === activeDomain.domain_id
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-white/5'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      <span className="text-xl">{domain.icon_name || '🎓'}</span>
                      <span className="flex-1 font-medium text-sm">{domain.name}</span>
                      {domain.domain_id === activeDomain.domain_id && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
