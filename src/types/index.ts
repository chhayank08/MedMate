/** Friendly aliases for the DB row types used throughout the app. */
import type {
  ProfileRow,
  TaskRow,
  NoteRow,
  SummaryRow,
  QuizRow,
  QuestionRow,
  QuizAttemptRow,
  StudyPlanRow,
  RevisionRow,
  FlashcardRow,
  NotificationRow,
  SubjectAnalyticsRow,
  StudySessionRow,
} from "@/types/database.types";

export type Profile = ProfileRow;
export type Task = TaskRow;
export type Note = NoteRow;
export type Summary = SummaryRow;
export type Quiz = QuizRow;
export type Question = QuestionRow;
export type QuizAttempt = QuizAttemptRow;
export type StudyPlan = StudyPlanRow;
export type Revision = RevisionRow;
export type Flashcard = FlashcardRow;
export type Notification = NotificationRow;
export type SubjectAnalytics = SubjectAnalyticsRow;
export type StudySession = StudySessionRow;

/** A quiz together with its ordered questions. */
export type QuizWithQuestions = Quiz & { questions: Question[] };

/** One answer recorded during a quiz attempt. */
export interface AttemptAnswer {
  questionId: string;
  given: string;
  correct: boolean;
}
