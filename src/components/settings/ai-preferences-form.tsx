"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormSelect } from "@/components/shared/form-select";
import { useUpdateProfile } from "@/hooks/use-profile";
import { SUMMARY_TYPE_META } from "@/lib/constants";
import type { Profile } from "@/types";
import type { SummaryType } from "@/lib/constants";

const SUMMARY_OPTIONS = Object.entries(SUMMARY_TYPE_META).map(([v, m]) => ({
  value: v,
  label: m.label,
}));

const LEARNING_MODE_OPTIONS = [
  { value: "active", label: "Active — lots of quizzes and practice" },
  { value: "passive", label: "Passive — summaries and reading" },
  { value: "balanced", label: "Balanced — mix of both" },
];

const QUIZ_DIFF_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

interface AiPrefs {
  preferred_summary_type?: SummaryType;
  preferred_quiz_difficulty?: string;
  learning_mode?: string;
}

export function AiPreferencesForm({ profile }: { profile: Profile | null }) {
  const update = useUpdateProfile();
  const prefs = (profile?.ai_preferences ?? {}) as AiPrefs;

  const [summaryType, setSummaryType] = useState<string>(prefs.preferred_summary_type ?? "revision");
  const [quizDifficulty, setQuizDifficulty] = useState(prefs.preferred_quiz_difficulty ?? "medium");
  const [learningMode, setLearningMode] = useState(prefs.learning_mode ?? "balanced");

  async function save() {
    try {
      await update.mutateAsync({
        ai_preferences: {
          ...prefs,
          preferred_summary_type: summaryType as SummaryType,
          preferred_quiz_difficulty: quizDifficulty,
          learning_mode: learningMode,
        } as never,
      });
      toast.success("AI preferences saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-2">
          <Label>Preferred summary style</Label>
          <FormSelect value={summaryType} onValueChange={setSummaryType} options={SUMMARY_OPTIONS} />
          <p className="text-xs text-muted-foreground">
            {SUMMARY_TYPE_META[summaryType as SummaryType]?.description}
          </p>
        </div>

        <div className="grid gap-2">
          <Label>Preferred quiz difficulty</Label>
          <FormSelect value={quizDifficulty} onValueChange={setQuizDifficulty} options={QUIZ_DIFF_OPTIONS} />
        </div>

        <div className="grid gap-2">
          <Label>Learning mode</Label>
          <FormSelect value={learningMode} onValueChange={setLearningMode} options={LEARNING_MODE_OPTIONS} />
        </div>

        <Button onClick={save} disabled={update.isPending}>
          {update.isPending && <Loader2 className="size-4 animate-spin" />}
          Save AI preferences
        </Button>
      </CardContent>
    </Card>
  );
}
