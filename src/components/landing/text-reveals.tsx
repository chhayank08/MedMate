'use client';

import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface WordRevealProps {
  text: string;
  className?: string;
  delay?: number;
}

export function WordReveal({ text, className = '', delay = 0 }: WordRevealProps) {
  const words = text.split(' ');

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.5 }}
      className={className}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
            visible: {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              transition: {
                duration: 0.5,
                delay: delay + i * 0.1,
                ease: [0.25, 0.1, 0.25, 1],
              },
            },
          }}
          className="inline-block mr-2"
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
}

interface CharRevealProps {
  text: string;
  className?: string;
  delay?: number;
}

export function CharReveal({ text, className = '', delay = 0 }: CharRevealProps) {
  const chars = text.split('');

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.5 }}
      className={className}
    >
      {chars.map((char, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 50 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.3,
                delay: delay + i * 0.02,
                ease: [0.25, 0.1, 0.25, 1],
              },
            },
          }}
          className="inline-block"
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.div>
  );
}

interface GradientTextRevealProps {
  text: string;
  className?: string;
  gradient?: string;
}

export function GradientTextReveal({
  text,
  className = '',
  gradient = 'from-primary via-blue-500 to-purple-500',
}: GradientTextRevealProps) {
  return (
    <motion.span
      initial={{ backgroundPosition: '0% 50%' }}
      whileInView={{ backgroundPosition: '100% 50%' }}
      transition={{ duration: 2, ease: 'easeInOut' }}
      viewport={{ once: false, amount: 0.5 }}
      className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent bg-[length:200%_100%] ${className}`}
    >
      {text}
    </motion.span>
  );
}

interface TypewriterProps {
  text: string;
  className?: string;
  delay?: number;
  speed?: number;
}

export function Typewriter({ text, className = '', delay = 0, speed = 0.05 }: TypewriterProps) {
  const chars = text.split('');

  return (
    <motion.span className={className}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{
            duration: 0.1,
            delay: delay + i * speed,
          }}
          viewport={{ once: true }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
}

interface FadeUpProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function FadeUp({ children, className = '', delay = 0 }: FadeUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      viewport={{ once: false, amount: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
