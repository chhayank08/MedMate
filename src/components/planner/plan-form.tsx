"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarRange, Loader2, X, Plus, Upload, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SubjectCombobox } from "@/components/shared/subject-combobox";
import { FileUpload } from "@/components/shared/file-upload";
import { cn } from "@/lib/utils";
import type { StudyPlanWithData } from "@/hooks/use-plans";

type InputMode = "manual" | "upload";

export function PlanForm({
  initial,
  onDone,
}: {
  initial?: StudyPlanWithData | null;
  onDone?: () => void;
}) {
  const qc = useQueryClient();
  const [mode, setMode] = useState<InputMode>("manual");
  const [examDate, setExamDate] = useState(initial?.exam_date ?? "");
  const [hoursPerDay, setHoursPerDay] = useState(String(initial?.hours_per_day ?? 4));
  const [subjects, setSubjects] = useState<string[]>(
    (initial?.subjects as string[] | undefined) ?? [],
  );
  const [subjectInput, setSubjectInput] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  function addSubject(value?: string) {
    const s = (value ?? subjectInput).trim();
    if (!s) return;
    setSubjects((prev) => [...new Set([...prev, s])]);
    setSubjectInput("");
  }

  async function handleScheduleExtracted(text: string) {
    setExtracting(true);
    try {
      const res = await fetch("/api/ai/extract-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Extraction failed.");
      const { subjects: extracted, examDates, earliestExam } = data as {
        subjects: string[];
        examDates: { subject: string; date: string }[];
        earliestExam?: string;
      };
      if (extracted?.length) {
        setSubjects((prev) => [...new Set([...prev, ...extracted])]);
        toast.success(`Found ${extracted.length} subject${extracted.length > 1 ? "s" : ""} in the schedule.`);
      }
      if (earliestExam) {
        setExamDate(earliestExam);
        toast.info(`Exam date set to ${earliestExam}.`);
      } else if (examDates?.[0]?.date) {
        setExamDate(examDates[0].date);
      }
      // Switch to manual so user can review/edit
      setMode("manual");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not extract schedule data.");
    } finally {
      setExtracting(false);
    }
  }

  async function generate() {
    if (!examDate) return toast.error("Pick your exam date.");
    if (!subjects.length) return toast.error("Add at least one subject.");
    const hours = Number(hoursPerDay);
    if (!(hours >= 0.5 && hours <= 16)) return toast.error("Study hours must be between 0.5 and 16.");

    setLoading(true);
    try {
      const res = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examDate, subjects, hoursPerDay: hours, notes: notes || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Plan generation failed.");
      await qc.invalidateQueries({ queryKey: ["active-plan"] });
      toast.success("Study plan ready!");
      onDone?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Plan generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Build your study plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Mode selector */}
        <div className="grid gap-2">
          <Label>How do you want to set up your plan?</Label>
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setMode("manual")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors",
                mode === "manual" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <Pencil className="size-3.5" /> Enter manually
            </button>
            <button
              type="button"
              onClick={() => setMode("upload")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors",
                mode === "upload" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <Upload className="size-3.5" /> Upload date sheet
            </button>
          </div>
        </div>

        {mode === "upload" && (
          <div className="grid gap-2">
            <Label>Upload your exam schedule</Label>
            <FileUpload
              onExtracted={(text) => handleScheduleExtracted(text)}
              accept={[".pdf", ".docx", ".txt", ".md", ".png", ".jpg", ".jpeg", ".webp"]}
            />
            {extracting && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Extracting exam dates and subjects…
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Supported: PDF, DOCX, TXT. The AI will extract exam dates and subjects automatically.
            </p>
          </div>
        )}

        {/* Manual fields — always shown so user can review after upload */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="exam-date">Exam date</Label>
            <Input id="exam-date" type="date" min={today} value={examDate} onChange={(e) => setExamDate(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="hours">Study hours per day</Label>
            <Input id="hours" type="number" min={0.5} max={16} step={0.5} value={hoursPerDay} onChange={(e) => setHoursPerDay(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Subjects</Label>
          <div className="flex gap-2">
            <SubjectCombobox
              value=""
              onChange={(v) => addSubject(v)}
              placeholder="Add a subject…"
              className="flex-1"
              clearAfterSelect
            />
            <Button type="button" variant="outline" size="icon" onClick={() => addSubject(subjectInput)}>
              <Plus className="size-4" />
            </Button>
          </div>
          {subjects.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {subjects.map((s) => (
                <Badge key={s} variant="secondary" className="gap-1">
                  {s}
                  <button onClick={() => setSubjects((p) => p.filter((x) => x !== s))} aria-label={`Remove ${s}`}>
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="plan-notes">Anything to prioritize? (optional)</Label>
          <Textarea
            id="plan-notes"
            rows={2}
            placeholder="e.g. I'm weakest in Pharmacology; weekends are lighter."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <Button onClick={generate} disabled={loading || extracting} className="w-full">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <CalendarRange className="size-4" />}
          {loading ? "Generating plan…" : "Generate study plan"}
        </Button>
      </CardContent>
    </Card>
  );
}
