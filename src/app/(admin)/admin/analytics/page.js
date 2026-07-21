import { PlatformIntelligencePanel } from "@/features/analytics/components/intelligence-panel";
import { requireSuperAdminPageSession } from "@/features/admin/page-access";

export const metadata = { title: "Analytics | ServiceFlow Admin" };

export default async function AdminAnalyticsPage() {
  await requireSuperAdminPageSession();
  return <div className="space-y-6"><div><p className="text-sm font-semibold text-primary">Platform workspace</p><h1 className="text-3xl font-bold tracking-tight text-growth-sidebar">Analytics &amp; Business Insights</h1><p className="text-muted-foreground">Read-only platform performance across revenue, growth, bookings, customers, and withdrawals.</p></div><PlatformIntelligencePanel /></div>;
}
