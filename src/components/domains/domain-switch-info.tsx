'use client';

import { Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function DomainSwitchInfo({ isFreeUser }: { isFreeUser: boolean }) {
  if (!isFreeUser) return null;

  return (
    <Alert className="bg-primary/5 border-primary/20">
      <Sparkles className="h-4 w-4 text-primary" />
      <AlertDescription className="text-sm">
        <strong>Free Plan:</strong> You can switch between any domain anytime. 
        Your subjects and content will automatically update to match your selected domain.
        Upgrade to Pro to select multiple domains simultaneously!
      </AlertDescription>
    </Alert>
  );
}
