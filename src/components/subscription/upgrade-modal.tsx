// ============================================================================
// Upgrade Modal Component - Task 14.1
// Requirements: 6.6, 15.1, 15.2, 15.3, 15.6
// ============================================================================

'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: string;
  currentUsage: number;
  currentLimit: number;
  recommendedTier: 'pro' | 'premium';
}

export function UpgradeModal({ isOpen, onClose, limitType, currentUsage, currentLimit, recommendedTier }: UpgradeModalProps) {
  const router = useRouter();
  const percentage = (currentUsage / currentLimit) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade Required</DialogTitle>
          <DialogDescription>
            You have reached your {limitType} limit
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Current usage</span>
              <span className="font-semibold">{currentUsage} / {currentLimit}</span>
            </div>
            <Progress value={percentage} className="h-2" />
          </div>

          <p className="text-sm text-muted-foreground">
            Upgrade to {recommendedTier === 'pro' ? 'Pro' : 'Premium'} to continue using this feature.
          </p>

          <div className="flex gap-2">
            <Button onClick={() => router.push('/subscription')} className="flex-1">
              View Plans
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
