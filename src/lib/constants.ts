/**
 * App-wide constants. Keep enum-like values here so the UI, validation, and DB
 * stay in sync. The string values match the Postgres CHECK/enum values in
 * supabase/migrations/0001_init.sql.
 */

export const APP_NAME = "MedMate AI";
export const APP_DESCRIPTION =
  "Your AI-powered study coach for medical school — tasks, notes, quizzes, plans & analytics.";

export const TASK_STATUS = ["pending", "in_progress", "completed"] as const;
export type TaskStatus = (typeof TASK_STATUS)[number];

export const TASK_PRIORITY = ["low", "medium", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITY)[number];

export const RECURRENCE = ["none", "daily", "weekly", "monthly"] as const;
export type Recurrence = (typeof RECURRENCE)[number];

export const DIFFICULTY = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTY)[number];

export const QUESTION_TYPE = ["mcq", "true_false", "short_answer"] as const;
export type QuestionType = (typeof QUESTION_TYPE)[number];

export const SUMMARY_TYPE = [
  "quick",
  "revision",
  "cheat_sheet",
  "key_concepts",
  "definitions",
  "flashcards",
  "high_yield_points",
  "exam_notes",
  "one_page_summary",
  "active_recall_notes",
] as const;
export type SummaryType = (typeof SUMMARY_TYPE)[number];

export const REVISION_RATING = ["easy", "medium", "hard"] as const;
export type RevisionRating = (typeof REVISION_RATING)[number];

export const QUIZ_LENGTHS = [5, 10, 20, 30] as const;
export const QUIZ_MAX_QUESTIONS = 100;

export const SEC_PER_QUESTION_OPTIONS = [
  { value: 15, label: "15 sec / question" },
  { value: 30, label: "30 sec / question" },
  { value: 45, label: "45 sec / question" },
  { value: 60, label: "60 sec / question" },
  { value: 90, label: "90 sec / question" },
  { value: 120, label: "120 sec / question" },
] as const;

export const SUMMARY_TYPE_META: Record<
  SummaryType,
  { label: string; description: string }
> = {
  quick: { label: "Quick Summary", description: "A concise overview of the material." },
  revision: { label: "Revision Notes", description: "Structured notes for active recall." },
  cheat_sheet: { label: "Exam Cheat Sheet", description: "High-yield facts for last-minute review." },
  key_concepts: { label: "Key Concepts", description: "The core ideas you must understand." },
  definitions: { label: "Important Definitions", description: "Must-know terms and their meanings." },
  flashcards: { label: "Flashcards", description: "Q&A pairs for spaced repetition practice." },
  high_yield_points: { label: "High Yield Points", description: "The most exam-worthy facts, ranked." },
  exam_notes: { label: "Exam Notes", description: "Comprehensive notes formatted for exam review." },
  one_page_summary: { label: "One Page Summary", description: "Everything essential on a single page." },
  active_recall_notes: { label: "Active Recall Notes", description: "Blanked-out notes to test yourself." },
};

export const TASK_REMINDER_OPTIONS = [
  { value: "", label: "No reminder" },
  { value: "15", label: "15 minutes before" },
  { value: "30", label: "30 minutes before" },
  { value: "60", label: "1 hour before" },
  { value: "120", label: "2 hours before" },
  { value: "240", label: "4 hours before" },
  { value: "1440", label: "1 day before" },
  { value: "custom", label: "Custom…" },
] as const;

export const TASK_STATUS_META: Record<TaskStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", className: "bg-chart-2/15 text-chart-2" },
  completed: { label: "Completed", className: "bg-success/15 text-success" },
};

export const TASK_PRIORITY_META: Record<TaskPriority, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-muted text-muted-foreground" },
  medium: { label: "Medium", className: "bg-warning/15 text-warning" },
  high: { label: "High", className: "bg-destructive/15 text-destructive" },
};

/** Common medical-school subjects offered as quick suggestions. */
export const MEDICAL_SUBJECTS = [
  "Anatomy",
  "Physiology",
  "Biochemistry",
  "Pathology",
  "Pharmacology",
  "Microbiology",
  "Cardiology",
  "Neuroanatomy",
  "Neurology",
  "Immunology",
  "Histology",
  "Embryology",
  "Genetics",
  "Hematology",
  "Endocrinology",
  "Respiratory",
  "Gastroenterology",
  "Nephrology",
  "Obstetrics & Gynecology",
  "Pediatrics",
  "Surgery",
  "Psychiatry",
  "Community Medicine",
  "Forensic Medicine",
] as const;

/** Weak-subject thresholds used across analytics & coach insights. */
export const WEAK_SUBJECT_ACCURACY_THRESHOLD = 65; // percent
export const STALE_REVISION_DAYS = 7;

// ─── AI summary streaming protocol ──────────────────────────────────────────
// In-band control markers shared by the summary route (server) and the
// generator UI (client). The server appends STREAM_DONE_MARKER as the final
// bytes ONLY on successful completion, so the client can distinguish a complete
// stream from a dropped/timed-out one (and never save a truncated result).
// Progress markers are transient status updates the client strips before
// rendering, copying, or saving. Markers are HTML comments so the Markdown
// renderer ignores any that briefly slip through.
export const STREAM_DONE_MARKER = "<!--MEDMATE_DONE-->";
export const STREAM_PROGRESS_PREFIX = "<!--MEDMATE_PROGRESS:";
export const STREAM_PROGRESS_SUFFIX = "-->";
// Emitted by the server on an interval during long provider calls so the
// connection never goes idle (prevents proxy idle-timeout →
// ERR_INCOMPLETE_CHUNKED_ENCODING). Carries no message, so it is stripped from
// the rendered output but — unlike a progress marker — never overwrites the
// visible progress text.
export const STREAM_HEARTBEAT_MARKER = "<!--MEDMATE_HEARTBEAT-->";

/** True if a completed stream carries the success sentinel. */
export function streamCompleted(text: string): boolean {
  return text.includes(STREAM_DONE_MARKER);
}

/** The latest progress message embedded in the stream so far, if any. */
export function latestStreamProgress(text: string): string | null {
  const matches = text.match(/<!--MEDMATE_PROGRESS:([^>]*?)-->/g);
  if (!matches || matches.length === 0) return null;
  const last = matches[matches.length - 1];
  return last.slice(STREAM_PROGRESS_PREFIX.length, -STREAM_PROGRESS_SUFFIX.length);
}

/** Remove all MedMate control markers (done + progress, incl. a dangling
 *  partial marker at the end of a chunk boundary). */
export function stripStreamMarkers(text: string): string {
  return text
    .replace(/<!--MEDMATE_(?:DONE|HEARTBEAT|PROGRESS:[^>]*?)-->/g, "")
    .replace(/<!--MEDMATE_[^>]*$/g, "");
}
