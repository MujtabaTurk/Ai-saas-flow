import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { RegisterForm } from "@/features/auth/components/register-form";
import { isGoogleProviderEnabled } from "@/features/auth/auth-options";
import {
  buildAuthUrl,
  getSafeCallbackUrl
} from "@/features/auth/callback-url";
import {
  getServerTranslator,
  resolveRequestLanguage
} from "@/i18n/server";
import {
  expireTeamInvitationIfNeeded,
  findTeamInvitationByToken
} from "@/features/team/invitation-access";

export const metadata = {
  title: "Register | ServiceFlow"
};

export default async function RegisterPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const requestedCallbackUrl = getSafeCallbackUrl(
    resolvedSearchParams?.callbackUrl
  );
  const invitationToken =
    typeof resolvedSearchParams?.invitationToken === "string"
      ? resolvedSearchParams.invitationToken
      : null;
  let callbackUrl = requestedCallbackUrl;
  let email =
    typeof resolvedSearchParams?.email === "string"
      ? resolvedSearchParams.email
      : null;

  if (invitationToken) {
    const foundInvitation = await findTeamInvitationByToken(
      invitationToken,
      {
        id: true,
        email: true,
        status: true,
        expiresAt: true
      }
    );

    if (!foundInvitation) {
      redirect(
        `/invite/accept?token=${encodeURIComponent(invitationToken)}`
      );
    }

    const invitation = await expireTeamInvitationIfNeeded(foundInvitation);

    if (invitation.status !== "PENDING") {
      redirect(
        `/invite/accept?token=${encodeURIComponent(invitationToken)}`
      );
    }

    email = invitation.email;
    callbackUrl =
      `/invite/accept?token=${encodeURIComponent(invitationToken)}`;
  }

  const language = await resolveRequestLanguage();
  const t = await getServerTranslator(language, "auth");

  return (
    <AuthLayout
      eyebrow={t("register.eyebrow")}
      title={t("register.title")}
      description={t("register.description")}
      footer={
        <>
          {t("register.alreadyUser")}{" "}
          <Link
            className="font-semibold text-primary hover:underline"
            href={buildAuthUrl("/login", { callbackUrl, email })}
          >
            {t("register.signIn")}
          </Link>
        </>
      }
    >
      <RegisterForm
        googleEnabled={isGoogleProviderEnabled}
        invitationCallbackUrl={invitationToken ? callbackUrl : null}
        invitationEmail={invitationToken ? email : null}
        invitationToken={invitationToken}
      />
    </AuthLayout>
  );
}
