import { FinanceCenter } from "@/features/admin/components/finance-center";
import { getFinanceOverview } from "@/features/admin/finance";
import { requireSuperAdminPageSession } from "@/features/admin/page-access";

export const metadata = { title: "Finance | ServiceFlow Admin" };

export default async function AdminFinancePage() {
  await requireSuperAdminPageSession();
  const finance = await getFinanceOverview();
  return <div className="space-y-6"><div><p className="text-sm font-semibold text-primary">Platform workspace</p><h1 className="text-3xl font-bold tracking-tight text-growth-sidebar">Finance</h1><p className="text-muted-foreground">Monitor balances, payouts, liabilities, and revenue.</p></div><FinanceCenter initialData={finance} /></div>;
}
