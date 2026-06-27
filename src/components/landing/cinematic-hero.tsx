'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/lib/constants';
import { ScrollReactive3D } from './scroll-reactive-3d';
import { Parallax } from './cinematic-scroll';
import { FloatingElement, GlowingOrb } from './floating-ui';
import { useRef } from 'react';

export function CinematicHero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const opacity = useSpring(useTransform(scrollYProgress, [0, 0.5], [1, 0]), {
    stiffness: 100,
    damping: 30,
  });

  const scale = useSpring(useTransform(scrollYProgress, [0, 0.5], [1, 0.8]), {
    stiffness: 100,
    damping: 30,
  });

  const y = useSpring(useTransform(scrollYProgress, [0, 0.5], [0, -100]), {
    stiffness: 100,
    damping: 30,
  });

  return (
    <section ref={ref} className="relative overflow-hidden min-h-screen flex items-center">
      <ScrollReactive3D />
      
      {/* Glowing orbs for depth */}
      <GlowingOrb className="top-1/4 left-1/4" color="#72cfb3" size={400} opacity={0.2} />
      <GlowingOrb className="bottom-1/4 right-1/4" color="#a78bfa" size={350} opacity={0.15} />
      
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,var(--accent),transparent)]"
      />
      
      <motion.div
        style={{ opacity, scale, y }}
        className="mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28 relative z-10"
      >
        <Parallax speed={0.3}>
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full border bg-card/50 backdrop-blur-xl px-4 py-2 text-sm text-muted-foreground shadow-lg"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="size-4 text-primary" />
            </motion.div>
            Your personal AI study companion
          </motion.span>
        </Parallax>

        <Parallax speed={0.5}>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="mt-8 text-balance text-5xl font-bold tracking-tight sm:text-7xl"
          >
            Master any subject with{' '}
            <span className="bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
              AI-powered
            </span>{' '}
            learning.
          </motion.h1>
        </Parallax>

        <Parallax speed={0.7}>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mx-auto mt-6 max-w-2xl text-pretty text-xl text-muted-foreground"
          >
            {APP_NAME} transforms your study workflow with intelligent quizzes,
            smart summaries, and personalized plans — whether you&apos;re studying
            medicine, engineering, law, or any other domain.
          </motion.p>
        </Parallax>

        <Parallax speed={0.9}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <FloatingElement amplitude={10} duration={4}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  render={<Link href="/signup" />}
                  className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 text-lg px-8 py-6 rounded-2xl shadow-xl shadow-primary/25"
                >
                  Start learning free <ArrowRight className="size-5 ml-2" />
                </Button>
              </motion.div>
            </FloatingElement>

            <FloatingElement amplitude={10} duration={4} delay={0.2}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant="outline"
                  render={<Link href="/login" />}
                  className="text-lg px-8 py-6 rounded-2xl border-2"
                >
                  I already have an account
                </Button>
              </motion.div>
            </FloatingElement>
          </motion.div>
        </Parallax>
      </motion.div>
    </section>
  );
}
