"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildAuthUrl } from "@/features/auth/callback-url";
import { normalizeEmail } from "@/features/auth/normalize-email";
import { AcceptTeamInvitationButton } from "./accept-team-invitation-button";

export function TeamInvitationAcceptance({
  currentUser,
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
  const registerUrl = buildAuthUrl("/register", {
    callbackUrl,
    email: invitedEmail,
    invitationToken: token
  });
  const roleLabel = invitation.role.toLowerCase();
  const expiresAt = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(invitation.expiresAt));

  return (
    <Card className="overflow-hidden border-[#c7c4d8] bg-white shadow-[0_20px_60px_-45px_rgba(11,28,48,0.45)]">
      <CardHeader className="space-y-4 p-5 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-[#3525cd] text-base font-bold text-white">
              {invitation.business.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#3525cd]">
                Workspace invitation
              </p>
              <CardTitle className="mt-1 truncate text-2xl font-bold leading-8 text-[#0b1c30]">
                Join {invitation.business.name}
              </CardTitle>
            </div>
          </div>
          <Badge variant={canAccept ? "success" : "warning"}>
            {invitation.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-5 pt-0">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[8px] border border-[#d8dff0] bg-[#f8f9ff] p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#586377]">
              Invited email
            </p>
            <p className="mt-1 break-words text-sm font-semibold text-[#0b1c30]">
              {invitedEmail}
            </p>
          </div>
          <div className="rounded-[8px] border border-[#d8dff0] bg-[#f8f9ff] p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#586377]">
              Role
            </p>
            <p className="mt-1 text-sm font-semibold capitalize text-[#0b1c30]">
              {roleLabel}
            </p>
          </div>
        </div>

        <p className="text-xs font-medium text-[#586377]">
          This invitation expires {expiresAt}.
        </p>

        {!canAccept ? (
          <p className="rounded-[8px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This invitation is {invitation.status.toLowerCase()} and cannot be
            accepted.
          </p>
        ) : null}

        {canAccept && currentUser ? (
          <div className="space-y-3">
            <p className="rounded-[8px] border border-[#d8dff0] bg-white px-4 py-3 text-sm text-[#586377]">
              Signed in as{" "}
              <span className="font-semibold text-[#0b1c30]">
                {authenticatedEmail}
              </span>
              .
            </p>

            {!emailsMatch ? (
              <div className="space-y-3 rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
          <div className="space-y-3 rounded-[8px] border border-[#d8dff0] bg-[#f8f9ff] p-4">
            <p className="text-sm text-[#586377]">
              An account already exists for this email. Sign in to review and
              accept the invitation.
            </p>
            <Button asChild className="w-full">
              <Link href={loginUrl}>Sign in to continue</Link>
            </Button>
          </div>
        ) : null}

        {canAccept && !currentUser && !invitation.accountExists ? (
          <div className="space-y-3 rounded-[8px] border border-[#d8dff0] bg-[#f8f9ff] p-4">
            <div className="space-y-1">
              <h3 className="font-semibold text-[#0b1c30]">
                Create your account
              </h3>
              <p className="text-sm leading-6 text-[#586377]">
                Register with the invited email, then return here to accept the
                workspace invitation.
              </p>
            </div>
            <Button asChild className="w-full">
              <Link href={registerUrl}>Create account to accept</Link>
            </Button>
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
