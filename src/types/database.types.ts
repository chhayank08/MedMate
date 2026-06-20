/**
 * Database types for the typed Supabase client.
 *
 * Hand-written to match supabase/migrations/0001_init.sql. After applying the
 * migration you can regenerate the authoritative version with:
 *   npx supabase gen types typescript --project-id <ref> --schema public > src/types/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TaskStatus = "pending" | "in_progress" | "completed";
type TaskPriority = "low" | "medium" | "high";
type Recurrence = "none" | "daily" | "weekly" | "monthly";
type Difficulty = "easy" | "medium" | "hard";
type QuestionType = "mcq" | "true_false" | "short_answer";
type SummaryTypeEnum =
  | "quick"
  | "revision"
  | "cheat_sheet"
  | "key_concepts"
  | "definitions"
  | "flashcards"
  | "high_yield_points"
  | "exam_notes"
  | "one_page_summary"
  | "active_recall_notes";

/** Build a table definition from a Row type: Insert makes generated/defaulted cols optional. */
type Table<Row, Optional extends keyof Row, Generated extends keyof Row> = {
  Row: Row;
  Insert: Omit<Row, Optional | Generated> &
    Partial<Pick<Row, Optional>> &
    Partial<Pick<Row, Generated>>;
  Update: Partial<Row>;
  Relationships: [];
};

export type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  exam_date: string | null;
  study_goal: string | null;
  daily_goal_minutes: number;
  college_name: string | null;
  university_name: string | null;
  course: string | null;
  degree_program: string | null;
  year_of_study: number | null;
  semester: number | null;
  expected_graduation_year: number | null;
  onboarding_complete: boolean;
  study_preferences: Json;
  ai_preferences: Json;
  preferred_subjects: Json;
  created_at: string;
  updated_at: string;
}

export type StudyReminderRow = {
  id: string;
  user_id: string;
  title: string;
  reminder_type: "one_time" | "recurring";
  scheduled_for: string | null;
  recurrence: "hourly" | "2h" | "4h" | "6h" | "daily" | "weekly" | "monthly" | "custom" | null;
  interval_minutes: number | null;
  enabled: boolean;
  last_fired_at: string | null;
  next_fire_at: string | null;
  created_at: string;
}


export type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  subject: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  recurrence: Recurrence;
  recurrence_interval: number;
  reminder_minutes: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type NoteRow = {
  id: string;
  user_id: string;
  subject: string | null;
  topic: string | null;
  title: string;
  file_path: string | null;
  file_type: string | null;
  content_text: string | null;
  size_bytes: number | null;
  created_at: string;
  updated_at: string;
}

export type SummaryRow = {
  id: string;
  user_id: string;
  note_id: string | null;
  title: string | null;
  subject: string | null;
  source_text: string | null;
  type: SummaryTypeEnum;
  content: string;
  model: string | null;
  created_at: string;
}

export type QuizRow = {
  id: string;
  user_id: string;
  note_id: string | null;
  title: string;
  subject: string | null;
  difficulty: Difficulty;
  num_questions: number;
  timed: boolean;
  time_limit_sec: number | null;
  source_text: string | null;
  model: string | null;
  created_at: string;
}

export type QuestionRow = {
  id: string;
  quiz_id: string;
  user_id: string;
  position: number;
  type: QuestionType;
  prompt: string;
  options: Json | null;
  correct_answer: string;
  explanation: string | null;
  created_at: string;
}

export type QuizAttemptRow = {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  total: number;
  accuracy: number;
  time_taken_sec: number | null;
  answers: Json | null;
  completed_at: string;
  created_at: string;
}

