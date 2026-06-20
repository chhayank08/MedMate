"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileForm } from "@/components/settings/profile-form";
import { AcademicProfileForm } from "@/components/settings/academic-profile-form";
import { StudyPreferencesForm } from "@/components/settings/study-preferences-form";
import { ReminderManager } from "@/components/shared/reminder-manager";
import { AiPreferencesForm } from "@/components/settings/ai-preferences-form";
import { AccountSettingsForm } from "@/components/settings/account-settings-form";
import { AppearanceForm } from "@/components/settings/appearance-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/use-profile";

export function SettingsTabs({ userEmail }: { userEmail?: string }) {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;

  return (
    <Tabs defaultValue="profile">
      <TabsList className="mb-6 grid w-full grid-cols-5">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="study">Study</TabsTrigger>
        <TabsTrigger value="ai">AI</TabsTrigger>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="appearance">Theme</TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-4">
        <ProfileForm />
        <AcademicProfileForm key={profile?.id} profile={profile ?? null} />
      </TabsContent>

      <TabsContent value="study" className="space-y-4">
        <StudyPreferencesForm key={profile?.id} profile={profile ?? null} />
        <ReminderManager />
      </TabsContent>

      <TabsContent value="ai">
        <AiPreferencesForm key={profile?.id} profile={profile ?? null} />
      </TabsContent>

      <TabsContent value="account">
        <AccountSettingsForm userEmail={userEmail} />
      </TabsContent>

      <TabsContent value="appearance">
        <AppearanceForm />
      </TabsContent>
    </Tabs>
  );
}
