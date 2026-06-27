"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSubscription } from "@/hooks/use-subscription";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Sparkles, Crown, Zap, TrendingUp, Brain, FileText, Layers, X, PartyPopper } from "lucide-react";
import { TIER_LIMITS, type SubscriptionTier } from "@/types/subscription.types";
import { cn } from "@/lib/utils";

const PLAN_FEATURES = {
  free: [
    { icon: Layers, text: "1 learning domain", included: true },
    { icon: Brain, text: "3 subjects", included: true },
    { icon: FileText, text: "5 AI quizzes per month", included: true },
    { icon: FileText, text: "5 AI summaries per month", included: true },
    { icon: Zap, text: "Basic summary types (2)", included: true },
    { icon: TrendingUp, text: "Basic analytics", included: true },
    { icon: Check, text: "Study planner", included: true },
    { icon: Check, text: "Task management", included: true },
    { icon: X, text: "Priority support", included: false },
    { icon: X, text: "Advanced AI features", included: false },
  ],
  pro: [
    { icon: Layers, text: "3 learning domains", included: true },
    { icon: Brain, text: "Unlimited subjects", included: true },
    { icon: FileText, text: "50 AI quizzes per month", included: true },
    { icon: FileText, text: "50 AI summaries per month", included: true },
    { icon: Zap, text: "Advanced summary types (5)", included: true },
    { icon: TrendingUp, text: "Advanced analytics", included: true },
    { icon: Check, text: "Spaced repetition", included: true },
    { icon: Check, text: "Flashcard generator", included: true },
    { icon: Check, text: "Priority email support", included: true },
    { icon: Check, text: "Export to PDF", included: true },
  ],
  lifetime: [
    { icon: Layers, text: "10 learning domains", included: true },
    { icon: Brain, text: "Unlimited subjects", included: true },
    { icon: FileText, text: "500 AI quizzes per month", included: true },
    { icon: FileText, text: "500 AI summaries per month", included: true },
    { icon: Zap, text: "All summary types (10+)", included: true },
    { icon: TrendingUp, text: "Premium analytics & insights", included: true },
    { icon: Crown, text: "Lifetime access - pay once", included: true },
    { icon: Check, text: "Advanced spaced repetition", included: true },
    { icon: Check, text: "Priority support (24/7)", included: true },
    { icon: Check, text: "Early access to new features", included: true },
    { icon: Check, text: "Custom AI model selection", included: true },
    { icon: Check, text: "Bulk operations & export", included: true },
  ],
};

interface PlanCardProps {
  tier: 'free' | 'pro' | 'lifetime';
  name: string;
  price: string;
  description: string;
  isCurrent: boolean;
  isPopular?: boolean;
  features: typeof PLAN_FEATURES.free;
  onUpgrade: () => void;
}

