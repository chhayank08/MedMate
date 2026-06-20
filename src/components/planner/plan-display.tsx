"use client";

import { RefreshCw, Lightbulb, CalendarDays } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMinutes, formatDate, cn } from "@/lib/utils";
import type { StudyPlanWithData } from "@/hooks/use-plans";
import type { PlanBlock } from "@/lib/validations/ai";

const BLOCK_STYLES: Record<PlanBlock["type"], string> = {
  study: "bg-chart-1/15 text-chart-1",
  revision: "bg-chart-2/15 text-chart-2",
  practice: "bg-chart-3/15 text-chart-3",
  break: "bg-muted text-muted-foreground",
  catch_up: "bg-chart-4/15 text-chart-4",
};

const PIE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function PlanDisplay({
  plan,
  onRegenerate,
}: {
  plan: StudyPlanWithData;
  onRegenerate: () => void;
}) {
  const data = plan.plan;
  const distribution = data.subjectDistribution ?? [];

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>{data.title || plan.title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Exam {formatDate(plan.exam_date)} · {plan.hours_per_day}h/day
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onRegenerate}>
            <RefreshCw className="size-4" /> Regenerate
          </Button>
        </CardHeader>
        {data.summary && (
          <CardContent>
            <p className="text-sm text-muted-foreground">{data.summary}</p>
          </CardContent>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        {distribution.length > 0 && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Subject focus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distribution} dataKey="hours" nameKey="subject" innerRadius={45} outerRadius={80} paddingAngle={2}>
                      {distribution.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(value, name) => [`${value}h`, String(name)]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1">
                {distribution.map((d, i) => (
                  <div key={d.subject} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      {d.subject}
                    </span>
                    <span className="text-muted-foreground">{d.hours}h</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="size-4.5 text-primary" /> Daily schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
              {data.daily.map((day) => (
                <div key={day.date} className="rounded-lg border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {(() => {
                        try {
                          return format(new Date(day.date), "EEE, MMM d");
                        } catch {
                          return day.date;
                        }
                      })()}
                    </p>
                    {day.label && <span className="text-xs text-muted-foreground">{day.label}</span>}
                  </div>
                  <div className="space-y-1.5">
                    {day.blocks.map((b, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Badge className={cn("shrink-0 capitalize", BLOCK_STYLES[b.type] ?? "bg-muted")}>
                          {b.type.replace("_", " ")}
                        </Badge>
                        <span className="min-w-0 flex-1 truncate">
                          <span className="font-medium">{b.subject}</span>
                          {b.activity ? ` — ${b.activity}` : ""}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">{formatMinutes(b.minutes)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {data.tips?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="size-4.5 text-warning" /> Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="ml-5 list-disc space-y-1 text-sm text-muted-foreground">
              {data.tips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
