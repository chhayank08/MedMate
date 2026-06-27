'use client';

import { motion } from 'motion/react';
import { 
  Brain, 
  CalendarRange, 
  Bell, 
  LineChart, 
  Sparkles, 
  ListChecks,
  Zap,
  Target
} from 'lucide-react';

const FEATURES = [
  {
    icon: Brain,
    title: 'AI Quiz Generator',
    description: 'Transform any notes into intelligent quizzes with advanced NLP',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Sparkles,
    title: 'Smart Summaries',
    description: 'Instant AI-generated summaries from your study materials',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: CalendarRange,
    title: 'Exam Planner',
    description: 'AI-optimized study schedules with spaced repetition',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Target,
    title: 'Adaptive Learning',
    description: 'Personalized learning paths based on your performance',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    icon: LineChart,
    title: 'Performance Analytics',
    description: 'Deep insights into your learning patterns and progress',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    icon: Zap,
    title: 'Instant Feedback',
    description: 'Real-time AI feedback on your answers and understanding',
    gradient: 'from-indigo-500 to-purple-500',
  },
];

export function AnimatedFeatures() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {FEATURES.map((feature, i) => {
        const Icon = feature.icon;
        return (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ 
              duration: 0.5, 
              delay: i * 0.1,
              ease: [0.21, 1.11, 0.81, 0.99]
            }}
            viewport={{ once: true, margin: '-100px' }}
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.2 }
            }}
            className="group relative"
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
          </motion.div>
        );
      })}
    </div>
  );
}
