import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppShell } from "@/components/layout/app-shell";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { getCurrentSession } from "@/lib/auth/session";

export const metadata = {
  title: "Dashboard | ServiceFlow"
};

export default async function DashboardPage() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-primary">Business workspace</p>
            <h1 className="text-3xl font-bold tracking-tight text-growth-sidebar">Dashboard</h1>
            <p className="text-muted-foreground">
              Signed in as {session.user.email}. Auth and tenant session context are active.
            </p>
          </div>
          <SignOutButton />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Session context</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
            <div>
              <span className="font-semibold text-growth-sidebar">Platform role:</span>{" "}
              <Badge>{session.user.platformRole}</Badge>
            </div>
            <div>
              <span className="font-semibold text-growth-sidebar">Business role:</span>{" "}
              <Badge>{session.user.businessRole || "None"}</Badge>
            </div>
            <div>
              <span className="font-semibold text-growth-sidebar">Active business:</span>{" "}
              {session.user.activeBusinessName || "No business selected"}
            </div>
            <div>
              <span className="font-semibold text-growth-sidebar">Business ID:</span>{" "}
              {session.user.activeBusinessId || "None"}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