export type StudyPlanRow = {
  id: string;
  user_id: string;
  title: string | null;
  exam_date: string;
  subjects: Json;
  hours_per_day: number;
  plan: Json;
  model: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type RevisionRow = {
  id: string;
  user_id: string;
  note_id: string | null;
  subject: string;
  topic: string | null;
  last_reviewed: string | null;
  next_review: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  last_rating: Difficulty | null;
  created_at: string;
  updated_at: string;
}

export type FlashcardRow = {
  id: string;
  user_id: string;
  note_id: string | null;
  subject: string | null;
  front: string;
  back: string;
  difficulty: Difficulty;
  next_review: string | null;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  created_at: string;
  updated_at: string;
}

export type NotificationRow = {
  id: string;
  user_id: string;
  task_id: string | null;
  type: string;
  title: string | null;
  message: string;
  scheduled_for: string | null;
  sent: boolean;
  read: boolean;
  created_at: string;
}

export type SubjectAnalyticsRow = {
  id: string;
  user_id: string;
  subject: string;
  accuracy: number | null;
  study_minutes: number;
  quiz_count: number;
  last_studied: string | null;
  is_weak: boolean;
  updated_at: string;
}

export type StudySessionRow = {
  id: string;
  user_id: string;
  subject: string | null;
  duration_minutes: number;
  source: string;
  task_id: string | null;
  studied_at: string;
  created_at: string;
}

export type ChatSessionRow = {
  id: string;
  user_id: string;
  note_id: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export type ChatMessageRow = {
  id: string;
  session_id: string;
  user_id: string;
  role: string;
  content: string;
  created_at: string;
}

// ─── RAG + AI Router (0003_rag_router.sql) ──────────────────────────────────
// pgvector columns serialize over PostgREST as strings (e.g. "[0.1,0.2,…]").

export type DocumentRow = {
  id: string;
  user_id: string;
  note_id: string | null;
  title: string;
  source_type: "upload" | "paste" | "crawl";
  file_path: string | null;
  file_type: string | null;
  char_count: number;
  status: "pending" | "ready" | "failed";
  content_hash: string | null;
  created_at: string;
}

export type DocumentChunkRow = {
  id: string;
  document_id: string;
  user_id: string;
  chunk_index: number;
  content: string;
  token_count: number;
  embedding: string | null;
  created_at: string;
}


export type EmbeddingCacheRow = {
  content_hash: string;
  embedding: string;
  model: string;
  created_at: string;
}

export type AiUsageRow = {
  id: string;
  user_id: string;
  task: string;
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  cache_hit: boolean;
  created_at: string;
}

export type AiResponseCacheRow = {
  cache_key: string;
  user_id: string;
  task: string;
  response: Json;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow, "email" | "full_name" | "avatar_url" | "exam_date" | "study_goal" | "daily_goal_minutes" | "college_name" | "university_name" | "course" | "degree_program" | "year_of_study" | "semester" | "expected_graduation_year" | "onboarding_complete" | "study_preferences" | "ai_preferences" | "preferred_subjects", "created_at" | "updated_at">;
      tasks: Table<TaskRow, "description" | "subject" | "status" | "priority" | "due_date" | "recurrence" | "recurrence_interval" | "reminder_minutes" | "completed_at", "id" | "created_at" | "updated_at">;
      notes: Table<NoteRow, "subject" | "topic" | "file_path" | "file_type" | "content_text" | "size_bytes", "id" | "created_at" | "updated_at">;
      summaries: Table<SummaryRow, "note_id" | "title" | "subject" | "source_text" | "model", "id" | "created_at">;
      quizzes: Table<QuizRow, "note_id" | "subject" | "difficulty" | "timed" | "time_limit_sec" | "source_text" | "model", "id" | "created_at">;
      questions: Table<QuestionRow, "options" | "explanation" | "position", "id" | "created_at">;
      quiz_attempts: Table<QuizAttemptRow, "score" | "total" | "accuracy" | "time_taken_sec" | "answers", "id" | "completed_at" | "created_at">;
      study_plans: Table<StudyPlanRow, "title" | "model" | "active", "id" | "created_at" | "updated_at">;
      revisions: Table<RevisionRow, "note_id" | "topic" | "last_reviewed" | "next_review" | "interval_days" | "ease_factor" | "repetitions" | "last_rating", "id" | "created_at" | "updated_at">;
      flashcards: Table<FlashcardRow, "note_id" | "subject" | "difficulty" | "next_review" | "interval_days" | "ease_factor" | "repetitions", "id" | "created_at" | "updated_at">;
      notifications: Table<NotificationRow, "task_id" | "type" | "title" | "scheduled_for" | "sent" | "read", "id" | "created_at">;
      subject_analytics: Table<SubjectAnalyticsRow, "accuracy" | "study_minutes" | "quiz_count" | "last_studied" | "is_weak", "id" | "updated_at">;
      study_sessions: Table<StudySessionRow, "subject" | "source" | "task_id" | "studied_at", "id" | "created_at">;
      chat_sessions: Table<ChatSessionRow, "note_id" | "title", "id" | "created_at" | "updated_at">;
      chat_messages: Table<ChatMessageRow, never, "id" | "created_at">;
      study_reminders: Table<StudyReminderRow, "scheduled_for" | "recurrence" | "interval_minutes" | "enabled" | "last_fired_at" | "next_fire_at", "id" | "created_at">;
      documents: Table<DocumentRow, "note_id" | "source_type" | "file_path" | "file_type" | "char_count" | "status" | "content_hash", "id" | "created_at">;
      document_chunks: Table<DocumentChunkRow, "token_count" | "embedding", "id" | "created_at">;
      embedding_cache: Table<EmbeddingCacheRow, never, "created_at">;
      ai_usage: Table<AiUsageRow, "input_tokens" | "output_tokens" | "cost_usd" | "cache_hit", "id" | "created_at">;
      ai_response_cache: Table<AiResponseCacheRow, never, "created_at">;
    };
    Views: Record<string, never>;
    Functions: {
      match_document_chunks: {
        Args: {
          query_embedding: string;
          match_user: string;
          match_count?: number;
          doc_id?: string | null;
        };
        Returns: {
          id: string;
          document_id: string;
          chunk_index: number;
          content: string;
          similarity: number;
        }[];
      };
    };
    Enums: {
      task_status: TaskStatus;
      task_priority: TaskPriority;
      recurrence: Recurrence;
      difficulty: Difficulty;
      question_type: QuestionType;
      summary_type: SummaryTypeEnum;
      reminder_type: "one_time" | "recurring";
    };
    CompositeTypes: Record<string, never>;
  };
}
