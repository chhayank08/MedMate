"use client";

import { useSearchParams } from "next/navigation";
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
import { DomainSelector } from "@/components/domains/domain-selector";
import { SubjectTogglePanel } from "@/components/subjects/subject-toggle-panel";
import { usePreferences } from "@/hooks/use-preferences";
import { useDomains } from "@/hooks/use-domains";
import { useSubscription } from "@/hooks/use-subscription";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { UpgradeModal } from "@/components/subscription/upgrade-modal";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { useState, useMemo } from "react";

export function SettingsTabs({ userEmail }: { userEmail?: string }) {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  const { data: profile, isLoading } = useProfile();
  const { preferences, updateDomains, updateSubjects } = usePreferences();
  const { predefinedDomains, customDomains } = useDomains();
  const { usage, limits } = useSubscription();
  const [upgradeModal, setUpgradeModal] = useState<{ isOpen: boolean; limitType: string; currentUsage: number; currentLimit: number; recommendedTier: 'pro' | 'premium' } | null>(null);

  const allDomains = useMemo(() => {
    const predefined = Array.isArray(predefinedDomains) ? predefinedDomains : [];
    const custom = Array.isArray(customDomains) ? customDomains : [];
    return [...predefined, ...custom].filter(d => d?.domain_id);
  }, [predefinedDomains, customDomains]);

  const selectedDomainIds = useMemo(() => {
    const prefs = preferences?.domains || [];
    return prefs.map(d => d?.domain_id).filter(Boolean) as string[];
  }, [preferences]);

  if (isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;

  const handleDomainChange = (domainIds: string[]) => {
    try {
      if (limits && domainIds.length > limits.domains) {
        setUpgradeModal({
          isOpen: true,
          limitType: 'domains',
          currentUsage: usage?.domains.current || 0,
          currentLimit: limits.domains,
          recommendedTier: limits.domains === 1 ? 'pro' : 'premium'
        });
        return;
      }
      updateDomains(domainIds);
    } catch (error) {
      console.error('[SettingsTabs] Domain change error:', error);
    }
  };

  const handleSubjectToggle = (subjectId: string, enabled: boolean) => {
    try {
      const currentSubjects = preferences?.subjects || [];
      const updated = currentSubjects.map(s => ({
        subjectId: s.subject_id,
        domainId: s.domain_id,
        enabled: s.subject_id === subjectId ? enabled : s.enabled
      }));
      updateSubjects(updated);
    } catch (error) {
      console.error('[SettingsTabs] Subject toggle error:', error);
    }
  };

  return (
    <ErrorBoundary>
      <Tabs defaultValue={tabParam || "profile"}>
        <TabsList className="mb-6 grid w-full grid-cols-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="study">Study</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="appearance">Theme</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <ErrorBoundary>
            <ProfileForm />
            <AcademicProfileForm key={profile?.id} profile={profile ?? null} />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="domains" className="space-y-6">
          <ErrorBoundary>
            <Card>
              <CardHeader>
                <CardTitle>Learning Domains</CardTitle>
                <CardDescription>
                  Select the domains you want to study. Your plan allows {limits?.domains || 1} domain(s).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DomainSelector
                  domains={allDomains}
                  selectedDomains={selectedDomainIds}
                  onSelectionChange={handleDomainChange}
                  maxSelections={limits?.domains || 1}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subjects</CardTitle>
                <CardDescription>
                  Enable subjects within your selected domains to customize your learning experience.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {preferences?.subjects && preferences.subjects.length > 0 ? (
                  <SubjectTogglePanel
                    subjects={preferences.subjects}
                    onToggle={handleSubjectToggle}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">Select a domain to enable subjects.</p>
                )}
              </CardContent>
            </Card>
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="study" className="space-y-4">
          <ErrorBoundary>
            <StudyPreferencesForm key={profile?.id} profile={profile ?? null} />
            <ReminderManager />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="ai">
          <ErrorBoundary>
            <AiPreferencesForm key={profile?.id} profile={profile ?? null} />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="account">
          <ErrorBoundary>
            <AccountSettingsForm userEmail={userEmail} />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="appearance">
          <ErrorBoundary>
            <AppearanceForm />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>

      {upgradeModal && (
        <UpgradeModal
          isOpen={upgradeModal.isOpen}
          onClose={() => setUpgradeModal(null)}
          limitType={upgradeModal.limitType}
          currentUsage={upgradeModal.currentUsage}
          currentLimit={upgradeModal.currentLimit}
          recommendedTier={upgradeModal.recommendedTier}
        />
      )}
    </ErrorBoundary>
  );
}
