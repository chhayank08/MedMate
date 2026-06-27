"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSubscription } from "@/hooks/use-subscription";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Sparkles } from "lucide-react";
import { TIER_LIMITS, type SubscriptionTier } from "@/types/subscription.types";

export function SubscriptionTab() {
  const { subscription, usage, limits, isLoading } = useSubscription();

  if (isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;

  const tier = subscription?.tier || 'free';
  const tierData = TIER_LIMITS[tier as SubscriptionTier];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Current Plan: {tier.charAt(0).toUpperCase() + tier.slice(1)}
                {tier !== 'free' && <Badge variant="default"><Sparkles className="size-3" />Active</Badge>}
              </CardTitle>
              <CardDescription>
                {tier === 'free' && "Upgrade to unlock more features"}
                {tier === 'pro' && "Great for serious students"}
                {tier === 'premium' && "Full access to all features"}
              </CardDescription>
            </div>
            {tier === 'free' && (
              <Button>Upgrade</Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {usage && limits && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Domains</span>
                  <span className="text-muted-foreground">{usage.domains.current} / {usage.domains.limit}</span>
                </div>
                <Progress value={(usage.domains.current / usage.domains.limit) * 100} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subjects</span>
                  <span className="text-muted-foreground">{usage.subjects.current} / {usage.subjects.limit}</span>
                </div>
                <Progress value={(usage.subjects.current / usage.subjects.limit) * 100} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Quizzes (this period)</span>
                  <span className="text-muted-foreground">{usage.quizzes.current} / {usage.quizzes.limit}</span>
                </div>
                <Progress value={(usage.quizzes.current / usage.quizzes.limit) * 100} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Summaries (this period)</span>
                  <span className="text-muted-foreground">{usage.summaries.current} / {usage.summaries.limit}</span>
                </div>
                <Progress value={(usage.summaries.current / usage.summaries.limit) * 100} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {(['free', 'pro', 'premium'] as const).map((planTier) => {
          const plan = TIER_LIMITS[planTier];
          const isCurrent = tier === planTier;
          
          return (
            <Card key={planTier} className={isCurrent ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {planTier.charAt(0).toUpperCase() + planTier.slice(1)}
                  {isCurrent && <Badge variant="outline">Current</Badge>}
                </CardTitle>
                <CardDescription>
                  {planTier === 'free' && "$0/month"}
                  {planTier === 'pro' && "$9.99/month"}
                  {planTier === 'premium' && "$19.99/month"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-primary" />
                    <span>{plan.domains === 1 ? "1 domain" : `${plan.domains} domains`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-primary" />
                    <span>{plan.subjects} subjects</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-primary" />
                    <span>{plan.quizzes} quizzes/month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-primary" />
                    <span>{plan.summaries} summaries/month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-primary" />
                    <span>{plan.summaryTypes.length} summary types</span>
                  </div>
                </div>
                {!isCurrent && (
                  <Button className="w-full" variant={planTier === 'premium' ? 'default' : 'outline'}>
                    {tier === 'free' ? 'Upgrade' : planTier === 'premium' ? 'Upgrade' : 'Downgrade'}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
