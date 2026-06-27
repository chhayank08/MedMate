'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[280px] bg-card/95 backdrop-blur-xl border-l border-white/10 z-50 p-6"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-lg">MedMate</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Link
                    href="#features"
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    Features
                  </Link>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Link
                    href="#pricing"
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    Pricing
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="pt-4 border-t border-white/10 space-y-3"
                >
                  <Button
                    variant="ghost"
                    render={<Link href="/login" />}
                    onClick={() => setIsOpen(false)}
                    className="w-full justify-start"
                  >
                    Sign in
                  </Button>
                  <Button
                    render={<Link href="/signup" />}
                    onClick={() => setIsOpen(false)}
                    className="w-full bg-gradient-to-r from-primary to-blue-500"
                  >
                    Get started
                  </Button>
                </motion.div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
