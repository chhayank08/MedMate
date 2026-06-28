"use client";

import { useRef, useState } from "react";
import { Sparkles, Loader2, Copy, Check, X, RotateCcw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FormSelect } from "@/components/shared/form-select";
import { SubjectCombobox } from "@/components/shared/subject-combobox";
import { FileUpload } from "@/components/shared/file-upload";
import { Markdown } from "@/components/shared/markdown";
import { Flashcards, flashcardsToMarkdown, type Flashcard } from "@/components/summaries/flashcards";
import { EmptyState } from "@/components/shared/empty-state";
import { useHKActive } from "@/components/shared/hk-decorations";
import { HKLoader, HK_LOADING_MESSAGES } from "@/components/shared/hk-loader";
import { useBatActive } from "@/components/shared/bat-decorations";
import { BatLoader, BAT_LOADING_MESSAGES } from "@/components/shared/bat-loader";
import { useSaveSummary } from "@/hooks/use-summaries";
import { useDomainContext } from "@/hooks/use-domain-context";
import { formatAPIError, formatStreamError } from "@/lib/error-formatter";
import {
  SUMMARY_TYPE,
  SUMMARY_TYPE_META,
  streamCompleted,
  latestStreamProgress,
  stripStreamMarkers,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { SummaryType } from "@/lib/constants";

const TYPE_OPTIONS = SUMMARY_TYPE.map((v) => ({ value: v, label: SUMMARY_TYPE_META[v].label }));
type InputMode = "subject" | "paste" | "upload";

/** Abort a stream that goes silent this long (covers slow per-section calls). */
const STALL_MS = 120_000;

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

export function SummaryGenerator() {
  const { domainConfig, isReady, activeDomain } = useDomainContext();
  
  // STABLE placeholders - memoized to prevent recreation
  const placeholders = useMemo(() => domainConfig?.placeholders ?? {
    quizTopic: 'Biology topics',
    summaryTopic: 'Science concepts',
    taskExample: 'Study notes'
  }, [domainConfig]);
  
  const [mode, setMode] = useState<InputMode>("paste");
  const [type, setType] = useState<SummaryType>("revision");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [customTopics, setCustomTopics] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [uploadedText, setUploadedText] = useState("");
  const [content, setContent] = useState("");
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [generating, setGenerating] = useState(false);
  const [incomplete, setIncomplete] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const hk = useHKActive();
  const bat = useBatActive();
  const saveSummary = useSaveSummary();
  const savedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  
  // CRITICAL: Guard against rendering before hydration completes
  if (!isReady || !activeDomain || !domainConfig) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="size-8 animate-spin mx-auto text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Loading summary generator...</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-12" />
        </Card>
      </div>
    );
  }

  function addSubject(value: string) {
    const trimmed = value.trim();
    if (!trimmed || subjects.includes(trimmed)) return;
    setSubjects((prev) => [...prev, trimmed]);
  }

  function removeSubject(s: string) {
    setSubjects((prev) => prev.filter((x) => x !== s));
  }

  function getPayload() {
    const sourceText =
      mode === "paste" ? pasteText : mode === "upload" ? uploadedText : undefined;
    return {
      type,
      subjects: subjects.length > 0 ? subjects : undefined,
      subject: subjects[0] || undefined,
      customTopics: customTopics.trim() || undefined,
      sourceText,
    };
  }

  async function generate() {
    if (mode === "subject" && subjects.length === 0 && !customTopics.trim()) {
      toast.error("Add at least one subject or enter custom topics.");
      return;
    }
    if (mode === "paste" && pasteText.trim().length < 40) {
      toast.error("Add at least a few sentences of material to summarize.");
      return;
    }
    if (mode === "upload" && !uploadedText.trim()) {
      toast.error("Upload a file first.");
      return;
    }
    setGenerating(true);
    setContent("");
    setCards([]);
    setIncomplete(false);
    setProgressMsg("");
    savedRef.current = false;

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getPayload()),
        signal: controller.signal,
      });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Generation failed." }));
        const userMsg = formatAPIError(res.status, error);
        throw new Error(userMsg);
      }

      // Flashcards come back as structured JSON; everything else streams Markdown.
      let finalContent = "";
      let complete = true;
      if (type === "flashcards") {
        const data = await res.json().catch(() => null);
        const list: Flashcard[] = Array.isArray(data?.cards) ? data.cards : [];
        if (list.length === 0) throw new Error("Generation failed.");
        setCards(list);
        finalContent = flashcardsToMarkdown(list);
        setContent(finalContent);
      } else {
        if (!res.body) throw new Error("Generation failed.");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        // Stall guard: abort if the stream goes silent (hung/dropped upstream).
        let stall: ReturnType<typeof setTimeout> | undefined;
        const resetStall = () => {
          if (stall) clearTimeout(stall);
          stall = setTimeout(() => controller.abort(), STALL_MS);
        };
        try {
          resetStall();
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            resetStall();
            acc += decoder.decode(value, { stream: true });
            setProgressMsg(latestStreamProgress(acc) ?? "");
            setContent(stripStreamMarkers(acc));
          }
        } finally {
          if (stall) clearTimeout(stall);
        }
        // Only a stream that delivered the success sentinel is complete.
        complete = streamCompleted(acc);
        finalContent = stripStreamMarkers(acc).trim();
        setContent(finalContent);
        setProgressMsg("");
      }

      if (!complete) {
        setIncomplete(true);
        toast.error("Generation incomplete. Tap Retry to try again.", { duration: 5000 });
        return; // never save a truncated summary
      }

      if (finalContent.trim()) {
        const sourceText = mode === "paste" ? pasteText : mode === "upload" ? uploadedText : undefined;
        const primarySubject = subjects[0] || "";
        const title = `${SUMMARY_TYPE_META[type].label} — ${primarySubject || customTopics.trim() || "Notes"}`;
        await saveSummary.mutateAsync({
          type,
          title,
          subject: primarySubject,
          sourceText: sourceText ?? "",
          content: finalContent,
        });
        savedRef.current = true;
        toast.success("Saved to your library", { duration: 3000 });
      }
    } catch (err) {
      if (controller.signal.aborted) {
        setIncomplete(true);
        toast.error("Generation incomplete. Tap Retry to try again.", { duration: 5000 });
      } else {
        const msg = formatStreamError(err);
        toast.error(msg, { duration: 5000 });
      }
    } finally {
      setGenerating(false);
      setProgressMsg("");
      abortRef.current = null;
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Source material</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Summary type</Label>
            <FormSelect
              value={type}
              onValueChange={(v) => {
                setType(v as SummaryType);
                setContent("");
                setCards([]);
                setIncomplete(false);
                setProgressMsg("");
              }}
              options={TYPE_OPTIONS}
            />
            <p className="text-xs text-muted-foreground">{SUMMARY_TYPE_META[type].description}</p>
          </div>

          {/* Input mode selector */}
          <div className="grid gap-2">
            <Label>Input source</Label>
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
                  placeholder={`Add subjects — e.g. ${placeholders.quizTopic}`}
                  clearAfterSelect
                />
                <Textarea
                  rows={2}
                  placeholder={`Custom topics (optional) — e.g. ${placeholders.summaryTopic}`}
                  value={customTopics}
                  onChange={(e) => setCustomTopics(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Select subjects from the dropdown (adds as tags) and optionally describe specific topics.
                </p>
              </div>
            )}
            {mode === "paste" && (
              <div className="grid gap-1">
                <Textarea
                  rows={12}
                  placeholder={`Paste lecture notes, a chapter, or describe ${placeholders.summaryTopic} to summarize…`}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{pasteText.length} / 200 000 characters</p>
              </div>
            )}
            {mode === "upload" && (
              <FileUpload
                onExtracted={(text) => setUploadedText(text)}
                accept={[".pdf", ".docx", ".txt", ".md", ".png", ".jpg", ".jpeg", ".webp"]}
              />
            )}
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
              {subjects.length > 0 && (
                <Textarea
                  rows={2}
                  placeholder="Custom topics (optional)"
                  value={customTopics}
                  onChange={(e) => setCustomTopics(e.target.value)}
                />
              )}
            </div>
          )}

          <Button onClick={generate} disabled={generating} className="w-full">
            {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {generating ? "Generating…" : "Generate summary"}
          </Button>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{SUMMARY_TYPE_META[type].label}</CardTitle>
          {content && (
            <Button variant="ghost" size="sm" onClick={copy}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {incomplete && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
              <span className="flex items-center gap-2 text-warning">
                <AlertTriangle className="size-4 shrink-0" />
                Output stopped early and may be incomplete.
              </span>
              <Button variant="outline" size="sm" onClick={generate} disabled={generating}>
                <RotateCcw className="size-4" /> Retry
              </Button>
            </div>
          )}

          {type === "flashcards" && cards.length > 0 ? (
            <Flashcards cards={cards} />
          ) : content ? (
            <Markdown>{content}</Markdown>
          ) : generating ? (
            hk ? (
              <HKLoader message={progressMsg || HK_LOADING_MESSAGES.summary} />
            ) : bat ? (
              <BatLoader message={progressMsg || BAT_LOADING_MESSAGES.summary} />
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> {progressMsg || "Thinking through your material…"}
              </div>
            )
          ) : (
            <EmptyState
              icon={Sparkles}
              title="Your summary will appear here"
              description="Pick a type, choose a source, and generate."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
