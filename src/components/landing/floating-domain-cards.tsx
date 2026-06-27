'use client';

import { motion } from 'motion/react';
import { Brain, Cpu, Briefcase, Stethoscope } from 'lucide-react';

const DOMAINS = [
  {
    name: 'Medical',
    icon: Stethoscope,
    gradient: 'from-emerald-500/20 to-teal-500/20',
    iconColor: 'text-emerald-400',
    delay: 0,
  },
  {
    name: 'Engineering',
    icon: Cpu,
    gradient: 'from-orange-500/20 to-amber-500/20',
    iconColor: 'text-orange-400',
    delay: 0.1,
  },
  {
    name: 'Computer Science',
    icon: Brain,
    gradient: 'from-blue-500/20 to-cyan-500/20',
    iconColor: 'text-blue-400',
    delay: 0.2,
  },
  {
    name: 'Business',
    icon: Briefcase,
    gradient: 'from-purple-500/20 to-pink-500/20',
    iconColor: 'text-purple-400',
    delay: 0.3,
  },
];

export function FloatingDomainCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {DOMAINS.map((domain, i) => {
        const Icon = domain.icon;
        return (
          <motion.div
            key={domain.name}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: domain.delay }}
            viewport={{ once: true }}
            whileHover={{ 
              y: -10,
              scale: 1.05,
              transition: { duration: 0.2 }
            }}
            className={`relative group cursor-pointer`}
          >
            <div className={`
              absolute inset-0 bg-gradient-to-br ${domain.gradient} 
              rounded-2xl blur-xl opacity-50 group-hover:opacity-80 
              transition-opacity duration-500
            `} />
            <div className={`
              relative bg-card/40 backdrop-blur-xl border border-white/10
              rounded-2xl p-8 overflow-hidden
            `}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <div className={`
                  p-4 rounded-xl bg-gradient-to-br ${domain.gradient}
                  ring-1 ring-white/20
                `}>
                  <Icon className={`w-8 h-8 ${domain.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold">{domain.name}</h3>
                <p className="text-sm text-muted-foreground">
                  AI-powered learning for {domain.name.toLowerCase()}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
