'use client';

import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

export function FuturisticLoader() {
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
    >
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 w-32 h-32"
        >
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary opacity-40" />
        </motion.div>

        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-2 w-28 h-28"
        >
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 border-l-blue-500 opacity-60" />
        </motion.div>

        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-4 w-24 h-24"
        >
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-b-purple-500 border-r-purple-500 opacity-80" />
        </motion.div>

        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 w-32 h-32 flex items-center justify-center"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500 blur-xl" />
        </motion.div>

        <div className="absolute inset-0 w-32 h-32 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-500"
          />
        </div>

        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              x: [0, Math.cos(i * Math.PI / 4) * 60, 0],
              y: [0, Math.sin(i * Math.PI / 4) * 60, 0],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.25 }}
            className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-primary"
            style={{ marginLeft: -4, marginTop: -4 }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-1/3 text-center space-y-2"
      >
        <motion.h2
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent"
        >
          Initializing AI
        </motion.h2>
        <div className="flex gap-1 justify-center">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              className="w-2 h-2 rounded-full bg-primary"
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
