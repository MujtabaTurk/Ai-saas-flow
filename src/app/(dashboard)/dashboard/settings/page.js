import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppShell } from "@/components/layout/app-shell";
import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Settings | ServiceFlow"
};

export default async function SettingsPage() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (!session.user.activeBusinessId && session.user.platformRole !== "SUPER_ADMIN") {
    redirect("/onboarding");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id
    },
    select: {
      name: true,
      email: true,
      platformRole: true,
      passwordHash: true
    }
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-primary">
            {session.user.activeBusinessName || "Account"}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-growth-sidebar">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage account security and authenticated session context.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Card id="profile">
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                <span className="font-semibold text-growth-sidebar">Name:</span>{" "}
                {user?.name || "Not set"}
              </p>
              <p>
                <span className="font-semibold text-growth-sidebar">Email:</span>{" "}
                {user?.email || "Not set"}
              </p>
              <p>
                <span className="font-semibold text-growth-sidebar">Platform role:</span>{" "}
                <Badge>{user?.platformRole || session.user.platformRole}</Badge>
              </p>
              <p>
                <span className="font-semibold text-growth-sidebar">Business role:</span>{" "}
                <Badge>{session.user.businessRole || "None"}</Badge>
              </p>
              <p>
                <span className="font-semibold text-growth-sidebar">Password login:</span>{" "}
                {user?.passwordHash ? "Enabled" : "OAuth only"}
              </p>
            </CardContent>
          </Card>

          <Card id="account">
            <CardHeader>
              <CardTitle>Change password</CardTitle>
              <p className="text-sm text-muted-foreground">
                Password changes require your current password. OAuth-only accounts can use password reset after adding a password flow.
              </p>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
