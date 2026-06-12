import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { AiAssistantManagement } from "@/features/ai/components/ai-assistant-management";
import { isSuperAdmin } from "@/features/auth/permissions";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "AI Assistant | ServiceFlow"
};

export default async function AiAssistantPage() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.activeBusinessId) {
    redirect("/onboarding");
  }

  if (
    !isSuperAdmin(session.user) &&
    !["OWNER", "ADMIN"].includes(session.user.businessRole)
  ) {
    redirect("/dashboard/bookings");
  }

  const business = await prisma.business.findUnique({
    where: {
      id: session.user.activeBusinessId
    },
    select: {
      id: true,
      name: true,
      status: true,
      timezone: true
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
          <h1 className="text-3xl font-bold tracking-tight text-growth-sidebar">
            AI Assistant
          </h1>
          <p className="text-muted-foreground">
            Generate metered drafts, review them, and explicitly approve content
            before it is copied or applied.
          </p>
        </div>
        <AiAssistantManagement
          businessId={business.id}
          businessTimezone={business.timezone}
          isReadOnly={
            business.status !== "ACTIVE" && !isSuperAdmin(session.user)
          }
        />
      </div>
    </AppShell>
  );
}
