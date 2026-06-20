/**
 * Centralized prompt builders. Keeping prompts here (not inline in routes)
 * makes them easy to tune and keeps the AI persona consistent.
 */
import type { ChatMessage } from "@/lib/ai/providers/types";
import type { Difficulty, SummaryType, QuestionType } from "@/lib/constants";
import { SUMMARY_TYPE_META } from "@/lib/constants";

const TUTOR_PERSONA =
  "You are MedMate, an expert medical educator and study coach for medical students. " +
  "You are accurate, evidence-based and concise. You use correct medical terminology, " +
  "high-yield framing (think board-exam relevance), clear structure and clinically " +
  "useful mnemonics where appropriate. Never invent facts; if the provided material is " +
  "insufficient, rely on well-established medical knowledge and say so briefly.";

// Each entry is deliberately distinct in STRUCTURE, DEPTH and LENGTH so the
// types never converge into look-alike outputs.
const SUMMARY_INSTRUCTIONS: Record<SummaryType, string> = {
  quick:
    "Write a QUICK SUMMARY — a high-level overview only. 4–8 short bullet points OR 3–5 short paragraphs capturing just the core message and the most essential takeaways. Stay brief and skip fine detail, sub-points, tables and mnemonics. This must read noticeably SHORTER and higher-level than revision or exam notes.",
  revision:
    "Write REVISION NOTES — hierarchical study notes optimized for active recall. Use clear `##`/`###` headings for every major topic, nested bullet points, **bold** key terms and values, and short mnemonics where helpful. Organize by topic and keep each point crisp. Cover all major topics in the material in note form (not full prose paragraphs).",
  cheat_sheet:
    "Write an EXAM CHEAT SHEET — maximally dense, telegraphic high-yield facts. Use compact bullets, tables, classic associations, buzzwords, numeric values and cut-offs. Minimize prose; maximize information per line. This must feel far denser and more compressed than any other type.",
  key_concepts:
    "Extract KEY CONCEPTS — the 5–12 most important ideas only. Format each as a `###` heading followed by a 1–2 sentence explanation of what it is and why it matters. Do not produce full notes; this is a focused conceptual map.",
  definitions:
    "Extract IMPORTANT DEFINITIONS — a glossary of must-know terms. Format strictly as `**Term** — precise, exam-ready definition` (one per line). Include only terms, not narrative explanation.",
  flashcards:
    "Generate FLASHCARDS: 15–30 Q&A pairs formatted as:\n**Q:** [question]\n**A:** [answer]\n\nEach pair tests one distinct, clinically important fact.",
  high_yield_points:
    "Write HIGH YIELD POINTS — a single numbered list ranking the most exam-critical facts from MOST to LEAST important. Each item is one actionable, testable fact (one line). No headings, no prose sections — just the ranked list.",
  exam_notes:
    "Write EXAM NOTES (detailed notes) — the most COMPREHENSIVE format. Provide full, in-depth coverage of every topic with `##`/`###` headings, complete explanations (not just bullets), tables where useful, key values in **bold**, and clinical pearls prefixed with ⚡. This must be the longest and most thorough output — explain, don't just list.",
  one_page_summary:
    "Write a ONE PAGE SUMMARY — synthesize everything into a single dense page using a tight structured layout (a few sections, bullets, small tables). Pretend there is a STRICT one-page limit: be comprehensive in coverage but economical in words.",
  active_recall_notes:
    "Write ACTIVE RECALL NOTES — self-testing notes. Present key facts as statements with deliberate blanks (use `_____` for the blanked word/value) and interleave follow-up prompts like 'What causes _____?'. The reader should be able to quiz themselves line by line.",
};

function buildSubjectContext(
  subject?: string | null,
  subjects?: string[] | null,
  customTopics?: string | null,
): { subjectLine: string; topicLine: string; allSubjects: string[] } {
  const allSubjects = subjects?.length ? subjects : subject ? [subject] : [];
  const subjectLine = allSubjects.length > 0 ? `Subject(s): ${allSubjects.join(", ")}\n` : "";
  const topicLine = customTopics?.trim()
    ? `Additional focus areas: ${customTopics.trim()}\n`
    : "";
  return { subjectLine, topicLine, allSubjects };
}

