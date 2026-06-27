import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DesktopSidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { ReminderScheduler } from "@/components/dashboard/reminder-scheduler";
import { HKBanner } from "@/components/shared/hk-decorations";
import { HKBackground } from "@/components/shared/hk-background";
import { BatBanner } from "@/components/shared/bat-decorations";
import { BatBackground } from "@/components/shared/bat-background";
import { ErrorBoundary } from "@/components/shared/error-boundary";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The proxy already guards these routes, but verify defensively.
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // Redirect new users to onboarding before letting them into the dashboard
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (profile && (profile as any).onboarding_complete === false) {
    redirect("/onboarding");
  }

  const name = profile?.full_name ?? (user.user_metadata?.full_name as string | undefined);
  const email = profile?.email ?? user.email;
  const avatarUrl =
    profile?.avatar_url ?? (user.user_metadata?.avatar_url as string | undefined);

  return (
    <div className="flex min-h-dvh">
      <HKBackground />
      <BatBackground />
      <DesktopSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <HKBanner />
        <BatBanner />
        <Topbar name={name} email={email} avatarUrl={avatarUrl} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>
      </div>
      <ReminderScheduler />
    </div>
  );
}
