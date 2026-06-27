'use client';

import { motion } from 'motion/react';
import { Star, Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    role: 'Medical Student',
    avatar: '🩺',
    rating: 5,
    text: 'The AI quiz generator is a game-changer. I passed my anatomy exam with flying colors thanks to the personalized practice questions.',
    gradient: 'from-emerald-500/20 to-teal-500/20',
  },
  {
    name: 'James Wilson',
    role: 'Engineering Major',
    avatar: '⚙️',
    rating: 5,
    text: 'Study planning has never been easier. The spaced repetition algorithm helped me retain complex engineering concepts effortlessly.',
    gradient: 'from-orange-500/20 to-amber-500/20',
  },
  {
    name: 'Priya Sharma',
    role: 'CS Graduate',
    avatar: '💻',
    rating: 5,
    text: 'The AI summaries saved me hours during exam prep. I can now focus on understanding rather than just reading through materials.',
    gradient: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    name: 'Michael Brown',
    role: 'Business Student',
    avatar: '💼',
    rating: 5,
    text: 'Analytics dashboard gives me clear insights into my progress. I know exactly which topics need more attention.',
    gradient: 'from-purple-500/20 to-pink-500/20',
  },
];

export function TestimonialsSection() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-500/5 to-background" />
      
      <div className="relative z-10 container mx-auto px-4 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-5xl md:text-6xl font-bold">
            Loved by{' '}
            <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              thousands
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See what students are saying about their learning transformation
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {TESTIMONIALS.map((testimonial, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: i * 0.1,
                ease: [0.21, 1.11, 0.81, 0.99]
              }}
              viewport={{ once: true }}
              whileHover={{ 
                y: -10,
                transition: { duration: 0.2 }
              }}
              className="relative group"
            >
              <div className={`
                absolute inset-0 bg-gradient-to-br ${testimonial.gradient}
                rounded-3xl blur-xl opacity-30 group-hover:opacity-50
                transition-opacity duration-500
              `} />

              <div className="relative bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <Quote className="w-8 h-8 text-primary/30" />
                  </div>

                  <p className="text-lg leading-relaxed">
                    {testimonial.text}
                  </p>

                  <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-2xl">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
