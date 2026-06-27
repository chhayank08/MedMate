'use client';

import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { useEffect, useRef } from 'react';
import { Users, BookOpen, Award, Zap } from 'lucide-react';

const STATS = [
  { icon: Users, value: 10000, suffix: '+', label: 'Active Learners', color: 'text-blue-400' },
  { icon: BookOpen, value: 500000, suffix: '+', label: 'Quizzes Generated', color: 'text-emerald-400' },
  { icon: Award, value: 95, suffix: '%', label: 'Success Rate', color: 'text-purple-400' },
  { icon: Zap, value: 1000000, suffix: '+', label: 'AI Responses', color: 'text-orange-400' },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    if (latest >= 1000000) {
      return (latest / 1000000).toFixed(1) + 'M';
    }
    if (latest >= 1000) {
      return (latest / 1000).toFixed(0) + 'K';
    }
    return Math.round(latest).toString();
  });
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(count, value, { duration: 2 });
    return controls.stop;
  }, [count, value]);

  return (
    <motion.span ref={nodeRef} className="tabular-nums">
      <motion.span>{rounded}</motion.span>
      {suffix}
    </motion.span>
  );
}

export function AnimatedStats() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
      {STATS.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            viewport={{ once: true }}
            className="relative group"
          >
            <div className="relative bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10 space-y-3">
                <div className="inline-flex p-3 rounded-xl bg-white/5 ring-1 ring-white/10">
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className={`text-4xl font-bold ${stat.color}`}>
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
