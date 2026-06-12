import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { isSuperAdmin } from "@/features/auth/permissions";
import { CustomerProfile } from "@/features/customers/components/customer-profile";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Customer Profile | ServiceFlow"
};

export default async function CustomerProfilePage({ params }) {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.activeBusinessId) {
    redirect("/onboarding");
  }

  const [{ customerId }, business] = await Promise.all([
    params,
    prisma.business.findUnique({
      where: {
        id: session.user.activeBusinessId
      },
      select: {
        id: true,
        status: true,
        timezone: true,
        locale: true
      }
    })
  ]);

  if (!business) {
    redirect("/onboarding");
  }

  return (
    <AppShell>
      <CustomerProfile
        businessId={business.id}
        businessLocale={business.locale}
        businessTimezone={business.timezone}
        customerId={customerId}
        isReadOnly={
          business.status !== "ACTIVE" && !isSuperAdmin(session.user)
        }
      />
    </AppShell>
  );
}
