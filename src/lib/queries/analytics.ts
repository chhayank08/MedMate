import { eachDayOfInterval, subDays, format, startOfDay, isSameDay } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import type { SubjectAnalytics } from "@/types";

type DB = SupabaseClient<Database>;

export interface AnalyticsData {
  totals: {
    studyMinutes: number;
    avgAccuracy: number | null;
    quizzesTaken: number;
    studyStreak: number;
    weeklyMinutes: number;
    monthlyMinutes: number;
  };
  accuracyTrend: { date: string; accuracy: number }[];
  studyTrend: { date: string; minutes: number }[];
  subjectPerformance: { subject: string; accuracy: number; quizzes: number }[];
  ratingDistribution: { name: string; value: number }[];
  weakSubjects: SubjectAnalytics[];
}

// RLS scopes all queries to the signed-in user, so no userId argument is needed.
export async function getAnalyticsData(supabase: DB): Promise<AnalyticsData> {
  const now = new Date();
  const since = subDays(now, 60).toISOString();

  const [attemptsRes, sessionsRes, revisionsRes, subjectsRes] = await Promise.all([
    supabase
      .from("quiz_attempts")
      .select("accuracy, completed_at")
      .order("completed_at", { ascending: true })
      .limit(200),
    supabase
      .from("study_sessions")
      .select("duration_minutes, studied_at")
      .gte("studied_at", since),
    supabase.from("revisions").select("last_rating"),
    supabase.from("subject_analytics").select("*").order("accuracy", { ascending: true }),
  ]);

  const attempts = attemptsRes.data ?? [];
  const sessions = sessionsRes.data ?? [];
  const revisions = revisionsRes.data ?? [];
  const subjects = (subjectsRes.data ?? []) as SubjectAnalytics[];

  // Accuracy trend (last 30 attempts).
  const accuracyTrend = attempts.slice(-30).map((a) => ({
    date: format(new Date(a.completed_at), "MMM d"),
    accuracy: Math.round(Number(a.accuracy)),
  }));

  // Study time per day, last 14 days (zero-filled).
  const days = eachDayOfInterval({ start: subDays(now, 13), end: now });
  const studyTrend = days.map((day) => {
    const minutes = sessions
      .filter((s) => isSameDay(new Date(s.studied_at), day))
      .reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);
    return { date: format(day, "MMM d"), minutes };
  });

  // Totals.
  const accs = attempts.map((a) => Number(a.accuracy));
  const avgAccuracy = accs.length ? Math.round(accs.reduce((s, n) => s + n, 0) / accs.length) : null;
  const studyMinutes = sessions.reduce((s, r) => s + (r.duration_minutes ?? 0), 0);
  const weekStart = startOfDay(subDays(now, 6));
  const monthStart = startOfDay(subDays(now, 29));
  const weeklyMinutes = sessions
    .filter((s) => new Date(s.studied_at) >= weekStart)
    .reduce((s, r) => s + (r.duration_minutes ?? 0), 0);
  const monthlyMinutes = sessions
    .filter((s) => new Date(s.studied_at) >= monthStart)
    .reduce((s, r) => s + (r.duration_minutes ?? 0), 0);

  // Study streak: consecutive days (ending today or yesterday) with a session.
  const studyDays = new Set(sessions.map((s) => format(new Date(s.studied_at), "yyyy-MM-dd")));
  let studyStreak = 0;
  for (let i = 0; i < 365; i++) {
    const key = format(subDays(now, i), "yyyy-MM-dd");
    if (studyDays.has(key)) studyStreak++;
    else if (i === 0) continue; // today not studied yet — keep counting from yesterday
    else break;
  }

  // Subject performance from rollups.
  const subjectPerformance = subjects
    .filter((s) => s.accuracy != null)
    .map((s) => ({
      subject: s.subject,
      accuracy: Math.round(Number(s.accuracy)),
      quizzes: s.quiz_count,
    }))
    .sort((a, b) => b.accuracy - a.accuracy);

  // Revision rating distribution.
  const ratingCounts = { easy: 0, medium: 0, hard: 0 };
  for (const r of revisions) {
    if (r.last_rating) ratingCounts[r.last_rating as keyof typeof ratingCounts]++;
  }
  const ratingDistribution = [
    { name: "Easy", value: ratingCounts.easy },
    { name: "Medium", value: ratingCounts.medium },
    { name: "Hard", value: ratingCounts.hard },
  ].filter((r) => r.value > 0);

  return {
    totals: {
      studyMinutes,
      avgAccuracy,
      quizzesTaken: attempts.length,
      studyStreak,
      weeklyMinutes,
      monthlyMinutes,
    },
    accuracyTrend,
    studyTrend,
    subjectPerformance,
    ratingDistribution,
    weakSubjects: subjects.filter((s) => s.is_weak),
  };
}
