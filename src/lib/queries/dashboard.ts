import { startOfDay, endOfDay, addDays } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { Task, QuizAttempt, SubjectAnalytics } from "@/types";

type DB = SupabaseClient<Database>;

export interface DashboardData {
  stats: {
    tasksCompleted: number;
    tasksPending: number;
    notesCount: number;
    quizzesTaken: number;
    studyMinutes: number;
    avgAccuracy: number | null;
  };
  todayTasks: Task[];
  upcomingTasks: Task[];
  recentAttempts: (QuizAttempt & { quiz: { title: string; subject: string | null } | null })[];
  weakSubjects: SubjectAnalytics[];
  progress: {
    dailyGoalMinutes: number;
    studiedTodayMinutes: number;
    completedToday: number;
    dueToday: number;
  };
}

/** Aggregates everything the dashboard needs in parallel. RLS scopes to the user. */
export async function getDashboardData(
  supabase: DB,
  userId: string,
): Promise<DashboardData> {
  const now = new Date();
  const todayStart = startOfDay(now).toISOString();
  const todayEnd = endOfDay(now).toISOString();
  const weekEnd = endOfDay(addDays(now, 7)).toISOString();

  const count = (q: { count: number | null }) => q.count ?? 0;

  const [
    completedRes,
    pendingRes,
    notesRes,
    attemptsCountRes,
    profileRes,
    todayTasksRes,
    upcomingTasksRes,
    recentAttemptsRes,
    weakRes,
    accuracyRes,
    sessionsRes,
    completedTodayRes,
  ] = await Promise.all([
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("tasks").select("*", { count: "exact", head: true }).in("status", ["pending", "in_progress"]),
    supabase.from("notes").select("*", { count: "exact", head: true }),
    supabase.from("quiz_attempts").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("daily_goal_minutes").eq("id", userId).maybeSingle(),
    supabase
      .from("tasks")
      .select("*")
      .neq("status", "completed")
      .gte("due_date", todayStart)
      .lte("due_date", todayEnd)
      .order("due_date", { ascending: true }),
    supabase
      .from("tasks")
      .select("*")
      .neq("status", "completed")
      .gt("due_date", todayEnd)
      .lte("due_date", weekEnd)
      .order("due_date", { ascending: true })
      .limit(6),
    supabase
      .from("quiz_attempts")
      .select("*, quiz:quizzes(title, subject)")
      .order("completed_at", { ascending: false })
      .limit(5),
    supabase
      .from("subject_analytics")
      .select("*")
      .eq("is_weak", true)
      .order("accuracy", { ascending: true })
      .limit(4),
    supabase.from("quiz_attempts").select("accuracy").limit(500),
    supabase.from("study_sessions").select("duration_minutes, studied_at").gte("studied_at", addDays(now, -120).toISOString()),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("completed_at", todayStart)
      .lte("completed_at", todayEnd),
  ]);

  const accuracies = (accuracyRes.data ?? []).map((a) => Number(a.accuracy));
  const avgAccuracy = accuracies.length
    ? Math.round(accuracies.reduce((s, n) => s + n, 0) / accuracies.length)
    : null;

  const sessions = sessionsRes.data ?? [];
  const studyMinutes = sessions.reduce((s, r) => s + (r.duration_minutes ?? 0), 0);
  const studiedTodayMinutes = sessions
    .filter((r) => r.studied_at >= todayStart && r.studied_at <= todayEnd)
    .reduce((s, r) => s + (r.duration_minutes ?? 0), 0);

  return {
    stats: {
      tasksCompleted: count(completedRes),
      tasksPending: count(pendingRes),
      notesCount: count(notesRes),
      quizzesTaken: count(attemptsCountRes),
      studyMinutes,
      avgAccuracy,
    },
    todayTasks: (todayTasksRes.data ?? []) as Task[],
    upcomingTasks: (upcomingTasksRes.data ?? []) as Task[],
    recentAttempts: (recentAttemptsRes.data ?? []) as unknown as DashboardData["recentAttempts"],
    weakSubjects: (weakRes.data ?? []) as SubjectAnalytics[],
    progress: {
      dailyGoalMinutes: profileRes.data?.daily_goal_minutes ?? 120,
      studiedTodayMinutes,
      completedToday: count(completedTodayRes),
      dueToday: todayTasksRes.data?.length ?? 0,
    },
  };
}
