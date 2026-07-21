import { WithdrawalManagement } from "@/features/admin/components/withdrawal-management";
import { requireSuperAdminPageSession } from "@/features/admin/page-access";

export const metadata = { title: "Withdrawal Requests | ServiceFlow Admin" };

export default async function AdminWithdrawalsPage() {
  await requireSuperAdminPageSession();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Platform workspace</p>
        <h1 className="text-3xl font-bold tracking-tight text-growth-sidebar">Wallet Management</h1>
        <p className="text-muted-foreground">Review and manually approve business withdrawal requests.</p>
      </div>
      <WithdrawalManagement />
    </div>
  );
}
