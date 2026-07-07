"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Building2, ShieldCheck } from "lucide-react";
import {
  buildAuthUrl,
  getSafeCallbackUrl
} from "@/features/auth/callback-url";
import { useSearchParams } from "next/navigation";
import { AuthLayout } from "./auth-layout";
import { LoginForm } from "./login-form";

export function LoginEntry({
  googleEnabled = false,
  googleClientId = null,
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
  const [authMode, setAuthMode] = useState(
    callbackUrl?.startsWith("/admin") ? "super-admin" : "business"
  );
  const isSuperAdminMode = authMode === "super-admin";
  const loginDescription = isSuperAdminMode
    ? t("login.adminDescription")
    : t("login.formDescription");
  const registerUrl = buildAuthUrl(registerPath, {
    callbackUrl,
    email
  });
  const loginModes = [
    {
      description: t("login.businessModeDescription"),
      icon: Building2,
      label: t("login.userMode"),
      value: "business"
    },
    {
      description: t("login.superAdminModeDescription"),
      icon: ShieldCheck,
      label: t("login.adminMode"),
      value: "super-admin"
    }
  ];

  return (
    <AuthLayout
      description={loginDescription}
      footer={
        isSuperAdminMode ? (
          <p>{t("login.adminFooter")}</p>
        ) : (
          <p>
            {t("login.newUser")}{" "}
            <Link
              className="font-semibold text-[#3525cd] transition-colors hover:text-[#2f22b6] hover:underline"
              href={registerUrl}
            >
              {t("login.createAccount")}
            </Link>
          </p>
        )
      }
      title={isSuperAdminMode ? t("login.adminTitle") : t("login.formTitle")}
    >
      <div
        aria-label={t("login.modeSelectorLabel")}
        className="mb-4 grid gap-2 sm:grid-cols-2"
        role="group"
      >
        {loginModes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = authMode === mode.value;
          const isPlatformMode = mode.value === "super-admin";

          return (
            <button
              aria-pressed={isSelected}
              className={`min-h-[76px] rounded-[8px] border px-3 py-3 text-start transition ${
                isSelected && isPlatformMode
                  ? "border-[#f59e0b] bg-[#fff7ed] text-[#7c2d12] shadow-sm ring-1 ring-[#f59e0b]/25"
                  : isSelected
                    ? "border-[#3525cd] bg-[#f8f9ff] text-[#3525cd] shadow-sm ring-1 ring-[#3525cd]/15"
                    : isPlatformMode
                      ? "border-[#f6c56d] bg-white text-[#7c2d12] hover:bg-[#fff7ed]"
                      : "border-[#d8dff0] bg-white text-[#0b1c30] hover:bg-[#f8f9ff]"
              }`}
              key={mode.value}
              type="button"
              onClick={() => setAuthMode(mode.value)}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span>{mode.label}</span>
              </span>
              <span className="mt-1 block text-xs font-medium leading-4 text-[#586377]">
                {mode.description}
              </span>
            </button>
          );
        })}
      </div>
      <LoginForm
        authMode={authMode}
        googleEnabled={googleEnabled}
        googleClientId={googleClientId}
        defaultCallbackUrl={isSuperAdminMode ? "/admin" : defaultCallbackUrl}
        forgotPasswordPath={forgotPasswordPath}
      />
    </AuthLayout>
  );
}
