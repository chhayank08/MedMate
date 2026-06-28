'use client';

import { motion } from 'motion/react';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const PLANS = [
  {
    name: 'Free',
    icon: Sparkles,
    price: 0,
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      '1 learning domain',
      '3 subjects',
      '5 AI quizzes per month',
      '5 AI summaries per month',
      'Basic analytics',
      'Study planner',
    ],
    gradient: 'from-gray-500 to-gray-600',
    popular: false,
  },
  {
    name: 'Pro',
    icon: Zap,
    price: 9.99,
    period: 'month',
    description: 'For dedicated learners',
    features: [
      '3 learning domains',
      'Unlimited subjects',
      '50 AI quizzes per month',
      '50 AI summaries per month',
      'Advanced analytics',
      'Spaced repetition',
      'Priority support',
    ],
    gradient: 'from-emerald-500 to-teal-500',
    popular: true,
  },
  {
    name: 'Lifetime',
    icon: Crown,
    price: 199,
    period: 'one-time',
    description: 'Unlimited learning forever',
    features: [
      '10 learning domains',
      'Unlimited subjects',
      '500 AI quizzes per month',
      '500 AI summaries per month',
      'All summary types',
      'Premium analytics',
      'Lifetime access',
      'Early feature access',
      '24/7 priority support',
    ],
    gradient: 'from-yellow-500 to-amber-500',
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      
      <div className="relative z-10 container mx-auto px-4 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-5xl md:text-6xl font-bold">
            Simple, transparent{' '}
            <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              pricing
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan for your learning journey
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PLANS.map((plan, i) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.6, 
                  delay: i * 0.1,
                  ease: [0.21, 1.11, 0.81, 0.99]
                }}
                viewport={{ once: true }}
                className={`relative group ${plan.popular ? 'md:-mt-8 md:scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold px-4 py-1 rounded-full shadow-lg">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className={`
                  absolute inset-0 bg-gradient-to-br ${plan.gradient}
                  rounded-3xl blur-2xl opacity-20 group-hover:opacity-40
                  transition-opacity duration-500
                `} />

                <div className={`
                  relative bg-card/60 backdrop-blur-xl border-2 
                  ${plan.popular ? 'border-primary' : 'border-white/10'}
                  rounded-3xl p-8 h-full overflow-hidden
                  transition-all duration-300
                  group-hover:border-primary/50
                `}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                  
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className={`
                        p-3 rounded-2xl bg-gradient-to-br ${plan.gradient}
                        ring-1 ring-white/20
                      `}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold">{plan.name}</h3>
                    </div>

                    <p className="text-muted-foreground text-sm">
                      {plan.description}
                    </p>

                    <div className="py-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold">
                          ${plan.price}
                        </span>
                        <span className="text-muted-foreground">
                          /{plan.period}
                        </span>
                      </div>
                    </div>

                    <Button 
                      asChild
                      className={`w-full py-6 text-lg font-semibold rounded-2xl
                        ${plan.popular 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600' 
                          : 'bg-white/10 hover:bg-white/20'
                        }
                      `}
                    >
                      <Link href="/signup">
                        {plan.price === 0 ? 'Get Started' : 'Start Free Trial'}
                      </Link>
                    </Button>

                    <div className="space-y-3 pt-6 border-t border-white/10">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <Check className="w-5 h-5 text-primary" />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
