'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useEffect, useRef, ReactNode } from 'react';

interface FloatingCardProps {
  children: ReactNode;
  className?: string;
  floatIntensity?: number;
  tiltIntensity?: number;
  glowColor?: string;
}

export function FloatingCard({
  children,
  className = '',
  floatIntensity = 15,
  tiltIntensity = 10,
  glowColor = 'rgba(114, 207, 179, 0.3)',
}: FloatingCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [tiltIntensity, -tiltIntensity]), {
    stiffness: 150,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-tiltIntensity, tiltIntensity]), {
    stiffness: 150,
    damping: 20,
  });

  const handleMouseMove = (e: MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = (e.clientX - centerX) / rect.width;
    const y = (e.clientY - centerY) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <motion.div
      ref={ref}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      animate={{
        y: [0, -floatIntensity, 0],
      }}
      transition={{
        y: {
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      }}
      whileHover={{
        scale: 1.05,
        boxShadow: `0 20px 60px ${glowColor}`,
      }}
      className={`transition-shadow duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );
}

interface FloatingElementProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  amplitude?: number;
  duration?: number;
}

export function FloatingElement({
  children,
  className = '',
  delay = 0,
  amplitude = 20,
  duration = 3,
}: FloatingElementProps) {
  return (
    <motion.div
      animate={{
        y: [0, -amplitude, 0],
        x: [0, amplitude / 2, 0, -amplitude / 2, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function GlowingOrb({
  className = '',
  color = '#72cfb3',
  size = 300,
  opacity = 0.3,
}: {
  className?: string;
  color?: string;
  size?: number;
  opacity?: number;
}) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        opacity,
      }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [opacity, opacity * 0.6, opacity],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

interface PulsingGlowProps {
  children: ReactNode;
  glowColor?: string;
  intensity?: number;
  className?: string;
}

export function PulsingGlow({
  children,
  glowColor = 'rgba(114, 207, 179, 0.5)',
  intensity = 30,
  className = '',
}: PulsingGlowProps) {
  return (
    <motion.div
      animate={{
        boxShadow: [
          `0 0 ${intensity / 2}px ${glowColor}`,
          `0 0 ${intensity}px ${glowColor}`,
          `0 0 ${intensity / 2}px ${glowColor}`,
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
