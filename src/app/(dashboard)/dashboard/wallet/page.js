import { WalletDashboard } from "@/features/wallet/components/wallet-dashboard";
import { isBusinessOwner } from "@/features/auth/permissions";
import { requireDashboardPageBusiness } from "@/lib/auth/dashboard-page";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Wallet | ServiceFlow"
};

export default async function WalletPage() {
  const { business, session } = await requireDashboardPageBusiness({
    requireBusinessManager: true,
    select: {
      id: true,
      name: true
    }
  });

  if (!isBusinessOwner(session.user)) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">{business.name}</p>
        <h1 className="text-3xl font-bold tracking-tight text-growth-sidebar">
          Wallet
        </h1>
        <p className="text-muted-foreground">
          View your business credit balances.
        </p>
      </div>
      <WalletDashboard />
    </div>
  );
}
