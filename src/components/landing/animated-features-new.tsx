'use client';

import { 
  Brain, 
  CalendarRange, 
  LineChart, 
  Sparkles, 
  Zap,
  Target
} from 'lucide-react';
import { StaggerChildren, StaggerItem } from './cinematic-scroll';
import { FloatingCard } from './floating-ui';

const FEATURES = [
  {
    icon: Brain,
    title: 'AI Quiz Generator',
    description: 'Transform any notes into intelligent quizzes with advanced NLP',
    gradient: 'from-purple-500 to-pink-500',
    glowColor: 'rgba(168, 85, 247, 0.3)',
  },
  {
    icon: Sparkles,
    title: 'Smart Summaries',
    description: 'Instant AI-generated summaries from your study materials',
    gradient: 'from-blue-500 to-cyan-500',
    glowColor: 'rgba(59, 130, 246, 0.3)',
  },
  {
    icon: CalendarRange,
    title: 'Exam Planner',
    description: 'AI-optimized study schedules with spaced repetition',
    gradient: 'from-emerald-500 to-teal-500',
    glowColor: 'rgba(16, 185, 129, 0.3)',
  },
  {
    icon: Target,
    title: 'Adaptive Learning',
    description: 'Personalized learning paths based on your performance',
    gradient: 'from-orange-500 to-amber-500',
    glowColor: 'rgba(249, 115, 22, 0.3)',
  },
  {
    icon: LineChart,
    title: 'Performance Analytics',
    description: 'Deep insights into your learning patterns and progress',
    gradient: 'from-pink-500 to-rose-500',
    glowColor: 'rgba(236, 72, 153, 0.3)',
  },
  {
    icon: Zap,
    title: 'Instant Feedback',
    description: 'Real-time AI feedback on your answers and understanding',
    gradient: 'from-indigo-500 to-purple-500',
    glowColor: 'rgba(99, 102, 241, 0.3)',
  },
];

export function AnimatedFeatures() {
  return (
    <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.15}>
      {FEATURES.map((feature) => {
        const Icon = feature.icon;
        return (
          <StaggerItem key={feature.title}>
            <FloatingCard
              glowColor={feature.glowColor}
              floatIntensity={12}
              tiltIntensity={8}
              className="h-full"
            >
              <div className={`
                absolute inset-0 bg-gradient-to-br ${feature.gradient} 
                rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 
                transition-opacity duration-500
              `} />
              <div className={`
                relative bg-card/50 backdrop-blur-xl border border-white/10
                rounded-3xl p-8 h-full overflow-hidden
                transition-all duration-300
              `}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 space-y-4">
                  <div className={`
                    inline-flex p-3 rounded-2xl bg-gradient-to-br ${feature.gradient}
                    ring-1 ring-white/20
                    group-hover:scale-110 transition-transform duration-300
                  `}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-tl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </FloatingCard>
          </StaggerItem>
        );
      })}
    </StaggerChildren>
  );
}