export function summaryMessages(
  type: SummaryType,
  sourceText: string | null | undefined,
  subject?: string | null,
  subjects?: string[] | null,
  customTopics?: string | null,
  academicContext?: string,
): ChatMessage[] {
  const hasMaterial = sourceText && sourceText.trim().length > 0;
  const { subjectLine, topicLine, allSubjects } = buildSubjectContext(subject, subjects, customTopics);
  const topicFallback = allSubjects.length
    ? `Draw on well-established medical knowledge for: ${allSubjects.join(", ")}.${customTopics ? ` Focus especially on: ${customTopics.trim()}.` : ""}`
    : "Draw on core medical knowledge.";
  const contextBlock = academicContext ? `--- STUDENT CONTEXT ---\n${academicContext}\n\n` : "";
  const coverageDirective = hasMaterial
    ? `Base your output on the COMPLETE study material below: read it from start to finish and represent EVERY section, heading and topic — do not skip or omit any part. Finish every section fully and never stop mid-sentence.\n`
    : "";
  return [
    { role: "system", content: TUTOR_PERSONA },
    {
      role: "user",
      content:
        contextBlock +
        `${SUMMARY_INSTRUCTIONS[type]}\n\n` +
        `Goal: ${SUMMARY_TYPE_META[type].description}\n` +
        subjectLine +
        topicLine +
        coverageDirective +
        `Format the output in clean Markdown. Do not add a preamble or sign-off.\n\n` +
        (hasMaterial ? `--- STUDY MATERIAL ---\n${sourceText}` : topicFallback),
    },
  ];
}

/**
 * MAP step of the chunked pipeline: summarize ONE section of a large document
 * in the requested type's style. Each call is bounded (free-tier safe) and the
 * partials are merged by `summarize-large.ts`.
 */
export function summarySectionMessages(
  type: SummaryType,
  sectionText: string,
  sectionIndex: number,
  totalSections: number,
  subject?: string | null,
  subjects?: string[] | null,
  customTopics?: string | null,
  academicContext?: string,
): ChatMessage[] {
  const { subjectLine, topicLine } = buildSubjectContext(subject, subjects, customTopics);
  const contextBlock = academicContext ? `--- STUDENT CONTEXT ---\n${academicContext}\n\n` : "";
  return [
    { role: "system", content: TUTOR_PERSONA },
    {
      role: "user",
      content:
        contextBlock +
        `This is section ${sectionIndex} of ${totalSections} of a larger study document. ` +
        `Apply the instruction below to THIS SECTION ONLY — cover everything in it, do not skip content, do not add a "Section ${sectionIndex}" heading, no preamble, no sign-off, and do not reference other sections.\n\n` +
        `${SUMMARY_INSTRUCTIONS[type]}\n\n` +
        subjectLine +
        topicLine +
        `Format in clean Markdown. Finish every point fully; never stop mid-sentence.\n\n` +
        `--- SECTION CONTENT ---\n${sectionText}`,
    },
  ];
}

/**
 * REDUCE step for "concise" types: synthesize the per-section notes into one
 * short, cohesive output in the requested format (summary-of-summaries).
 */
export function summaryReduceMessages(
  type: SummaryType,
  partials: string[],
  subject?: string | null,
  subjects?: string[] | null,
  customTopics?: string | null,
  academicContext?: string,
): ChatMessage[] {
  const { subjectLine, topicLine } = buildSubjectContext(subject, subjects, customTopics);
  const contextBlock = academicContext ? `--- STUDENT CONTEXT ---\n${academicContext}\n\n` : "";
  return [
    { role: "system", content: TUTOR_PERSONA },
    {
      role: "user",
      content:
        contextBlock +
        `Below are notes captured from consecutive sections of ONE document.\n\n` +
        `${SUMMARY_INSTRUCTIONS[type]}\n\n` +
        `Synthesize ALL of the section notes into a SINGLE cohesive result: merge duplicates, keep the most important points, organize logically, and respect the intended brevity for this format. Do not mention sections or that this was assembled.\n` +
        subjectLine +
        topicLine +
        `Format in clean Markdown. No preamble or sign-off.\n\n` +
        `--- SECTION NOTES ---\n${partials.join("\n\n---\n\n")}`,
    },
  ];
}

