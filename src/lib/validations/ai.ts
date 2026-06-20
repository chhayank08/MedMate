import { z } from "zod";
import {
  DIFFICULTY,
  QUESTION_TYPE,
  SUMMARY_TYPE,
  QUIZ_MAX_QUESTIONS,
} from "@/lib/constants";

// ─── Request schemas (client → API route) ──────────────────────────────────

export const summaryRequestSchema = z
  .object({
    type: z.enum(SUMMARY_TYPE),
    sourceText: z.string().max(200000).optional(),
    subject: z.string().max(80).optional(),
    subjects: z.array(z.string().max(80)).max(10).optional(),
    customTopics: z.string().max(500).optional(),
    noteId: z.uuid().optional(),
    documentId: z.uuid().optional(),
    title: z.string().max(160).optional(),
  })
  .refine(
    (d) =>
      (d.sourceText && d.sourceText.length >= 40) ||
      (d.subjects && d.subjects.length > 0) ||
      (d.subject && d.subject.length > 0) ||
      (d.customTopics && d.customTopics.length > 0) ||
      d.documentId,
    {
      message: "Provide a subject, an uploaded document, or a few sentences of source material.",
    },
  );

export const quizRequestSchema = z
  .object({
    sourceText: z.string().max(40000).optional(),
    subject: z.string().max(80).optional(),
    subjects: z.array(z.string().max(80)).max(10).optional(),
    customTopics: z.string().max(500).optional(),
    difficulty: z.enum(DIFFICULTY).default("medium"),
    numQuestions: z.number().int().min(1).max(QUIZ_MAX_QUESTIONS),
    types: z.array(z.enum(QUESTION_TYPE)).min(1).default(["mcq"]),
    timed: z.boolean().default(false),
    secPerQuestion: z.number().int().min(10).max(300).default(60),
    noteId: z.uuid().optional(),
    documentId: z.uuid().optional(),
    title: z.string().max(160).optional(),
  })
  .refine(
    (d) =>
      (d.sourceText && d.sourceText.length >= 40) ||
      (d.subjects && d.subjects.length > 0) ||
      (d.subject && d.subject.length > 0) ||
      (d.customTopics && d.customTopics.length > 0) ||
      d.documentId,
    {
      message: "Provide a subject, an uploaded document, or a few sentences of source material.",
    },
  );

export const planRequestSchema = z.object({
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick an exam date."),
  subjects: z.array(z.string().min(1)).min(1, "Add at least one subject.").max(30),
  hoursPerDay: z.number().min(0.5).max(16),
  notes: z.string().max(1000).optional(),
});

export const extractScheduleRequestSchema = z.object({
  text: z.string().max(40000).optional(),
  imageBase64: z.string().optional(),
});

export const extractedScheduleSchema = z.object({
  subjects: z.array(z.string()),
  examDates: z.array(z.object({ subject: z.string(), date: z.string() })),
  earliestExam: z.string().optional(),
});

export type SummaryRequest = z.infer<typeof summaryRequestSchema>;
export type QuizRequest = z.infer<typeof quizRequestSchema>;
export type PlanRequest = z.infer<typeof planRequestSchema>;
export type ExtractScheduleRequest = z.infer<typeof extractScheduleRequestSchema>;
export type ExtractedSchedule = z.infer<typeof extractedScheduleSchema>;

// ─── AI output schemas (model → validated objects) ──────────────────────────

export const generatedQuestionSchema = z.object({
  type: z.enum(QUESTION_TYPE),
  prompt: z.string().min(1),
  options: z.array(z.string()).nullable().optional(),
  correct_answer: z.string().min(1),
  explanation: z.string().default(""),
});

export const generatedQuizSchema = z.object({
  title: z.string().min(1),
  questions: z.array(generatedQuestionSchema).min(1),
});

export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;
export type GeneratedQuiz = z.infer<typeof generatedQuizSchema>;

export const generatedFlashcardSchema = z.object({
  q: z.string().min(1),
  a: z.string().min(1),
});

export const generatedFlashcardsSchema = z.object({
  title: z.string().min(1),
  cards: z.array(generatedFlashcardSchema).min(1),
});

export type GeneratedFlashcard = z.infer<typeof generatedFlashcardSchema>;
export type GeneratedFlashcards = z.infer<typeof generatedFlashcardsSchema>;

export const planBlockSchema = z.object({
  subject: z.string(),
  activity: z.string(),
  minutes: z.number(),
  type: z.enum(["study", "revision", "practice", "break", "catch_up"]),
});

export const planDaySchema = z.object({
  date: z.string(),
  label: z.string().optional().default(""),
  blocks: z.array(planBlockSchema),
});

export const generatedPlanSchema = z.object({
  title: z.string().default("Study Plan"),
  summary: z.string().default(""),
  daily: z.array(planDaySchema),
  subjectDistribution: z
    .array(z.object({ subject: z.string(), hours: z.number() }))
    .default([]),
  tips: z.array(z.string()).default([]),
});

export type GeneratedPlan = z.infer<typeof generatedPlanSchema>;
export type PlanBlock = z.infer<typeof planBlockSchema>;
export type PlanDay = z.infer<typeof planDaySchema>;
