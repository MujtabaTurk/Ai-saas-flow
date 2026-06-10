import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/features/auth/permissions";
import { BusinessOnboardingForm } from "@/features/businesses/components/business-onboarding-form";
import { getCurrentSession } from "@/lib/auth/session";

export const metadata = {
  title: "Business Onboarding | ServiceFlow"
};

export default async function OnboardingPage() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (isSuperAdmin(session.user)) {
    redirect("/admin");
  }

  if (session.user.activeBusinessId) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-growth-dashboard px-6 py-10">
      <section className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-primary">Business onboarding</p>
          <h1 className="text-4xl font-bold tracking-tight text-growth-sidebar">
            Create your ServiceFlow workspace
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Set up the tenant identity, public booking URL, locale, and initial Trial subscription
            for your service business.
          </p>
        </div>

        <BusinessOnboardingForm />
      </section>
    </main>
  );
}
