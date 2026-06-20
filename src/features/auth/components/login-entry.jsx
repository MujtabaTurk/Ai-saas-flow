"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  LockKeyhole
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  buildAuthUrl,
  getSafeCallbackUrl
} from "@/features/auth/callback-url";
import { useSearchParams } from "next/navigation";
import { LoginForm } from "./login-form";

export function LoginEntry({
  googleEnabled = false,
  defaultCallbackUrl = null,
  forgotPasswordPath = "/forgot-password",
  registerPath = "/register"
}) {
  const { t } = useTranslation("auth");
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(
    searchParams.get("callbackUrl"),
    defaultCallbackUrl
  );
  const email = searchParams.get("email") || "";
  const registerUrl = buildAuthUrl(registerPath, {
    callbackUrl,
    email
  });

  return (
    <main className="relative min-h-screen overflow-hidden bg-growth-dashboard">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -start-24 -top-24 size-80 rounded-full bg-growth-mint/50 blur-3xl" />
        <div className="absolute -bottom-32 -end-20 size-96 rounded-full bg-emerald-200/40 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <Link
            className="inline-flex items-center gap-3 font-bold tracking-tight text-growth-sidebar"
            href="/"
          >
            <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-growth-sidebar text-white shadow-sm">
              <LockKeyhole className="size-5" aria-hidden="true" />
            </span>
            <span>ServiceFlow</span>
          </Link>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-14">
          <section className="order-2 mx-auto max-w-xl lg:order-1 lg:mx-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-growth-border bg-white/75 px-4 py-2 text-sm font-semibold text-growth-forest shadow-sm backdrop-blur">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              {t("login.heroEyebrow")}
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-growth-sidebar sm:text-5xl lg:text-6xl">
              {t("login.heroTitle")}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
              {t("login.heroDescription")}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                "login.heroPointWorkspace",
                "login.heroPointOperations",
                "login.heroPointSecurity"
              ].map((key) => (
                <div
                  key={key}
                  className="flex items-center gap-3 text-sm font-medium text-growth-sidebar"
                >
                  <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-growth-mint/60 text-growth-forest">
                    <CheckCircle2
                      className="size-4"
                      aria-hidden="true"
                    />
                  </span>
                  {t(key)}
                </div>
              ))}
            </div>
          </section>

          <section className="order-1 mx-auto w-full max-w-lg lg:order-2">
            <div className="rounded-[2rem] border border-white/80 bg-white/95 p-5 shadow-[0_24px_80px_-32px_rgba(6,78,59,0.35)] backdrop-blur sm:p-8">
              <div className="flex min-h-12 items-center gap-3 rounded-2xl bg-growth-dashboard px-4 text-sm font-semibold text-growth-sidebar">
                <span className="inline-flex size-8 items-center justify-center rounded-xl bg-white text-growth-forest shadow-sm">
                  <LockKeyhole className="size-4" aria-hidden="true" />
                </span>
                {t("login.formEyebrow")}
              </div>

              <div className="pt-7">
                <div className="mb-6 space-y-2">
                  <p className="text-sm font-semibold text-primary">
                    {t("login.eyebrow")}
                  </p>
                  <h2 className="text-2xl font-bold tracking-tight text-growth-sidebar sm:text-3xl">
                    {t("login.formTitle")}
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t("login.formDescription")}
                  </p>
                </div>

                <LoginForm
                  googleEnabled={googleEnabled}
                  defaultCallbackUrl={defaultCallbackUrl}
                  forgotPasswordPath={forgotPasswordPath}
                />

                <div className="mt-6 border-t border-growth-border pt-5 text-center text-sm text-muted-foreground">
                  <p>
                    {t("login.newUser")}{" "}
                    <Link
                      className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                      href={registerUrl}
                    >
                      {t("login.createAccount")}
                      <ArrowRight
                        className="size-3.5 rtl:rotate-180"
                        aria-hidden="true"
                      />
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
