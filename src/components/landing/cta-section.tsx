'use client';

import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';

export function CTASection() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/10 to-background" />
      
      {/* Animated background elements */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl"
      />

      <div className="relative z-10 container mx-auto px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-3xl blur-2xl" />
          
          <div className="relative bg-card/60 backdrop-blur-xl border border-white/20 rounded-3xl p-12 md:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
            
            {/* Floating icons */}
            <motion.div
              animate={{ 
                y: [-10, 10, -10],
                rotate: [0, 5, 0],
              }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute top-8 right-8 p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20"
            >
              <Sparkles className="w-6 h-6 text-primary" />
            </motion.div>

            <motion.div
              animate={{ 
                y: [10, -10, 10],
                rotate: [0, -5, 0],
              }}
              transition={{ duration: 6, repeat: Infinity }}
              className="absolute bottom-8 left-8 p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20"
            >
              <Zap className="w-6 h-6 text-purple-400" />
            </motion.div>

            <div className="relative z-10 space-y-8">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Start your journey today</span>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-5xl md:text-7xl font-bold"
              >
                Ready to{' '}
                <span className="bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
                  transform
                </span>
                <br />
                your learning?
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="text-xl text-muted-foreground max-w-2xl mx-auto"
              >
                Join thousands of students who are already learning smarter with AI-powered tools
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                viewport={{ once: true }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    size="lg"
                    render={<Link href="/signup" />}
                    className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 text-lg px-8 py-6 rounded-2xl shadow-lg shadow-primary/25"
                  >
                    Get started free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    size="lg"
                    variant="outline"
                    render={<Link href="/login" />}
                    className="text-lg px-8 py-6 rounded-2xl border-2"
                  >
                    Sign in
                  </Button>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                viewport={{ once: true }}
                className="pt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Free forever plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>No credit card required</span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
