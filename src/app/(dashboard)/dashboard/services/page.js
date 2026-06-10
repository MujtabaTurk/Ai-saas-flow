import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ServiceManagement } from "@/features/services/components/service-management";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Services | ServiceFlow"
};

export default async function ServicesPage() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.activeBusinessId) {
    redirect("/onboarding");
  }

  const business = await prisma.business.findUnique({
    where: {
      id: session.user.activeBusinessId
    },
    select: {
      id: true,
      name: true,
      status: true,
      currency: true
    }
  });

  if (!business) {
    redirect("/onboarding");
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-primary">{business.name}</p>
          <h1 className="text-3xl font-bold tracking-tight text-growth-sidebar">Service Management</h1>
          <p className="text-muted-foreground">
            Create, edit, delete, activate, and deactivate the services customers can book.
          </p>
        </div>

        <ServiceManagement
          businessCurrency={business.currency}
          businessId={business.id}
          isReadOnly={business.status !== "ACTIVE"}
        />
      </div>
    </AppShell>
  );
}
