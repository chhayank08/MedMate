import { z } from "zod";

export const onboardingStep1Schema = z.object({
  full_name: z.string().min(1, "Name is required.").max(120),
  college_name: z.string().min(1, "College name is required.").max(200),
  university_name: z.string().max(200).optional(),
  degree_program: z.string().min(1, "Degree program is required.").max(100),
  course: z.string().min(1, "Course is required.").max(100),
  year_of_study: z.coerce.number().int().min(1).max(10),
  semester: z.coerce.number().int().min(1).max(20).optional(),
  expected_graduation_year: z.coerce.number().int().min(2024).max(2040).optional(),
});

export const onboardingStep2Schema = z.object({
  preferred_subjects: z.array(z.string()).min(1, "Add at least one subject."),
  upcoming_exams: z.string().max(500).optional(),
  academic_goals: z.string().max(500).optional(),
});

export const onboardingStep3Schema = z.object({
  exam_date: z.string().optional(),
  daily_goal_minutes: z.coerce.number().int().min(15).max(960).optional(),
  theme: z.enum(["light", "dark", "hello-kitty", "system"]).optional(),
});

export type OnboardingStep1 = z.infer<typeof onboardingStep1Schema>;
export type OnboardingStep2 = z.infer<typeof onboardingStep2Schema>;
export type OnboardingStep3 = z.infer<typeof onboardingStep3Schema>;
