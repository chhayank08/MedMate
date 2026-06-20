import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export interface AcademicProfile {
  college_name: string | null;
  university_name: string | null;
  degree_program: string | null;
  course: string | null;
  year_of_study: number | null;
  semester: number | null;
  expected_graduation_year: number | null;
}

export async function getAcademicProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<AcademicProfile | null> {
  const { data } = await supabase
    .from("profiles")
    .select(
      "college_name, university_name, degree_program, course, year_of_study, semester, expected_graduation_year",
    )
    .eq("id", userId)
    .maybeSingle();
  return data ?? null;
}

/** Returns a compact context block injected into AI prompts, or "" when no fields are filled. */
export function academicContext(p: AcademicProfile | null): string {
  if (!p) return "";

  const parts: string[] = [];
  if (p.degree_program || p.course) {
    const deg = [p.degree_program, p.course].filter(Boolean).join(" — ");
    parts.push(`Degree: ${deg}`);
  }
  if (p.year_of_study != null) parts.push(`Year ${p.year_of_study}`);
  if (p.semester != null) parts.push(`Semester ${p.semester}`);
  if (p.college_name) parts.push(`College: ${p.college_name}`);
  if (p.university_name) parts.push(`University: ${p.university_name}`);

  if (parts.length === 0) return "";

  return (
    `Student context — ${parts.join("; ")}. ` +
    `Tailor depth, terminology, difficulty and high-yield focus to this level and to the ` +
    (p.university_name ? `${p.university_name} ` : "") +
    `curriculum and typical exam patterns.`
  );
}
