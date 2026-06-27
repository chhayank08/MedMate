'use client';

import { motion } from 'motion/react';
import { Sparkles, Zap, TrendingUp, Brain } from 'lucide-react';

const FLOATING_ELEMENTS = [
  { icon: Sparkles, x: '10%', y: '20%', delay: 0, duration: 6 },
  { icon: Zap, x: '80%', y: '30%', delay: 1, duration: 7 },
  { icon: TrendingUp, x: '15%', y: '70%', delay: 2, duration: 8 },
  { icon: Brain, x: '85%', y: '75%', delay: 1.5, duration: 6.5 },
];

export function HolographicElements() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {FLOATING_ELEMENTS.map((element, i) => {
        const Icon = element.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 0.3, 0],
              scale: [0.8, 1.2, 0.8],
              y: [0, -30, 0],
            }}
            transition={{
              duration: element.duration,
              repeat: Infinity,
              delay: element.delay,
              ease: 'easeInOut',
            }}
            style={{ 
              position: 'absolute',
              left: element.x,
              top: element.y,
            }}
            className="w-16 h-16"
          >
            <div className="relative w-full h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-500 rounded-full blur-xl opacity-40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon className="w-8 h-8 text-primary" />
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Animated gradient orbs */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, -100, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          x: [0, -100, 0],
          y: [0, 100, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-3xl"
      />
    </div>
  );
}

export function ParticleField() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: 0,
          }}
          animate={{
            y: [null, Math.random() * window.innerHeight],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'linear',
          }}
          className="absolute w-1 h-1 bg-primary rounded-full"
        />
      ))}
    </div>
  );
}