/**
 * Flashcards are generated as STRUCTURED JSON (like the quiz) so they are
 * always genuine Q&A pairs — never prose. Generated in small BATCHES so each
 * request stays free-tier safe and a truncated JSON never loses the whole set.
 * `avoidQuestions` lets later batches steer clear of earlier cards. Validated
 * against `generatedFlashcardsSchema`.
 */
export function flashcardBatchMessages(
  sourceText: string | null | undefined,
  count: number,
  avoidQuestions: string[],
  subject?: string | null,
  subjects?: string[] | null,
  customTopics?: string | null,
  academicContext?: string,
): ChatMessage[] {
  const hasMaterial = sourceText && sourceText.trim().length > 0;
  const { subjectLine, topicLine, allSubjects } = buildSubjectContext(subject, subjects, customTopics);
  const contextBlock = academicContext ? `--- STUDENT CONTEXT ---\n${academicContext}\n\n` : "";
  const topicFallback = allSubjects.length
    ? `Draw on well-established, board-exam-relevant medical knowledge for: ${allSubjects.join(", ")}.${customTopics?.trim() ? ` Focus especially on: ${customTopics.trim()}.` : ""}`
    : "Draw on core, board-exam-relevant medical knowledge.";
  const jsonShape = `Respond with ONLY valid JSON in this exact shape:\n{"title": string, "cards": [{"q": string, "a": string}]}`;
  const avoidBlock = avoidQuestions.length
    ? `Do NOT repeat or rephrase any of these already-created questions:\n- ${avoidQuestions.slice(0, 40).join("\n- ")}\n\n`
    : "";
  return [
    { role: "system", content: TUTOR_PERSONA },
    {
      role: "user",
      content:
        contextBlock +
        `Create exactly ${count} flashcards for active recall. Each card tests ONE distinct, clinically important fact. ` +
        `Questions must be specific and answerable. Answers MUST be very concise — at most 2 short sentences (one is ideal). ` +
        `Never write paragraphs, summaries, or bullet lists in an answer. Spread the cards across the breadth of the material.\n` +
        subjectLine +
        topicLine +
        avoidBlock +
        (hasMaterial
          ? `Base the cards on the material below.\n\n${jsonShape}\n\n--- STUDY MATERIAL ---\n${sourceText}`
          : `${topicFallback}\n\n${jsonShape}`),
    },
  ];
}

export interface QuizPromptInput {
  sourceText?: string | null;
  subject?: string | null;
  subjects?: string[] | null;
  customTopics?: string | null;
  difficulty: Difficulty;
  numQuestions: number;
  types: QuestionType[];
  academicContext?: string;
}

