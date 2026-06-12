import Link from "next/link";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import {
  getServerTranslator,
  resolveRequestLanguage
} from "@/i18n/server";

export const metadata = {
  title: "Reset Password | ServiceFlow"
};

export default async function ResetPasswordPage() {
  const language = await resolveRequestLanguage();
  const t = await getServerTranslator(language, "auth");

  return (
    <AuthLayout
      eyebrow={t("resetPassword.eyebrow")}
      title={t("resetPassword.title")}
      description={t("resetPassword.description")}
      footer={
        <Link className="font-semibold text-primary hover:underline" href="/login">
          {t("resetPassword.back")}
        </Link>
      }
    >
      <ResetPasswordForm />
    </AuthLayout>
  );
}
