import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { WEAK_SUBJECT_ACCURACY_THRESHOLD } from "@/lib/constants";

type DB = SupabaseClient<Database>;

/**
 * Recomputes a subject's rolled-up analytics from the user's quiz attempts and
 * flags it weak below the accuracy threshold. Called after each quiz attempt so
 * the dashboard "weak subjects" widget stays current.
 */
export async function refreshSubjectAnalytics(
  supabase: DB,
  userId: string,
  subject: string | null | undefined,
) {
  if (!subject) return;

  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("id")
    .eq("subject", subject);
  const ids = (quizzes ?? []).map((q) => q.id);
  if (!ids.length) return;

  const { data: attempts } = await supabase
    .from("quiz_attempts")
    .select("accuracy")
    .in("quiz_id", ids);
  const accs = (attempts ?? []).map((a) => Number(a.accuracy));
  const avg = accs.length ? accs.reduce((s, n) => s + n, 0) / accs.length : null;

  await supabase.from("subject_analytics").upsert(
    {
      user_id: userId,
      subject,
      domain_id: null,
      subject_id: null,
      accuracy: avg,
      study_minutes: 0,
      quiz_count: accs.length,
      last_studied: new Date().toISOString(),
      is_weak: avg != null && avg < WEAK_SUBJECT_ACCURACY_THRESHOLD,
    },
    { onConflict: "user_id,subject" },
  );
}
