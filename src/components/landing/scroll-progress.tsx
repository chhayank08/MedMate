'use client';

import { motion, useScroll, useSpring } from 'motion/react';

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-blue-500 to-purple-500 transform-origin-left z-50"
      style={{ scaleX }}
    />
  );
}

export function ScrollIndicator() {
  const { scrollYProgress } = useScroll();
  const opacity = useSpring(
    useScroll().scrollYProgress,
    { stiffness: 100, damping: 30 }
  );

  return (
    <motion.div
      style={{ opacity }}
      className="fixed bottom-8 right-8 z-40 pointer-events-none"
    >
      <motion.div
        className="relative w-16 h-16"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-primary/20"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-primary"
            strokeDasharray="283"
            style={{
              strokeDashoffset: useSpring(
                scrollYProgress.get() ? 283 - scrollYProgress.get() * 283 : 283,
                { stiffness: 100, damping: 30 }
              ),
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
            }}
          />
        </svg>
      </motion.div>
    </motion.div>
  );
}
