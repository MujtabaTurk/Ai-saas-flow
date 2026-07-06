"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
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
    callbackUrl?.startsWith("/admin") ? "admin" : "user"
  );
  const isAdminMode = authMode === "admin";
  const loginDescription = isAdminMode
    ? t("login.adminDescription")
    : t("login.formDescription");
  const registerUrl = buildAuthUrl(registerPath, {
    callbackUrl,
    email
  });

  return (
    <AuthLayout
      description={loginDescription}
      footer={
        isAdminMode ? (
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
      title={isAdminMode ? t("login.adminTitle") : t("login.formTitle")}
    >
      <div
        aria-label={t("login.modeSelectorLabel")}
        className="mb-4 grid grid-cols-2 gap-1 rounded-[10px] border border-[#d8dff0] bg-[#f8f9ff] p-1"
        role="group"
      >
        {[
          { label: t("login.userMode"), value: "user" },
          { label: t("login.adminMode"), value: "admin" }
        ].map((mode) => {
          const isSelected = authMode === mode.value;

          return (
            <button
              aria-pressed={isSelected}
              className={`min-h-10 rounded-[8px] px-3 text-sm font-semibold transition ${
                isSelected
                  ? "bg-white text-[#3525cd] shadow-sm ring-1 ring-[#3525cd]/15"
                  : "text-[#586377] hover:bg-white/70 hover:text-[#0b1c30]"
              }`}
              key={mode.value}
              type="button"
              onClick={() => setAuthMode(mode.value)}
            >
              {mode.label}
            </button>
          );
        })}
      </div>
      <LoginForm
        authMode={authMode}
        googleEnabled={googleEnabled}
        googleClientId={googleClientId}
        defaultCallbackUrl={isAdminMode ? "/admin" : defaultCallbackUrl}
        forgotPasswordPath={forgotPasswordPath}
      />
    </AuthLayout>
  );
}
