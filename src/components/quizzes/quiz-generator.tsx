"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { FormSelect } from "@/components/shared/form-select";
import { SubjectCombobox } from "@/components/shared/subject-combobox";
import { FileUpload } from "@/components/shared/file-upload";
import { useHKActive } from "@/components/shared/hk-decorations";
import { HKLoader, HK_LOADING_MESSAGES } from "@/components/shared/hk-loader";
import { useBatActive } from "@/components/shared/bat-decorations";
import { BatLoader, BAT_LOADING_MESSAGES } from "@/components/shared/bat-loader";
import {
  DIFFICULTY,
  QUIZ_LENGTHS,
  QUIZ_MAX_QUESTIONS,
  QUESTION_TYPE,
  SEC_PER_QUESTION_OPTIONS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Difficulty, QuestionType } from "@/lib/constants";

const DIFFICULTY_OPTIONS = DIFFICULTY.map((d) => ({ value: d, label: d[0].toUpperCase() + d.slice(1) }));
const LENGTH_OPTIONS = [
  ...QUIZ_LENGTHS.map((n) => ({ value: String(n), label: `${n} questions` })),
  { value: "custom", label: "Custom…" },
];
const TYPE_LABELS: Record<QuestionType, string> = {
  mcq: "Multiple choice",
  true_false: "True / False",
  short_answer: "Short answer",
};
const SPQ_OPTIONS = [
  ...SEC_PER_QUESTION_OPTIONS.map((o) => ({ value: String(o.value), label: o.label })),
  { value: "custom", label: "Custom…" },
];

type InputMode = "subject" | "paste" | "upload";

