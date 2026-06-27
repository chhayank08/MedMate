'use client';

import { motion } from 'motion/react';

export function MorphingBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Main gradient orbs */}
      <motion.div
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -100, 50, 0],
          scale: [1, 1.2, 0.8, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-primary/30 via-blue-500/20 to-transparent rounded-full blur-3xl"
      />

      <motion.div
        animate={{
          x: [0, -100, 50, 0],
          y: [0, 100, -50, 0],
          scale: [1, 0.8, 1.2, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/2 -right-1/4 w-[700px] h-[700px] bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-transparent rounded-full blur-3xl"
      />

      <motion.div
        animate={{
          x: [0, 50, -100, 0],
          y: [0, -50, 100, 0],
          scale: [1, 1.3, 0.9, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -bottom-1/4 left-1/3 w-[500px] h-[500px] bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-transparent rounded-full blur-3xl"
      />

      {/* Secondary accents */}
      <motion.div
        animate={{
          opacity: [0.1, 0.3, 0.1],
          scale: [1, 1.5, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-gradient-to-br from-orange-500/10 to-transparent rounded-full blur-3xl"
      />

      <motion.div
        animate={{
          opacity: [0.1, 0.3, 0.1],
          scale: [1, 1.5, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 5,
        }}
        className="absolute bottom-1/3 right-1/3 w-[350px] h-[350px] bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl"
      />

      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--primary) 1px, transparent 1px),
            linear-gradient(to bottom, var(--primary) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Radial gradient vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_100%)]" />
    </div>
  );
}

export function GlowingGradient() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-purple-500/5" />
      <motion.div
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, var(--primary) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, var(--primary) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, var(--primary) 0%, transparent 50%)
          `,
          backgroundSize: '200% 200%',
        }}
      />
    </div>
  );
}

export function AnimatedGrid() {
  return (
    <motion.div
      animate={{
        backgroundPosition: ['0px 0px', '80px 80px'],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: 'linear',
      }}
      className="absolute inset-0 -z-10"
      style={{
        backgroundImage: `
          linear-gradient(to right, var(--primary) 1px, transparent 1px),
          linear-gradient(to bottom, var(--primary) 1px, transparent 1px)
        `,
        backgroundSize: '80px 80px',
        opacity: 0.03,
      }}
    />
  );
}