function PlanCard({ tier, name, price, description, isCurrent, isPopular, features, onUpgrade }: PlanCardProps) {
  return (
    <Card className={cn(
      "relative flex flex-col",
      isCurrent && "border-primary shadow-lg",
      isPopular && "border-primary shadow-xl scale-105"
    )}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-primary to-chart-1">
            <Sparkles className="size-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-2xl">
            {tier === 'lifetime' && <Crown className="size-6 text-yellow-500" />}
            {name}
          </CardTitle>
          {isCurrent && <Badge variant="outline">Current Plan</Badge>}
        </div>
        <CardDescription className="text-base">{description}</CardDescription>
        <div className="mt-4">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">{price.split('/')[0]}</span>
            {price.includes('/') && <span className="text-muted-foreground">/{price.split('/')[1]}</span>}
          </div>
          {tier === 'lifetime' && (
            <p className="text-xs text-muted-foreground mt-1">One-time payment, lifetime access</p>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pt-4 border-t">
        {features.map((feature, idx) => (
          <div key={idx} className="flex items-start gap-3">
            {feature.included ? (
              <feature.icon className="size-4 shrink-0 text-primary mt-0.5" />
            ) : (
              <X className="size-4 shrink-0 text-muted-foreground mt-0.5" />
            )}
            <span className={cn(
              "text-sm",
              !feature.included && "text-muted-foreground line-through"
            )}>
              {feature.text}
            </span>
          </div>
        ))}
      </CardContent>

      <CardFooter className="pt-4 border-t">
        {isCurrent ? (
          <Button className="w-full" variant="outline" disabled>
            Current Plan
          </Button>
        ) : (
          <Button 
            className={cn(
              "w-full",
              isPopular && "bg-gradient-to-r from-primary to-chart-1 hover:opacity-90"
            )}
            onClick={onUpgrade}
          >
            {tier === 'free' ? 'Downgrade' : tier === 'lifetime' ? 'Get Lifetime Access' : 'Upgrade to Pro'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export function SubscriptionPlans({ userId }: { userId?: string }) {
  const { subscription, usage, limits, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="grid gap-8 md:grid-cols-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-[600px] rounded-xl" />)}
      </div>
    );
  }

  const currentTier = subscription?.tier || 'free';
  const isLifetime = currentTier === 'premium';

  const handleUpgrade = (tier: string) => {
    console.log('Upgrade to:', tier);
    // TODO: Implement Stripe checkout
  };

  return (
    <div className="space-y-8">
      {/* Lifetime Subscriber Celebration Banner */}
      {isLifetime && (
        <Card className="border-2 border-yellow-500 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg">
                <Crown className="size-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                    Congratulations! You're a Lifetime Member
                  </h3>
                  <PartyPopper className="size-6 text-yellow-500" />
                </div>
                <p className="text-muted-foreground">
                  Thank you for your support! You have unlimited access to all premium features forever. 
                  Enjoy multi-domain learning, unlimited subjects, 500 quizzes/month, 500 summaries/month, and all future updates.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Usage Stats */}
      {usage && limits && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Current Usage
              {isLifetime && <Crown className="size-5 text-yellow-500" />}
            </CardTitle>
            <CardDescription>
              {isLifetime ? 'Your lifetime membership usage' : 'Your usage for the current billing period'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Domains</span>
                  <span className="text-muted-foreground">{usage.domains.current} / {usage.domains.limit}</span>
                </div>
                <Progress value={(usage.domains.current / usage.domains.limit) * 100} className={isLifetime ? '[&>div]:bg-gradient-to-r [&>div]:from-yellow-400 [&>div]:to-amber-500' : ''} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Subjects</span>
                  <span className="text-muted-foreground">{usage.subjects.current} / {usage.subjects.limit === 10000 ? '∞' : usage.subjects.limit}</span>
                </div>
                <Progress value={usage.subjects.limit === 10000 ? 0 : (usage.subjects.current / usage.subjects.limit) * 100} className={isLifetime ? '[&>div]:bg-gradient-to-r [&>div]:from-yellow-400 [&>div]:to-amber-500' : ''} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Quizzes</span>
                  <span className="text-muted-foreground">{usage.quizzes.current} / {usage.quizzes.limit}</span>
                </div>
                <Progress value={(usage.quizzes.current / usage.quizzes.limit) * 100} className={isLifetime ? '[&>div]:bg-gradient-to-r [&>div]:from-yellow-400 [&>div]:to-amber-500' : ''} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Summaries</span>
                  <span className="text-muted-foreground">{usage.summaries.current} / {usage.summaries.limit}</span>
                </div>
                <Progress value={(usage.summaries.current / usage.summaries.limit) * 100} className={isLifetime ? '[&>div]:bg-gradient-to-r [&>div]:from-yellow-400 [&>div]:to-amber-500' : ''} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Plans */}
      <div className="grid gap-8 lg:grid-cols-3">
        <PlanCard
          tier="free"
          name="Free"
          price="$0/month"
          description="Perfect for exploring PrepBud"
          isCurrent={currentTier === 'free'}
          features={PLAN_FEATURES.free}
          onUpgrade={() => handleUpgrade('free')}
        />

        <PlanCard
          tier="pro"
          name="Pro"
          price="$9.99/month"
          description="For dedicated learners"
          isCurrent={currentTier === 'pro'}
          isPopular={!isLifetime}
          features={PLAN_FEATURES.pro}
          onUpgrade={() => handleUpgrade('pro')}
        />

        <PlanCard
          tier="lifetime"
          name="Lifetime"
          price="$199"
          description="Unlimited learning forever"
          isCurrent={isLifetime}
          features={PLAN_FEATURES.lifetime}
          onUpgrade={() => handleUpgrade('lifetime')}
        />
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">Can I cancel anytime?</h4>
            <p className="text-sm text-muted-foreground">
              Yes! You can cancel your Pro subscription at any time. Your access will continue until the end of your billing period.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">What happens to my data if I downgrade?</h4>
            <p className="text-sm text-muted-foreground">
              All your data is preserved. You'll just have access to fewer features and lower limits according to your new plan.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Is the Lifetime plan really lifetime?</h4>
            <p className="text-sm text-muted-foreground">
              Yes! Pay once and get access to PrepBud forever. You'll receive all future updates and new features at no extra cost.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Do monthly limits reset?</h4>
            <p className="text-sm text-muted-foreground">
              Yes, quiz and summary generation limits reset at the start of each billing period. Domain and subject limits are permanent.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
