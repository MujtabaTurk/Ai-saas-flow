import { AuthLayout } from "@/features/auth/components/auth-layout";
import { TeamInvitationAcceptance } from "@/features/team/components/team-invitation-acceptance";
import { getPublicTeamInvitation } from "@/features/team/invitation-access";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Team invitation | ServiceFlow"
};

export default async function TeamInvitationPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const token =
    typeof resolvedSearchParams?.token === "string"
      ? resolvedSearchParams.token
      : "";
  const invitation = token
    ? await getPublicTeamInvitation(token)
    : null;
  let currentUser = null;

  // Invitation validation intentionally happens before session inspection.
  if (invitation) {
    const session = await getCurrentSession();

    if (session?.user?.id) {
      currentUser = await prisma.user.findUnique({
        where: {
          id: session.user.id
        },
        select: {
          id: true,
          email: true,
          name: true
        }
      });
    }
  }

  return (
    <AuthLayout
      eyebrow="Team invitation"
      title="Accept your invitation"
      description="Sign in with the invited email address to join the business workspace."
    >
      <TeamInvitationAcceptance
        currentUser={currentUser}
        invitation={invitation}
        token={token}
      />
    </AuthLayout>
  );
}
