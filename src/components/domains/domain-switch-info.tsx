'use client';

import { Sparkles, Crown, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function DomainSwitchInfo({ isFreeUser }: { isFreeUser: boolean }) {
  return (
    <Alert className={cn(
      "border-2 transition-all",
      isFreeUser 
        ? "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30 hover:border-primary/50" 
        : "bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-purple-500/10 border-purple-500/30 hover:border-purple-500/50"
    )}>
      <div className="flex items-start gap-3">
        {isFreeUser ? (
          <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        ) : (
          <Crown className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
        )}
        <div className="flex-1 space-y-2">
          <div className="font-semibold text-sm">
            {isFreeUser ? (
              <span className="text-primary">Free Plan Active</span>
            ) : (
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Premium Active</span>
            )}
          </div>
          <AlertDescription className="text-sm">
            {isFreeUser ? (
              <div className="space-y-2">
                <p>
                  You can switch between any domain anytime. Your learning experience (subjects, content, recommendations) automatically adapts to your selected domain.
                </p>
                <p className="font-medium text-foreground">
                  Upgrade to Pro to enable multiple domains simultaneously and get cross-domain insights!
                </p>
              </div>
            ) : (
              <p>
                You can select multiple domains at once! Your dashboard will show content from all your selected domains, giving you a comprehensive learning experience across fields.
              </p>
            )}
          </AlertDescription>
        </div>
        {isFreeUser && (
          <Button size="sm" variant="default" asChild className="shrink-0">
            <Link href="/subscription">Upgrade Now</Link>
          </Button>
        )}
      </div>
    </Alert>
  );
}

import { cn } from '@/lib/utils';
