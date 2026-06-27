'use client';

import { motion } from 'motion/react';
import { Brain, Sparkles, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const QUIZ_DEMO = {
  question: 'What is the primary function of mitochondria in cells?',
  options: [
    { text: 'Protein synthesis', correct: false },
    { text: 'Energy production (ATP)', correct: true },
    { text: 'DNA replication', correct: false },
    { text: 'Cell division', correct: false },
  ],
};

const QUIZ_FEATURES = [
  { icon: Brain, label: 'AI-Generated', color: 'text-purple-400' },
  { icon: Sparkles, label: 'Adaptive', color: 'text-blue-400' },
  { icon: Clock, label: 'Instant', color: 'text-emerald-400' },
];

export function QuizShowcase() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-blue-500/5 to-background" />
      
      <div className="relative z-10 container mx-auto px-4 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-5xl md:text-6xl font-bold">
            AI-powered{' '}
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              quiz generator
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform any content into intelligent quizzes in seconds
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Quiz Demo */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl blur-3xl" />
            
            <div className="relative bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
              
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold">Question 1 of 10</span>
                  </div>
                  <span className="text-sm text-muted-foreground">Medical</span>
                </div>

                <div className="p-4 bg-black/20 rounded-xl">
                  <p className="text-lg">{QUIZ_DEMO.question}</p>
                </div>

                <div className="space-y-3">
                  {QUIZ_DEMO.options.map((option, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                      viewport={{ once: true }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className={`
                        w-full p-4 rounded-xl text-left
                        bg-black/20 border border-white/10
                        hover:border-primary/50 hover:bg-white/5
                        transition-all duration-200
                        flex items-center justify-between group
                      `}
                    >
                      <span>{option.text}</span>
                      {option.correct && (
                        <CheckCircle className="w-5 h-5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </motion.button>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  viewport={{ once: true }}
                  className="pt-4 border-t border-white/10"
                >
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    Submit Answer
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h3 className="text-3xl font-bold">Smart quiz generation</h3>
              <p className="text-lg text-muted-foreground">
                Our AI analyzes your study materials and creates personalized quizzes that adapt to your learning style and knowledge level.
              </p>
            </div>

            <div className="grid gap-4">
              {QUIZ_FEATURES.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-card/40 backdrop-blur-xl border border-white/10"
                  >
                    <div className="p-3 rounded-xl bg-white/5">
                      <Icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <span className="text-lg font-semibold">{feature.label}</span>
                  </motion.div>
                );
              })}
            </div>

            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Multiple choice, true/false, and open-ended questions</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Instant AI feedback with detailed explanations</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Progress tracking and performance analytics</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
