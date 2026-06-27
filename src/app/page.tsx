'use client';

import Link from "next/link";
import {
  ListChecks,
  Bell,
  Brain,
  CalendarRange,
  LineChart,
  Sparkles,
  ArrowRight,
  BookOpen,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { APP_NAME } from "@/lib/constants";
import { Hero3D } from "@/components/landing/hero-3d";
import { FloatingDomainCards } from "@/components/landing/floating-domain-cards";
import { AnimatedFeatures } from "@/components/landing/animated-features";
import { AnimatedStats } from "@/components/landing/animated-stats";
import { QuizShowcase } from "@/components/landing/quiz-showcase";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { PricingSection } from "@/components/landing/pricing-section";
import { HolographicElements } from "@/components/landing/holographic-elements";
import { FuturisticLoader } from "@/components/landing/loading-animation";
import { CTASection } from "@/components/landing/cta-section";
import { MorphingBackground } from "@/components/landing/morphing-background";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { MobileMenu } from "@/components/landing/mobile-menu";
import { Suspense } from "react";
import { motion } from "motion/react";

const FEATURES = [
  {
    icon: ListChecks,
    title: "Smart task management",
    body: "Plan study tasks with priorities, due dates and recurring revisions across multiple views.",
  },
  {
    icon: Bell,
    title: "Timely reminders",
    body: "Browser notifications before tasks — so important revision sessions never slip through.",
  },
  {
    icon: Brain,
    title: "AI quizzes & summaries",
    body: "Turn any notes into intelligent quizzes, practice questions, or instant revision sheets.",
  },
  {
    icon: CalendarRange,
    title: "Exam study planner",
    body: "Generate day-by-day plans with interleaving, revision blocks and catch-up days.",
  },
  {
    icon: Sparkles,
    title: "Spaced repetition",
    body: "Rate each revision Easy/Medium/Hard and let the algorithm decide what to review next.",
  },
  {
    icon: LineChart,
    title: "Performance analytics",
    body: "Track quiz accuracy, study hours and weak subjects with clean charts and insights.",
  },
];

const DOMAINS = [
  { name: "Medical", icon: "🩺" },
  { name: "Engineering", icon: "⚙️" },
  { name: "Computer Science", icon: "💻" },
  { name: "Business", icon: "💼" },
  { name: "Law", icon: "⚖️" },
  { name: "Science", icon: "🔬" },
];

export default function LandingPage() {
  return (
    <Suspense fallback={<FuturisticLoader />}>
      <MorphingBackground />
      <HolographicElements />
      <div className="flex min-h-dvh flex-col relative">
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="sticky top-0 z-30 border-b bg-background/60 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Button variant="ghost" render={<Link href="/login" />}>
              Sign in
            </Button>
            <Button render={<Link href="/signup" />}>Get started</Button>
          </nav>
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <MobileMenu />
          </div>
        </div>
      </motion.header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden min-h-screen flex items-center">
          <Hero3D />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,var(--accent),transparent)]"
          />
          <div className="mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28 relative z-10">
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full border bg-card/50 backdrop-blur-xl px-4 py-2 text-sm text-muted-foreground shadow-lg"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="size-4 text-primary" />
              </motion.div>
              Your personal AI study companion
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-8 text-balance text-5xl font-bold tracking-tight sm:text-7xl"
            >
              Master any subject with{" "}
              <span className="bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
                AI-powered
              </span>{" "}
              learning.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mx-auto mt-6 max-w-2xl text-pretty text-xl text-muted-foreground"
            >
              {APP_NAME} transforms your study workflow with intelligent quizzes,
              smart summaries, and personalized plans — whether you&apos;re studying
              medicine, engineering, law, or any other domain.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  render={<Link href="/signup" />}
                  className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 text-lg px-8 py-6 rounded-2xl shadow-xl shadow-primary/25"
                >
                  Start learning free <ArrowRight className="size-5 ml-2" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant="outline"
                  render={<Link href="/login" />}
                  className="text-lg px-8 py-6 rounded-2xl border-2"
                >
                  I already have an account
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Stats */}
        <section className="relative py-24 overflow-hidden">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <AnimatedStats />
          </div>
        </section>

        {/* Domains */}
        <section className="relative py-24 overflow-hidden">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-5xl md:text-6xl font-bold">
                Learn{' '}
                <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                  any domain
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                One platform, unlimited subjects. From medical school to engineering and beyond.
              </p>
            </div>
            <FloatingDomainCards />
          </div>
        </section>

        {/* Features */}
        <section className="relative py-24 overflow-hidden">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-5xl md:text-6xl font-bold">
                Everything you need to{' '}
                <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                  study smarter
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Powerful AI tools that adapt to your learning style and domain.
              </p>
            </div>
            <AnimatedFeatures />
          </div>
        </section>

        {/* Quiz Showcase */}
        <QuizShowcase />

        {/* Dashboard Preview */}
        <DashboardPreview />

        {/* Pricing */}
        <PricingSection />

        {/* Testimonials */}
        <TestimonialsSection />

        {/* CTA */}
        <CTASection />
      </main>

      <footer className="relative border-t backdrop-blur-xl bg-card/30">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <Logo showText textClassName="text-base" />
          <p>© {new Date().getFullYear()} {APP_NAME}. Your AI study companion.</p>
        </div>
      </footer>
      </div>
    </Suspense>
  );
}
