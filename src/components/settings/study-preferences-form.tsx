"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormSelect } from "@/components/shared/form-select";
import { useUpdateProfile } from "@/hooks/use-profile";
import type { Profile } from "@/types";
import { cn } from "@/lib/utils";

const STUDY_TIMES = ["morning", "afternoon", "evening", "night"] as const;
type StudyTime = (typeof STUDY_TIMES)[number];

const DEFAULT_REMINDER_OPTIONS = [
  { value: "15", label: "15 min before" },
  { value: "30", label: "30 min before" },
  { value: "60", label: "1 hour before" },
  { value: "120", label: "2 hours before" },
  { value: "1440", label: "1 day before" },
];

const QUIZ_DIFF_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

interface StudyPrefs {
  study_times?: StudyTime[];
  default_reminder?: string;
  default_quiz_difficulty?: string;
}

export function StudyPreferencesForm({ profile }: { profile: Profile | null }) {
  const update = useUpdateProfile();
  const prefs = (profile?.study_preferences ?? {}) as StudyPrefs;

  const [studyTimes, setStudyTimes] = useState<StudyTime[]>(prefs.study_times ?? []);
  const [defaultReminder, setDefaultReminder] = useState(prefs.default_reminder ?? "30");
  const [defaultDifficulty, setDefaultDifficulty] = useState(prefs.default_quiz_difficulty ?? "medium");

  function toggleTime(t: StudyTime) {
    setStudyTimes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  async function save() {
    try {
      await update.mutateAsync({
        study_preferences: {
          ...prefs,
          study_times: studyTimes,
          default_reminder: defaultReminder,
          default_quiz_difficulty: defaultDifficulty,
        } as never,
      });
      toast.success("Study preferences saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Study Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-2">
          <Label>Preferred study times</Label>
          <div className="flex flex-wrap gap-2">
            {STUDY_TIMES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTime(t)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors capitalize",
                  studyTimes.includes(t)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Default task reminder</Label>
          <FormSelect value={defaultReminder} onValueChange={setDefaultReminder} options={DEFAULT_REMINDER_OPTIONS} />
        </div>

        <div className="grid gap-2">
          <Label>Default quiz difficulty</Label>
          <FormSelect value={defaultDifficulty} onValueChange={setDefaultDifficulty} options={QUIZ_DIFF_OPTIONS} />
        </div>

        <Button onClick={save} disabled={update.isPending}>
          {update.isPending && <Loader2 className="size-4 animate-spin" />}
          Save preferences
        </Button>
      </CardContent>
    </Card>
  );
}
