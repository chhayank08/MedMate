'use client';

import { motion } from 'motion/react';
import { Brain, TrendingUp, Calendar, Target, Activity } from 'lucide-react';

const DASHBOARD_CARDS = [
  { 
    title: 'AI Quiz Score', 
    value: '92%', 
    change: '+5%',
    icon: Brain,
    color: 'from-purple-500 to-pink-500'
  },
  { 
    title: 'Study Streak', 
    value: '12 days', 
    change: '+2',
    icon: TrendingUp,
    color: 'from-blue-500 to-cyan-500'
  },
  { 
    title: 'Tasks Completed', 
    value: '24/30', 
    change: '80%',
    icon: Target,
    color: 'from-emerald-500 to-teal-500'
  },
];

const ACTIVITY_ITEMS = [
  { label: 'Medical Quiz', time: '2h ago', color: 'bg-emerald-500' },
  { label: 'Study Session', time: '5h ago', color: 'bg-blue-500' },
  { label: 'Exam Planner', time: '1d ago', color: 'bg-purple-500' },
];

export function DashboardPreview() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_70%)] opacity-10" />
      
      <div className="relative z-10 container mx-auto px-4 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-5xl md:text-6xl font-bold">
            Your{' '}
            <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              learning dashboard
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Track your progress with beautiful analytics and AI-powered insights
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.21, 1.11, 0.81, 0.99] }}
          viewport={{ once: true }}
          className="relative max-w-6xl mx-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-3xl blur-3xl" />
          
          <div className="relative bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
            
            <div className="relative z-10 space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {DASHBOARD_CARDS.map((card, i) => {
                  const Icon = card.icon;
                  return (
                    <motion.div
                      key={card.title}
                      initial={{ opacity: 0, x: -50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                      viewport={{ once: true }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="relative group"
                    >
                      <div className={`
                        absolute inset-0 bg-gradient-to-br ${card.color}
                        rounded-2xl blur-xl opacity-30 group-hover:opacity-50
                        transition-opacity duration-300
                      `} />
                      
                      <div className="relative bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className={`
                            p-2 rounded-xl bg-gradient-to-br ${card.color}
                            ring-1 ring-white/20
                          `}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-xs text-emerald-400 font-semibold">
                            {card.change}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{card.title}</p>
                          <p className="text-3xl font-bold mt-1">{card.value}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Activity Feed */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Activity className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Recent Activity</h3>
                </div>
                <div className="space-y-4">
                  {ACTIVITY_ITEMS.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <div className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="flex-1">{item.label}</span>
                      <span className="text-sm text-muted-foreground">{item.time}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Progress Chart Placeholder */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                viewport={{ once: true }}
                className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6 h-64 flex items-center justify-center"
              >
                <div className="text-center space-y-3">
                  <div className="flex gap-2 justify-center">
                    {[40, 70, 55, 85, 60, 90, 75].map((height, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${height}%` }}
                        transition={{ duration: 0.8, delay: 0.6 + i * 0.1 }}
                        viewport={{ once: true }}
                        className="w-12 bg-gradient-to-t from-primary to-blue-500 rounded-t-lg"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">Weekly Progress</p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
