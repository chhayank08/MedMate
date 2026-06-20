"use client";

import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Timer, Target, Brain, Flame, TrendingUp, Award, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { formatMinutes } from "@/lib/utils";
import type { AnalyticsData } from "@/lib/queries/analytics";

const AXIS = { fontSize: 11, fill: "var(--muted-foreground)" };
const TOOLTIP = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 12,
  },
};
const PIE_COLORS = ["var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function badges(d: AnalyticsData) {
  const out: string[] = [];
  if (d.totals.studyStreak >= 3) out.push(`🔥 ${d.totals.studyStreak}-day streak`);
  if (d.totals.quizzesTaken >= 10) out.push("🎯 10+ quizzes");
  if ((d.totals.avgAccuracy ?? 0) >= 80) out.push("🏅 80%+ average");
  if (d.totals.monthlyMinutes >= 600) out.push("⏱️ 10h+ this month");
  return out;
}

export function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const hasAny =
    data.totals.quizzesTaken > 0 || data.totals.studyMinutes > 0 || data.subjectPerformance.length > 0;

  if (!hasAny) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No analytics yet"
        description="Take a quiz, log study time and rate revisions — your trends will appear here."
      />
    );
  }

  const earned = badges(data);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Study Time" value={formatMinutes(data.totals.studyMinutes)} icon={Timer} accent="text-chart-1" />
        <StatCard
          label="Avg Accuracy"
          value={data.totals.avgAccuracy === null ? "—" : `${data.totals.avgAccuracy}%`}
          icon={Target}
          accent="text-chart-5"
        />
        <StatCard label="Quizzes Taken" value={data.totals.quizzesTaken} icon={Brain} accent="text-chart-2" />
        <StatCard label="Study Streak" value={`${data.totals.studyStreak}d`} icon={Flame} accent="text-chart-4" />
      </div>

      {earned.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="size-4.5 text-warning" /> Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {earned.map((b) => (
              <Badge key={b} variant="secondary" className="text-sm">
                {b}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Study time (last 14 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.studyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" tick={AXIS} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={AXIS} tickLine={false} axisLine={false} width={28} />
                  <Tooltip {...TOOLTIP} formatter={(value) => [formatMinutes(Number(value)), "Studied"]} cursor={{ fill: "var(--muted)" }} />
                  <Bar dataKey="minutes" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quiz accuracy trend</CardTitle>
          </CardHeader>
          <CardContent>
            {data.accuracyTrend.length >= 2 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.accuracyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tick={AXIS} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis domain={[0, 100]} tick={AXIS} tickLine={false} axisLine={false} width={28} />
                    <Tooltip {...TOOLTIP} formatter={(value) => [`${value}%`, "Accuracy"]} />
                    <Line type="monotone" dataKey="accuracy" stroke="var(--chart-2)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Take a couple of quizzes to see your accuracy trend.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subject performance</CardTitle>
          </CardHeader>
          <CardContent>
            {data.subjectPerformance.length ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.subjectPerformance} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={AXIS} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="subject" tick={AXIS} tickLine={false} axisLine={false} width={90} />
                    <Tooltip {...TOOLTIP} formatter={(value) => [`${value}%`, "Accuracy"]} cursor={{ fill: "var(--muted)" }} />
                    <Bar dataKey="accuracy" fill="var(--chart-3)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">No subject data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revision recall</CardTitle>
          </CardHeader>
          <CardContent>
            {data.ratingDistribution.length ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.ratingDistribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                      {data.ratingDistribution.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...TOOLTIP} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Rate some revisions to see your recall mix.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {data.weakSubjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TriangleAlert className="size-4.5 text-warning" /> Subjects to focus on
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.weakSubjects.map((s) => {
              const acc = Math.round(Number(s.accuracy ?? 0));
              return (
                <div key={s.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{s.subject}</span>
                    <span className="text-muted-foreground">{acc}% · {s.quiz_count} quizzes</span>
                  </div>
                  <Progress value={acc} />
                  <p className="text-xs text-muted-foreground">
                    {s.subject} accuracy is {acc}% — schedule extra revision and a focused quiz.
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="This week" value={formatMinutes(data.totals.weeklyMinutes)} icon={TrendingUp} accent="text-chart-2" hint="study time" />
        <StatCard label="This month" value={formatMinutes(data.totals.monthlyMinutes)} icon={TrendingUp} accent="text-chart-1" hint="study time" />
      </div>
    </div>
  );
}
