"use client";

import { motion } from "motion/react";
import type { HTMLMotionProps } from "motion/react";

type FadeInProps = HTMLMotionProps<"div"> & {
  delay?: number;
  duration?: number;
  y?: number;
};

export function FadeIn({ children, delay = 0, duration = 0.3, y = 8, className, ...props }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function FadeInList({ children, stagger = 0.06 }: { children: React.ReactNode[]; stagger?: number }) {
  return (
    <>
      {children.map((child, i) => (
        <FadeIn key={i} delay={i * stagger}>
          {child}
        </FadeIn>
      ))}
    </>
  );
}
