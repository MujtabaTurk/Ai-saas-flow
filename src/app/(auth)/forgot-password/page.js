import Link from "next/link";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import {
  getServerTranslator,
  resolveRequestLanguage
} from "@/i18n/server";

export const metadata = {
  title: "Forgot Password | ServiceFlow"
};

export default async function ForgotPasswordPage() {
  const language = await resolveRequestLanguage();
  const t = await getServerTranslator(language, "auth");

  return (
    <AuthLayout
      eyebrow={t("forgotPassword.eyebrow")}
      title={t("forgotPassword.title")}
      description={t("forgotPassword.description")}
      footer={
        <Link className="font-semibold text-primary hover:underline" href="/login">
          {t("forgotPassword.back")}
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
