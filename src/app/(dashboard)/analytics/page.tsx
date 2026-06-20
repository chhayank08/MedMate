import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAnalyticsData } from "@/lib/queries/analytics";
import { PageHeader } from "@/components/shared/page-header";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const data = await getAnalyticsData(supabase);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Track your study time, quiz accuracy, weak subjects and consistency."
      />
      <AnalyticsDashboard data={data} />
    </div>
  );
}
