import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { SubscriptionPlans } from "@/components/subscription/subscription-plans";

export const metadata: Metadata = { 
  title: "Subscription",
  description: "Choose the perfect plan for your study needs"
};

export default async function SubscriptionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader 
        title="Subscription Plans" 
        description="Choose the perfect plan for your study needs. Upgrade anytime, cancel anytime." 
      />
      <SubscriptionPlans userId={user?.id} />
    </div>
  );
}
