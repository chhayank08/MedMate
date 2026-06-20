"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Check, ChevronRight, Loader2, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SubjectCombobox } from "@/components/shared/subject-combobox";
import { useCompleteOnboarding } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types";
import type { OnboardingStep1, OnboardingStep2, OnboardingStep3 } from "@/lib/validations/onboarding";

const STEPS = ["Personal Info", "Academic Info", "Study Setup"] as const;

interface Props {
  profile?: Partial<Profile> | null;
}

export function OnboardingWizard({ profile }: Props) {
  const router = useRouter();
  const { setTheme } = useTheme();
  const complete = useCompleteOnboarding();
  const [step, setStep] = useState(0);

  // Step 1 state
  const [s1, setS1] = useState<Partial<OnboardingStep1>>({
    full_name: (profile?.full_name ?? "") || "",
    college_name: profile?.college_name ?? "",
    university_name: profile?.university_name ?? "",
    degree_program: profile?.degree_program ?? "",
    course: profile?.course ?? "",
    year_of_study: profile?.year_of_study ?? undefined,
    semester: profile?.semester ?? undefined,
    expected_graduation_year: profile?.expected_graduation_year ?? undefined,
  });

  // Step 2 state
  const [preferred, setPreferred] = useState<string[]>(
    (profile?.preferred_subjects as string[] | null | undefined) ?? []
  );
  const [subjectInput, setSubjectInput] = useState("");
  const [upcomingExams, setUpcomingExams] = useState("");
  const [goals, setGoals] = useState("");

  // Step 3 state
  const [examDate, setExamDate] = useState(profile?.exam_date ?? "");
  const [dailyGoal, setDailyGoal] = useState(String(profile?.daily_goal_minutes ?? 120));
  const [chosenTheme, setChosenTheme] = useState<"light" | "dark" | "hello-kitty" | "system">("system");

  const [saving, setSaving] = useState(false);

  function addSubject(v: string) {
    const trimmed = v.trim();
    if (!trimmed || preferred.includes(trimmed)) return;
    setPreferred((p) => [...p, trimmed]);
    setSubjectInput("");
  }

  function validateStep(): boolean {
    if (step === 0) {
      if (!s1.full_name?.trim()) { toast.error("Enter your full name."); return false; }
      if (!s1.college_name?.trim()) { toast.error("Enter your college name."); return false; }
      if (!s1.degree_program?.trim()) { toast.error("Enter your degree program."); return false; }
      if (!s1.course?.trim()) { toast.error("Enter your course."); return false; }
      if (!s1.year_of_study) { toast.error("Enter your year of study."); return false; }
    }
    if (step === 1) {
      if (!preferred.length) { toast.error("Add at least one subject."); return false; }
    }
    return true;
  }

  function nextStep() {
    if (!validateStep()) return;
    setStep((s) => s + 1);
  }

  async function finish() {
    if (!validateStep()) return;
    setSaving(true);
    try {
      setTheme(chosenTheme);
      await complete.mutateAsync({
        onboarding_complete: true,
        full_name: s1.full_name || null,
        college_name: s1.college_name || null,
        university_name: s1.university_name || null,
        degree_program: s1.degree_program || null,
        course: s1.course || null,
        year_of_study: s1.year_of_study ?? null,
        semester: s1.semester ?? null,
        expected_graduation_year: s1.expected_graduation_year ?? null,
        preferred_subjects: preferred,
        study_preferences: { upcoming_exams: upcomingExams, academic_goals: goals } as never,
        exam_date: examDate || null,
        daily_goal_minutes: Number(dailyGoal) || 120,
      });
      toast.success("All set! Welcome to MedMate AI.");
      router.push("/dashboard");
    } catch {
      toast.error("Could not save your profile. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Step {step + 1} of {STEPS.length}</span>
          <span>{STEPS[step]}</span>
        </div>
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Full name *</Label>
              <Input placeholder="Dr. Arjun Sharma" value={s1.full_name ?? ""} onChange={(e) => setS1((p) => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>College name *</Label>
              <Input placeholder="AIIMS New Delhi" value={s1.college_name ?? ""} onChange={(e) => setS1((p) => ({ ...p, college_name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>University / Affiliated to</Label>
              <Input placeholder="Delhi University" value={s1.university_name ?? ""} onChange={(e) => setS1((p) => ({ ...p, university_name: e.target.value }))} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Degree program *</Label>
                <Input placeholder="MBBS" value={s1.degree_program ?? ""} onChange={(e) => setS1((p) => ({ ...p, degree_program: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Course *</Label>
                <Input placeholder="Medicine & Surgery" value={s1.course ?? ""} onChange={(e) => setS1((p) => ({ ...p, course: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Year of study *</Label>
                <Input type="number" min={1} max={10} placeholder="2" value={s1.year_of_study ?? ""} onChange={(e) => setS1((p) => ({ ...p, year_of_study: Number(e.target.value) || undefined }))} />
              </div>
              <div className="grid gap-2">
                <Label>Semester</Label>
                <Input type="number" min={1} max={20} placeholder="3" value={s1.semester ?? ""} onChange={(e) => setS1((p) => ({ ...p, semester: Number(e.target.value) || undefined }))} />
              </div>
              <div className="grid gap-2">
                <Label>Expected graduation year</Label>
                <Input type="number" min={2024} max={2040} placeholder="2029" value={s1.expected_graduation_year ?? ""} onChange={(e) => setS1((p) => ({ ...p, expected_graduation_year: Number(e.target.value) || undefined }))} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Academic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Subjects you&apos;re currently studying *</Label>
              <div className="flex gap-2">
                <SubjectCombobox
                  value={subjectInput}
                  onChange={setSubjectInput}
                  placeholder="Add a subject…"
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={() => addSubject(subjectInput)}>
                  Add
                </Button>
              </div>
              {preferred.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {preferred.map((s) => (
                    <Badge key={s} variant="secondary" className="gap-1 cursor-pointer" onClick={() => setPreferred((p) => p.filter((x) => x !== s))}>
                      {s} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Upcoming exams (optional)</Label>
              <Input placeholder="e.g. Internal assessment in 3 weeks, University exams in Nov" value={upcomingExams} onChange={(e) => setUpcomingExams(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Academic goals (optional)</Label>
              <Input placeholder="e.g. Top 10% in batch, USMLE Step 1 in 2026" value={goals} onChange={(e) => setGoals(e.target.value)} />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Study Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Primary exam date (optional)</Label>
              <Input type="date" min={new Date().toISOString().slice(0, 10)} value={examDate} onChange={(e) => setExamDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Daily study goal (minutes)</Label>
              <Input type="number" min={15} max={960} step={15} value={dailyGoal} onChange={(e) => setDailyGoal(e.target.value)} />
              <p className="text-xs text-muted-foreground">{Math.round(Number(dailyGoal) / 60 * 10) / 10} hours/day</p>
            </div>
            <div className="grid gap-2">
              <Label>App theme</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["light", "dark", "hello-kitty"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setChosenTheme(t)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-xs font-medium transition-colors",
                      chosenTheme === t ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    )}
                  >
                    {t === "light" && <Sun className="size-5" />}
                    {t === "dark" && <Moon className="size-5" />}
                    {t === "hello-kitty" && <span className="text-lg">🎀</span>}
                    <span>{t === "hello-kitty" ? "Hello Kitty" : t[0].toUpperCase() + t.slice(1)}</span>
                    {chosenTheme === t && <Check className="size-3 text-primary" />}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        {step > 0 ? (
          <Button variant="outline" onClick={() => setStep((s) => s - 1)}>Back</Button>
        ) : (
          <div />
        )}
        {step < STEPS.length - 1 ? (
          <Button onClick={nextStep}>
            Next <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button onClick={finish} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            {saving ? "Saving…" : "Get started"}
          </Button>
        )}
      </div>
    </div>
  );
}
