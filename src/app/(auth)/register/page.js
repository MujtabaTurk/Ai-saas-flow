import Link from "next/link";
import { AuthLayout } from "@/features/auth/components/auth-layout";
import { RegisterForm } from "@/features/auth/components/register-form";
import {
  getServerTranslator,
  resolveRequestLanguage
} from "@/i18n/server";

export const metadata = {
  title: "Register | ServiceFlow"
};

export default async function RegisterPage() {
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
          <Link className="font-semibold text-primary hover:underline" href="/login">
            {t("register.signIn")}
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
}