export function quizMessages(input: QuizPromptInput): ChatMessage[] {
  const { sourceText, subject, subjects, customTopics, difficulty, numQuestions, types, academicContext } = input;
  const typeList = types.join(", ");
  const hasMaterial = sourceText && sourceText.trim().length > 0;
  const { subjectLine, topicLine, allSubjects } = buildSubjectContext(subject, subjects, customTopics);

  const topicClause = allSubjects.length
    ? ` covering: ${allSubjects.join(", ")}`
    : "";
  const topicFallback =
    `- Draw on well-established, board-exam-relevant medical knowledge${allSubjects.length ? ` for ${allSubjects.join(", ")}` : ""}. Cover a broad range of clinically important concepts.\n` +
    (customTopics?.trim() ? `- Pay special attention to these areas: ${customTopics.trim()}.\n` : "");
  const contextBlock = academicContext ? `--- STUDENT CONTEXT ---\n${academicContext}\n\n` : "";

  return [
    { role: "system", content: TUTOR_PERSONA },
    {
      role: "user",
      content:
        contextBlock +
        `Create a ${difficulty} quiz of exactly ${numQuestions} questions for a medical student` +
        topicClause +
        `. Use only these question types: ${typeList}. Distribute the types reasonably.\n` +
        subjectLine +
        topicLine +
        `\nRules:\n` +
        `- mcq: provide exactly 4 plausible "options"; "correct_answer" must be the EXACT text of the correct option.\n` +
        `- true_false: "options" must be ["True","False"]; "correct_answer" is "True" or "False".\n` +
        `- short_answer: "options" must be null; "correct_answer" is a concise model answer.\n` +
        `- Every question needs a clear "explanation" teaching why the answer is correct.\n` +
        (hasMaterial
          ? `- Base questions primarily on the material below; supplement with standard medical knowledge as needed.\n\n` +
            `Respond with ONLY valid JSON in this exact shape:\n` +
            `{"title": string, "questions": [{"type": "mcq"|"true_false"|"short_answer", "prompt": string, "options": string[]|null, "correct_answer": string, "explanation": string}]}\n\n` +
            `--- STUDY MATERIAL ---\n${sourceText}`
          : topicFallback +
            `\nRespond with ONLY valid JSON in this exact shape:\n` +
            `{"title": string, "questions": [{"type": "mcq"|"true_false"|"short_answer", "prompt": string, "options": string[]|null, "correct_answer": string, "explanation": string}]}`),
    },
  ];
}

export interface QuizBatchPromptInput {
  sourceText?: string | null;
  subject?: string | null;
  subjects?: string[] | null;
  customTopics?: string | null;
  difficulty: Difficulty;
  count: number;
  types: QuestionType[];
  avoidPrompts: string[];
  academicContext?: string;
}

/**
 * Like `quizMessages`, but generates a SMALL BATCH of questions so each request
 * stays free-tier safe and a truncated JSON never loses the whole quiz.
 * `avoidPrompts` steers later batches clear of earlier questions. Validated
 * against `generatedQuizSchema`.
 */
export function quizBatchMessages(input: QuizBatchPromptInput): ChatMessage[] {
  const { sourceText, subject, subjects, customTopics, difficulty, count, types, avoidPrompts, academicContext } = input;
  const typeList = types.join(", ");
  const hasMaterial = sourceText && sourceText.trim().length > 0;
  const { subjectLine, topicLine, allSubjects } = buildSubjectContext(subject, subjects, customTopics);
  const topicClause = allSubjects.length ? ` covering: ${allSubjects.join(", ")}` : "";
  const topicFallback =
    `- Draw on well-established, board-exam-relevant medical knowledge${allSubjects.length ? ` for ${allSubjects.join(", ")}` : ""}. Cover a broad range of clinically important concepts.\n` +
    (customTopics?.trim() ? `- Pay special attention to these areas: ${customTopics.trim()}.\n` : "");
  const contextBlock = academicContext ? `--- STUDENT CONTEXT ---\n${academicContext}\n\n` : "";
  const jsonShape =
    `Respond with ONLY valid JSON in this exact shape:\n` +
    `{"title": string, "questions": [{"type": "mcq"|"true_false"|"short_answer", "prompt": string, "options": string[]|null, "correct_answer": string, "explanation": string}]}`;
  const avoidBlock = avoidPrompts.length
    ? `Do NOT repeat or rephrase any of these already-created questions:\n- ${avoidPrompts.slice(0, 40).join("\n- ")}\n\n`
    : "";
  return [
    { role: "system", content: TUTOR_PERSONA },
    {
      role: "user",
      content:
        contextBlock +
        `Create exactly ${count} ${difficulty} quiz questions for a medical student` +
        topicClause +
        `. Use only these question types: ${typeList}. Distribute the types reasonably.\n` +
        subjectLine +
        topicLine +
        avoidBlock +
        `Rules:\n` +
        `- mcq: provide exactly 4 plausible "options"; "correct_answer" must be the EXACT text of the correct option.\n` +
        `- true_false: "options" must be ["True","False"]; "correct_answer" is "True" or "False".\n` +
        `- short_answer: "options" must be null; "correct_answer" is a concise model answer.\n` +
        `- Every question needs a clear "explanation" teaching why the answer is correct.\n` +
        (hasMaterial
          ? `- Base questions primarily on the material below; supplement with standard medical knowledge as needed.\n\n${jsonShape}\n\n--- STUDY MATERIAL ---\n${sourceText}`
          : `${topicFallback}\n${jsonShape}`),
    },
  ];
}

