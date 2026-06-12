import { AuthLayout } from "@/features/auth/components/auth-layout";
import { TeamInvitationAcceptance } from "@/features/team/components/team-invitation-acceptance";

export const metadata = {
  title: "Team invitation | ServiceFlow"
};

export default function TeamInvitationPage() {
  return (
    <AuthLayout
      eyebrow="Team invitation"
      title="Accept your invitation"
      description="Sign in with the invited email address to join the business workspace."
    >
      <TeamInvitationAcceptance />
    </AuthLayout>
  );
}
