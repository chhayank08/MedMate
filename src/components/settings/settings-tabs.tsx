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
import { DomainSwitchInfo } from "@/components/domains/domain-switch-info";
import { SubjectTogglePanel } from "@/components/subjects/subject-toggle-panel";
import { useDomains } from "@/hooks/use-domains";
import { useSubscription } from "@/hooks/use-subscription";
import { useGlobalSettings } from "@/lib/stores/global-settings-store";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { UpgradeModal } from "@/components/subscription/upgrade-modal";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";

export function SettingsTabs({ userEmail }: { userEmail?: string }) {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { predefinedDomains, customDomains } = useDomains();
  const { usage, limits } = useSubscription();
  const { 
    domains: storeDomains,
    selectedDomainIds, 
    subjects,
    selectDomains, 
    toggleSubject,
    isLoading: settingsLoading,
    isInitialized
  } = useGlobalSettings();
  
  const [upgradeModal, setUpgradeModal] = useState<{ 
    isOpen: boolean; 
    limitType: string; 
    currentUsage: number; 
    currentLimit: number; 
    recommendedTier: 'pro' | 'premium' 
  } | null>(null);

  const allDomains = useMemo(() => {
    const predefined = Array.isArray(predefinedDomains) ? predefinedDomains : [];
    const custom = Array.isArray(customDomains) ? customDomains : [];
    return [...predefined, ...custom].filter(d => d?.domain_id && d?.name);
  }, [predefinedDomains, customDomains]);

  const handleDomainChange = useCallback(async (domainIds: string[]) => {
    try {
      if (!domainIds || domainIds.length === 0) {
        toast.error('You must select at least one domain');
        return;
      }

      const maxDomains = limits?.domains || 1;

      if (domainIds.length > maxDomains) {
        setUpgradeModal({
          isOpen: true,
          limitType: 'domains',
          currentUsage: usage?.domains.current || 0,
          currentLimit: maxDomains,
          recommendedTier: maxDomains === 1 ? 'pro' : 'premium'
        });
        return;
      }
      
      await selectDomains(domainIds);
      toast.success(maxDomains === 1 ? 'Domain switched successfully' : 'Domains updated successfully');
    } catch (error) {
      console.error('[SettingsTabs] Domain change error:', error);
      toast.error('Failed to update domains');
    }
  }, [limits, usage, selectDomains]);

  const handleSubjectToggle = useCallback(async (subjectId: string, enabled: boolean) => {
    try {
      await toggleSubject(subjectId, enabled);
    } catch (error) {
      console.error('[SettingsTabs] Subject toggle error:', error);
      toast.error('Failed to update subject');
    }
  }, [toggleSubject]);

  if (profileLoading || !isInitialized) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

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
            <DomainSwitchInfo isFreeUser={maxDomains === 1} />
            
            <Card>
              <CardHeader>
                <CardTitle>Learning Domains</CardTitle>
                <CardDescription>
                  {limits?.domains === 1 
                    ? 'Select your primary learning domain. You can switch anytime. Upgrade to Pro for multiple domains!'
                    : `Select up to ${limits?.domains || 1} domains you want to study.`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {settingsLoading ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <DomainSelector
                    domains={allDomains}
                    selectedDomains={selectedDomainIds}
                    onSelectionChange={handleDomainChange}
                    maxSelections={limits?.domains || 1}
                  />
                )}
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
                {settingsLoading ? (
                  <Skeleton className="h-48 w-full" />
                ) : subjects && subjects.length > 0 ? (
                  <SubjectTogglePanel
                    subjects={subjects}
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
