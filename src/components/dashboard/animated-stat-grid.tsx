"use client";

import { motion } from "motion/react";

export function AnimatedStatGrid({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.07 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedStatCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
      }}
    >
      {children}
    </motion.div>
  );
}
