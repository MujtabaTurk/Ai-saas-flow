"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildAuthUrl } from "@/features/auth/callback-url";
import { RegisterForm } from "@/features/auth/components/register-form";
import { normalizeEmail } from "@/features/auth/normalize-email";
import { AcceptTeamInvitationButton } from "./accept-team-invitation-button";

export function TeamInvitationAcceptance({
  currentUser,
  googleEnabled = false,
  invitation,
  token
}) {
  if (!token) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-red-700">
          This invitation link is missing its token.
        </CardContent>
      </Card>
    );
  }

  if (!invitation) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-red-700">
          This invitation link is invalid or no longer exists.
        </CardContent>
      </Card>
    );
  }

  const callbackUrl = `/invite/accept?token=${encodeURIComponent(token)}`;
  const invitedEmail = invitation.email;
  const authenticatedEmail = currentUser?.email || "";
  const emailsMatch =
    Boolean(invitedEmail && authenticatedEmail) &&
    normalizeEmail(invitedEmail) === normalizeEmail(authenticatedEmail);
  const canAccept = invitation.status === "PENDING";
  const loginUrl = buildAuthUrl("/login", {
    callbackUrl,
    email: invitedEmail
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Join {invitation.business.name}</CardTitle>
          <Badge variant={canAccept ? "success" : "warning"}>
            {invitation.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">
          This invitation is for{" "}
          <span className="font-semibold text-growth-sidebar">
            {invitedEmail}
          </span>{" "}
          with the {invitation.role.toLowerCase()} role.
        </p>
        <p className="text-xs text-muted-foreground">
          Expires{" "}
          {new Intl.DateTimeFormat("en", {
            dateStyle: "medium",
            timeStyle: "short"
          }).format(new Date(invitation.expiresAt))}
        </p>

        {!canAccept ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This invitation is {invitation.status.toLowerCase()} and cannot be
            accepted.
          </p>
        ) : null}

        {canAccept && currentUser ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Signed in as{" "}
              <span className="font-semibold text-growth-sidebar">
                {authenticatedEmail}
              </span>
              .
            </p>

            {!emailsMatch ? (
              <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <p>
                  This invitation belongs to{" "}
                  <span className="font-semibold">{invitedEmail}</span>, but
                  your current account is{" "}
                  <span className="font-semibold">{authenticatedEmail}</span>.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => signOut({ callbackUrl: loginUrl })}
                >
                  Switch account
                </Button>
              </div>
            ) : (
              <AcceptTeamInvitationButton
                role={invitation.role}
                token={token}
              />
            )}
          </div>
        ) : null}

        {canAccept && !currentUser && invitation.accountExists ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              An account already exists for this email. Sign in to review and
              accept the invitation.
            </p>
            <Button asChild className="w-full">
              <Link href={loginUrl}>Sign in to continue</Link>
            </Button>
          </div>
        ) : null}

        {canAccept && !currentUser && !invitation.accountExists ? (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-growth-sidebar">
                Create your account
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Register with the invited email. Signing up creates your normal
                account session, then you can review and accept the invitation.
              </p>
            </div>
            <RegisterForm
              googleEnabled={googleEnabled}
              invitationCallbackUrl={callbackUrl}
              invitationEmail={invitedEmail}
              invitationToken={token}
            />
            <p className="text-center text-sm text-muted-foreground">
              Already have this account?{" "}
              <Link
                className="font-semibold text-primary hover:underline"
                href={loginUrl}
              >
                Sign in
              </Link>
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