export interface StudyPlanPromptInput {
  examDate: string; // YYYY-MM-DD
  todayDate: string; // YYYY-MM-DD
  subjects: string[];
  hoursPerDay: number;
  notes?: string;
  academicContext?: string;
}

export function studyPlanMessages(input: StudyPlanPromptInput): ChatMessage[] {
  const { examDate, todayDate, subjects, hoursPerDay, notes, academicContext } = input;
  const contextBlock = academicContext ? `--- STUDENT CONTEXT ---\n${academicContext}\n\n` : "";
  return [
    { role: "system", content: TUTOR_PERSONA },
    {
      role: "user",
      content:
        contextBlock +
        `Build a realistic, day-by-day study plan for a medical student.\n` +
        `Today: ${todayDate}. Exam date: ${examDate}. Study capacity: ${hoursPerDay} hours/day.\n` +
        `Subjects to cover: ${subjects.join(", ")}.\n` +
        (notes ? `Extra context: ${notes}\n` : "") +
        `\nRequirements:\n` +
        `- Cover every subject, weighting by typical difficulty/volume.\n` +
        `- Interleave subjects and include spaced REVISION blocks of earlier topics.\n` +
        `- Include short breaks and at least one weekly CATCH-UP/buffer day.\n` +
        `- Reserve the final 2–3 days before the exam for high-yield revision and practice.\n` +
        `- Keep each day's total within the study capacity.\n\n` +
        `Respond with ONLY valid JSON in this exact shape:\n` +
        `{"title": string, "summary": string, ` +
        `"daily": [{"date": "YYYY-MM-DD", "label": string, "blocks": [{"subject": string, "activity": string, "minutes": number, "type": "study"|"revision"|"practice"|"break"|"catch_up"}]}], ` +
        `"subjectDistribution": [{"subject": string, "hours": number}], ` +
        `"tips": string[]}`,
    },
  ];
}

export interface CoachPromptInput {
  summary: string; // a compact textual snapshot of the student's recent activity
}

export function coachMessages(input: CoachPromptInput): ChatMessage[] {
  return [
    { role: "system", content: TUTOR_PERSONA },
    {
      role: "user",
      content:
        `Here is a snapshot of a medical student's recent study activity. ` +
        `Give 3–5 short, specific, encouraging coaching insights and a clear focus for tomorrow. ` +
        `Reference concrete subjects and numbers. Use Markdown bullets. Be motivating but honest.\n\n` +
        input.summary,
    },
  ];
}

export interface ExtractScheduleInput {
  text?: string;
  imageBase64?: string;
}

export function extractScheduleMessages(input: ExtractScheduleInput): ChatMessage[] {
  const content = input.text
    ? `Extract all exam/test dates and their associated subjects from this schedule document:\n\n${input.text}`
    : "Extract all exam/test dates and their associated subjects from the attached schedule image.";

  return [
    { role: "system", content: TUTOR_PERSONA },
    {
      role: "user",
      content:
        content +
        `\n\nReturn ONLY valid JSON in this shape:\n` +
        `{"subjects": string[], "examDates": [{"subject": string, "date": "YYYY-MM-DD"}], "earliestExam": "YYYY-MM-DD" | null}\n` +
        `If a year is not specified, assume the upcoming academic year. If no dates are found, return empty arrays.`,
    },
  ];
}

