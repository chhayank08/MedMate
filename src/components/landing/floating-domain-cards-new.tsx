'use client';

import { Brain, Cpu, Briefcase, Stethoscope } from 'lucide-react';
import { StaggerChildren, StaggerItem } from './cinematic-scroll';
import { FloatingCard } from './floating-ui';

const DOMAINS = [
  {
    name: 'Medical',
    icon: Stethoscope,
    gradient: 'from-emerald-500/20 to-teal-500/20',
    iconColor: 'text-emerald-400',
    glowColor: 'rgba(16, 185, 129, 0.3)',
  },
  {
    name: 'Engineering',
    icon: Cpu,
    gradient: 'from-orange-500/20 to-amber-500/20',
    iconColor: 'text-orange-400',
    glowColor: 'rgba(249, 115, 22, 0.3)',
  },
  {
    name: 'Computer Science',
    icon: Brain,
    gradient: 'from-blue-500/20 to-cyan-500/20',
    iconColor: 'text-blue-400',
    glowColor: 'rgba(59, 130, 246, 0.3)',
  },
  {
    name: 'Business',
    icon: Briefcase,
    gradient: 'from-purple-500/20 to-pink-500/20',
    iconColor: 'text-purple-400',
    glowColor: 'rgba(168, 85, 247, 0.3)',
  },
];

export function FloatingDomainCards() {
  return (
    <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.12}>
      {DOMAINS.map((domain) => {
        const Icon = domain.icon;
        return (
          <StaggerItem key={domain.name}>
            <FloatingCard
              glowColor={domain.glowColor}
              floatIntensity={15}
              tiltIntensity={10}
              className="cursor-pointer"
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
            </FloatingCard>
          </StaggerItem>
        );
      })}
    </StaggerChildren>
  );
}
