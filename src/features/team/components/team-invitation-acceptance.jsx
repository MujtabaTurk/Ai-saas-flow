"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useAcceptTeamInvitation,
  useTeamInvitation
} from "@/features/team/hooks/use-team";

export function TeamInvitationAcceptance() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const callbackUrl = `/invite/accept?token=${encodeURIComponent(token)}`;
  const { status, update } = useSession();
  const invitationQuery = useTeamInvitation(token);
  const acceptMutation = useAcceptTeamInvitation();
  const invitation = invitationQuery.data?.invitation;

  async function acceptInvitation() {
    try {
      await acceptMutation.mutateAsync(token);
      await update();
      router.push("/dashboard/team");
      router.refresh();
    } catch {
      // The mutation error is rendered below.
    }
  }

  if (!token) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-red-700">
          This invitation link is missing its token.
        </CardContent>
      </Card>
    );
  }

  if (invitationQuery.isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Loading invitation...
        </CardContent>
      </Card>
    );
  }

  if (invitationQuery.error) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-red-700">
          {invitationQuery.error.message}
        </CardContent>
      </Card>
    );
  }

  const canAccept = invitation?.status === "PENDING";

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
            {invitation.email}
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

        {status === "unauthenticated" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild>
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              >
                Sign in to accept
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link
                href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              >
                Create account
              </Link>
            </Button>
          </div>
        ) : (
          <Button
            className="w-full"
            disabled={!canAccept || acceptMutation.isPending}
            onClick={acceptInvitation}
          >
            {acceptMutation.isPending
              ? "Joining team..."
              : `Join as ${invitation.role.toLowerCase()}`}
          </Button>
        )}

        {acceptMutation.error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {acceptMutation.error.message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
