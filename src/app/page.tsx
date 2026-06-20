import Link from "next/link";
import {
  ListChecks,
  Bell,
  Brain,
  CalendarRange,
  LineChart,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { APP_NAME } from "@/lib/constants";

const FEATURES = [
  {
    icon: ListChecks,
    title: "Smart task management",
    body: "Plan study tasks with priorities, due dates and recurring revisions across Today, Upcoming and Calendar views.",
  },
  {
    icon: Bell,
    title: "Timely reminders",
    body: "Browser notifications 15/30/60 minutes before a task — so Pathology revision never slips.",
  },
  {
    icon: Brain,
    title: "AI quizzes & summaries",
    body: "Turn any notes into board-style MCQs, true/false and short answers, or instant revision sheets.",
  },
  {
    icon: CalendarRange,
    title: "Exam study planner",
    body: "Generate a day-by-day plan from your exam date with interleaving, revision blocks and catch-up days.",
  },
  {
    icon: Sparkles,
    title: "Spaced repetition",
    body: "Rate each revision Easy/Medium/Hard and let the SM-2 scheduler decide what to review next.",
  },
  {
    icon: LineChart,
    title: "Performance analytics",
    body: "Track quiz accuracy, study hours and weak subjects with clean charts and weekly progress.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Button variant="ghost" render={<Link href="/login" />}>
              Sign in
            </Button>
            <Button render={<Link href="/signup" />}>Get started</Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,var(--accent),transparent)]"
          />
          <div className="mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm text-muted-foreground shadow-sm">
              <Sparkles className="size-4 text-primary" />
              Your personal AI study coach
            </span>
            <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight sm:text-6xl">
              Study medicine{" "}
              <span className="text-primary">smarter</span>, not longer.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg text-muted-foreground">
              {APP_NAME} organizes your tasks, turns notes into quizzes and
              summaries, builds your exam plan and tracks your weak subjects —
              all in one focused workspace.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" render={<Link href="/signup" />}>
                Start studying free <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href="/login" />}
              >
                I already have an account
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <Logo showText textClassName="text-base" />
          <p>© {new Date().getFullYear()} {APP_NAME}. Built for medical students.</p>
        </div>
      </footer>
    </div>
  );
}
