import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete, full_name, college_name, university_name, course, degree_program, year_of_study, semester, expected_graduation_year, preferred_subjects, exam_date, daily_goal_minutes")
    .eq("id", user.id)
    .maybeSingle();

  // Already completed → go to dashboard
  if (profile?.onboarding_complete) redirect("/dashboard");

  return <OnboardingWizard profile={profile} />;
}