function SubjectTags({
  subjects,
  onRemove,
}: {
  subjects: string[];
  onRemove: (s: string) => void;
}) {
  if (subjects.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {subjects.map((s) => (
        <span
          key={s}
          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
        >
          {s}
          <button
            type="button"
            onClick={() => onRemove(s)}
            className="hover:text-destructive"
            aria-label={`Remove ${s}`}
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
    </div>
  );
}

export function QuizGenerator() {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>("subject");
  const [title, setTitle] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [customTopics, setCustomTopics] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [uploadedText, setUploadedText] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [numQuestions, setNumQuestions] = useState("10");
  const [customNumQuestions, setCustomNumQuestions] = useState("");
  const [types, setTypes] = useState<QuestionType[]>(["mcq"]);
  const [timed, setTimed] = useState(false);
  const [spqValue, setSpqValue] = useState("60");
  const [customSpq, setCustomSpq] = useState("");
  const [loading, setLoading] = useState(false);
  const hk = useHKActive();
  const bat = useBatActive();

  function addSubject(value: string) {
    const trimmed = value.trim();
    if (!trimmed || subjects.includes(trimmed)) return;
    setSubjects((prev) => [...prev, trimmed]);
  }

  function removeSubject(s: string) {
    setSubjects((prev) => prev.filter((x) => x !== s));
  }

  function toggleType(t: QuestionType, checked: boolean) {
    setTypes((prev) => (checked ? [...new Set([...prev, t])] : prev.filter((x) => x !== t)));
  }

  function getSecPerQuestion() {
    if (spqValue === "custom") return Number(customSpq) || 60;
    return Number(spqValue);
  }

  function getNumQuestions() {
    if (numQuestions === "custom") {
      const n = Number(customNumQuestions);
      return n >= 1 && n <= QUIZ_MAX_QUESTIONS ? n : 10;
    }
    return Number(numQuestions);
  }

  function getPayload() {
    const sourceText = mode === "paste" ? pasteText : mode === "upload" ? uploadedText : undefined;
    return {
      title: title || undefined,
      subjects: subjects.length > 0 ? subjects : undefined,
      customTopics: customTopics.trim() || undefined,
      difficulty,
      numQuestions: getNumQuestions(),
      types,
      timed,
      secPerQuestion: getSecPerQuestion(),
      sourceText,
    };
  }

  async function generate() {
    if (mode === "subject" && subjects.length === 0 && !customTopics.trim()) {
      toast.error("Add at least one subject or enter custom topics.");
      return;
    }
    if (mode === "paste" && pasteText.trim().length < 40) {
      toast.error("Add at least a few sentences of material to build a quiz from.");
      return;
    }
    if (mode === "upload" && !uploadedText.trim()) {
      toast.error("Upload a file first so we have material to quiz you on.");
      return;
    }
    if (!types.length) {
      toast.error("Pick at least one question type.");
      return;
    }
    if (numQuestions === "custom") {
      const n = Number(customNumQuestions);
      if (!n || n < 1 || n > QUIZ_MAX_QUESTIONS) {
        toast.error(`Enter a number between 1 and ${QUIZ_MAX_QUESTIONS}.`);
        return;
      }
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getPayload()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Quiz generation failed.");
      toast.success("Quiz ready!");
      router.push(`/quizzes/${data.quizId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Quiz generation failed.");
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quiz settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Source input mode selector */}
        <div className="grid gap-2">
          <Label>Source material</Label>
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(["subject", "paste", "upload"] as InputMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "flex-1 px-3 py-2 text-sm font-medium transition-colors",
                  mode === m
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {m === "subject" ? "By Subject" : m === "paste" ? "Paste Notes" : "Upload File"}
              </button>
            ))}
          </div>

          {mode === "subject" && (
            <div className="grid gap-2">
              <SubjectTags subjects={subjects} onRemove={removeSubject} />
              <SubjectCombobox
                value=""
                onChange={(v) => addSubject(v)}
                placeholder="Add subjects — e.g. Cardiology, Anatomy…"
                clearAfterSelect
              />
              <Textarea
                rows={2}
                placeholder="Custom topics (optional) — e.g. ACE inhibitor side effects, Loop of Henle"
                value={customTopics}
                onChange={(e) => setCustomTopics(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Select subjects from the dropdown (adds as tags) and optionally add specific topics below.
              </p>
            </div>
          )}
          {mode === "paste" && (
            <div className="grid gap-1">
              <Textarea
                rows={10}
                placeholder="Paste the notes you want to be quizzed on…"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{pasteText.length} / 40 000 characters</p>
            </div>
          )}
          {mode === "upload" && (
            <FileUpload
              onExtracted={(text) => setUploadedText(text)}
              accept={[".pdf", ".docx", ".txt", ".md", ".png", ".jpg", ".jpeg", ".webp"]}
            />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="quiz-title">Title (optional)</Label>
            <Input id="quiz-title" placeholder="Cardiology pop quiz" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          {mode !== "subject" && (
            <div className="grid gap-2">
              <Label>Subjects (optional)</Label>
              <SubjectTags subjects={subjects} onRemove={removeSubject} />
              <SubjectCombobox
                value=""
                onChange={(v) => addSubject(v)}
                placeholder="Tag subjects…"
                clearAfterSelect
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label>Difficulty</Label>
            <FormSelect value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)} options={DIFFICULTY_OPTIONS} />
          </div>
          <div className="grid gap-2">
            <Label>Length</Label>
            <div className="flex gap-2">
              <FormSelect
                value={numQuestions}
                onValueChange={setNumQuestions}
                options={LENGTH_OPTIONS}
                className="flex-1"
              />
              {numQuestions === "custom" && (
                <Input
                  type="number"
                  min={1}
                  max={QUIZ_MAX_QUESTIONS}
                  placeholder="e.g. 50"
                  value={customNumQuestions}
                  onChange={(e) => setCustomNumQuestions(e.target.value)}
                  className="w-24"
                />
              )}
            </div>
            {numQuestions === "custom" && (
              <p className="text-xs text-muted-foreground">Max {QUIZ_MAX_QUESTIONS} questions.</p>
            )}
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Question types</Label>
          <div className="flex flex-wrap gap-4">
            {QUESTION_TYPE.map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={types.includes(t)}
                  onCheckedChange={(c) => toggleType(t, Boolean(c))}
                />
                {TYPE_LABELS[t]}
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Timed mode</p>
            <p className="text-xs text-muted-foreground">Race against the clock.</p>
          </div>
          <Switch checked={timed} onCheckedChange={setTimed} />
        </div>

        {timed && (
          <div className="grid gap-2">
            <Label>Timer per question</Label>
            <div className="flex gap-2">
              <FormSelect
                value={spqValue}
                onValueChange={setSpqValue}
                options={SPQ_OPTIONS}
                className="flex-1"
              />
              {spqValue === "custom" && (
                <Input
                  type="number"
                  min={10}
                  max={300}
                  placeholder="Seconds"
                  value={customSpq}
                  onChange={(e) => setCustomSpq(e.target.value)}
                  className="w-28"
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Total time: {Math.round((getSecPerQuestion() * getNumQuestions()) / 60)} min for {getNumQuestions()} questions.
            </p>
          </div>
        )}

        {loading && hk && <HKLoader message={HK_LOADING_MESSAGES.quiz} />}
        {loading && bat && <BatLoader message={BAT_LOADING_MESSAGES.quiz} />}

        <Button onClick={generate} disabled={loading} className="w-full">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Brain className="size-4" />}
          {loading ? "Generating quiz…" : "Generate quiz"}
        </Button>
      </CardContent>
    </Card>
  );
}
