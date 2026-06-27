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
import { CinematicHero } from "@/components/landing/cinematic-hero";
import { FloatingDomainCards } from "@/components/landing/floating-domain-cards-new";
import { AnimatedFeatures } from "@/components/landing/animated-features-new";
import { SmoothScrollProvider } from "@/components/landing/smooth-scroll-provider";
import { ScrollReveal, Parallax } from "@/components/landing/cinematic-scroll";
import { AnimatedStats } from "@/components/landing/animated-stats";
import { QuizShowcase } from "@/components/landing/quiz-showcase";
import { DashboardPreview } from "@/components/landing/dashboard-preview-new";
import { PricingSection } from "@/components/landing/pricing-section";
import { HolographicElements } from "@/components/landing/holographic-elements";
import { FuturisticLoader } from "@/components/landing/loading-animation";
import { CTASection } from "@/components/landing/cta-section";
import { MorphingBackground } from "@/components/landing/morphing-background";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { MobileMenu } from "@/components/landing/mobile-menu";
import { Suspense } from "react";
import { motion } from "motion/react";

import { ScrollProgressBar } from "@/components/landing/scroll-progress";

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
      <SmoothScrollProvider>
        <ScrollProgressBar />
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
        <CinematicHero />

        {/* Stats */}
        <ScrollReveal>
          <section className="relative py-24 overflow-hidden">
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
              <AnimatedStats />
            </div>
          </section>
        </ScrollReveal>

        {/* Domains */}
        <ScrollReveal>
          <section className="relative py-24 overflow-hidden">
            <Parallax speed={0.2}>
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
            </Parallax>
          </section>
        </ScrollReveal>

        {/* Features */}
        <ScrollReveal>
          <section className="relative py-24 overflow-hidden">
            <Parallax speed={0.3}>
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
            </Parallax>
          </section>
        </ScrollReveal>

        {/* Quiz Showcase */}
        <ScrollReveal>
          <QuizShowcase />
        </ScrollReveal>

        {/* Dashboard Preview */}
        <ScrollReveal>
          <DashboardPreview />
        </ScrollReveal>

        {/* Pricing */}
        <ScrollReveal>
          <PricingSection />
        </ScrollReveal>

        {/* Testimonials */}
        <ScrollReveal>
          <TestimonialsSection />
        </ScrollReveal>

        {/* CTA */}
        <ScrollReveal>
          <CTASection />
        </ScrollReveal>
      </main>

      <footer className="relative border-t backdrop-blur-xl bg-card/30">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <Logo showText textClassName="text-base" />
          <p>© {new Date().getFullYear()} {APP_NAME}. Your AI study companion.</p>
        </div>
      </footer>
        </div>
      </SmoothScrollProvider>
    </Suspense>
  );
}
