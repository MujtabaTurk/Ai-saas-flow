"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useAcceptTeamInvitation } from "@/features/team/hooks/use-team";

export function AcceptTeamInvitationButton({ role, token }) {
  const router = useRouter();
  const { update } = useSession();
  const acceptMutation = useAcceptTeamInvitation();

  async function acceptInvitation() {
    try {
      const result = await acceptMutation.mutateAsync(token);
      await update({
        activeBusinessId: result.business.id
      });
      router.replace("/dashboard/team");
      router.refresh();
    } catch {
      // The API message is rendered below.
    }
  }

  return (
    <div className="space-y-3">
      <Button
        className="w-full"
        disabled={acceptMutation.isPending}
        type="button"
        onClick={acceptInvitation}
      >
        {acceptMutation.isPending
          ? "Joining team..."
          : `Join as ${role.toLowerCase()}`}
      </Button>

      {acceptMutation.error ? (
        <p
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {acceptMutation.error.message}
        </p>
      ) : null}
    </div>
  );
}
