import Link from "next/link";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { LoginForm } from "@/features/auth/components/login-form";
import { isGoogleProviderEnabled } from "@/features/auth/auth-options";
import {
  getServerTranslator,
  resolveRequestLanguage
} from "@/i18n/server";

export const metadata = {
  title: "Login | ServiceFlow"
};

export default async function LoginPage() {
  const language = await resolveRequestLanguage();
  const t = await getServerTranslator(language, "auth");

  return (
    <AuthLayout
      eyebrow={t("login.eyebrow")}
      title={t("login.title")}
      description={t("login.description")}
      footer={
        <>
          {t("login.newUser")}{" "}
          <Link className="font-semibold text-primary hover:underline" href="/register">
            {t("login.createAccount")}
          </Link>
        </>
      }
    >
      <LoginForm googleEnabled={isGoogleProviderEnabled} />
    </AuthLayout>
  );
}
