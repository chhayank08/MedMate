import type { Metadata } from "next";
import {
  CircleCheckBig,
  ListTodo,
  FileText,
  Brain,
  Timer,
  Target,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/queries/dashboard";
import { StatCard } from "@/components/dashboard/stat-card";
import { AnimatedStatGrid, AnimatedStatCard } from "@/components/dashboard/animated-stat-grid";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { TaskOverview } from "@/components/dashboard/task-overview";
import { RecentQuizzes } from "@/components/dashboard/recent-quizzes";
import { WeakSubjects } from "@/components/dashboard/weak-subjects";
import { DailyProgress } from "@/components/dashboard/daily-progress";
import { AcademicProfileCard } from "@/components/dashboard/academic-profile-card";
import { formatMinutes } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const data = await getDashboardData(supabase, user!.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, college_name, university_name, degree_program, course, year_of_study, semester, expected_graduation_year",
    )
    .eq("id", user!.id)
    .maybeSingle();
  const firstName = profile?.full_name?.split(" ")[0];

  const { stats } = data;

  return (
    <div className="space-y-6">
      <div data-bat-corner>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}{firstName ? `, ${firstName}` : ""} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s your learning snapshot for today.
        </p>
      </div>

      {/* Stat cards */}
      <AnimatedStatGrid>
        <AnimatedStatCard><StatCard label="Tasks Completed" value={stats.tasksCompleted} icon={CircleCheckBig} accent="text-success" /></AnimatedStatCard>
        <AnimatedStatCard><StatCard label="Pending Tasks" value={stats.tasksPending} icon={ListTodo} accent="text-chart-4" /></AnimatedStatCard>
        <AnimatedStatCard><StatCard label="Notes" value={stats.notesCount} icon={FileText} accent="text-chart-3" /></AnimatedStatCard>
        <AnimatedStatCard><StatCard label="Quizzes Taken" value={stats.quizzesTaken} icon={Brain} accent="text-chart-2" /></AnimatedStatCard>
        <AnimatedStatCard><StatCard label="Study Hours" value={formatMinutes(stats.studyMinutes)} icon={Timer} accent="text-chart-1" /></AnimatedStatCard>
        <AnimatedStatCard>
          <StatCard
            label="Avg Quiz Score"
            value={stats.avgAccuracy === null ? "—" : `${stats.avgAccuracy}%`}
            icon={Target}
            accent="text-chart-5"
          />
        </AnimatedStatCard>
      </AnimatedStatGrid>

      {/* Quick actions */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Quick actions</h2>
        <QuickActions />
      </section>

      {/* Tasks */}
      <TaskOverview todayTasks={data.todayTasks} upcomingTasks={data.upcomingTasks} />

      {/* Insights */}
      <div className="grid gap-4 lg:grid-cols-3">
        <RecentQuizzes attempts={data.recentAttempts} />
        <WeakSubjects subjects={data.weakSubjects} />
        <DailyProgress progress={data.progress} />
      </div>

      {/* Academic Profile */}
      <AcademicProfileCard profile={profile ?? null} />
    </div>
  );
}
