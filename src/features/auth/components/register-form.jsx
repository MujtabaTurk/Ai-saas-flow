"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import { ArrowRight, LockKeyhole, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  getSafeNavigationUrl,
  getSafeCallbackUrl
} from "@/features/auth/callback-url";
import { registerSchema } from "@/features/auth/validation/register-schema";
import { FieldError } from "./field-error";
import { GoogleSignInButton } from "./google-sign-in-button";

const authInputClassName =
  "h-11 rounded-[8px] border-[#c7c4d8] bg-white text-[#0b1c30] shadow-none placeholder:text-[#9aa3b2] focus-visible:ring-[#3525cd]/25 lg:h-10";

function AuthInputIcon({ icon: Icon }) {
  return (
    <Icon
      className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-[#8a93a6]"
      aria-hidden="true"
    />
  );
}

export function RegisterForm({
  accountType = "BUSINESS",
  defaultCallbackUrl = "/onboarding",
  googleEnabled = false,
  googleClientId = null,
  invitationCallbackUrl = null,
  invitationEmail = null,
  invitationToken = null
}) {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const callbackUrl =
    invitationCallbackUrl ||
    getSafeCallbackUrl(
      searchParams.get("callbackUrl"),
      defaultCallbackUrl
    );
  const initialEmail =
    invitationEmail || searchParams.get("email") || "";
  const formik = useFormik({
    initialValues: {
      name: "",
      email: initialEmail,
      password: "",
      confirmPassword: "",
      invitationToken: invitationToken || undefined,
      accountType
    },
    validationSchema: registerSchema,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(null);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });
      const payload = await response.json();

      if (!response.ok) {
        helpers.setStatus(payload?.error?.message || t("register.error"));
        helpers.setErrors(payload?.error?.details || {});
        return;
      }

      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
        callbackUrl
      });

      if (result?.error) {
        helpers.setStatus(
          "Your account was created, but automatic sign-in failed. Please sign in to continue."
        );
        return;
      }

      router.push(getSafeNavigationUrl(result?.url, callbackUrl));
      router.refresh();
    }
  });

  async function signInWithGoogle() {
    if (formik.isSubmitting || isOAuthLoading) {
      return null;
    }

    const authorizationParams = {
      prompt: "select_account"
    };

    if (initialEmail) {
      authorizationParams.login_hint = initialEmail;
    }

    setIsOAuthLoading(true);
    const result = await signIn("google", { callbackUrl }, authorizationParams);

    if (result?.error) {
      setIsOAuthLoading(false);
    }

    return result;
  }

  return (
    <form
      className="w-full space-y-4"
      onSubmit={formik.handleSubmit}
    >
      {formik.status ? (
        <div
          aria-live="polite"
          className="rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-700"
          role="alert"
        >
          {formik.status}
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-sm font-semibold text-[#0b1c30]" htmlFor="name">
            {t("register.name")}
          </Label>
          <div className="relative">
            <AuthInputIcon icon={User} />
            <Input
              aria-describedby={
                formik.touched.name && formik.errors.name
                  ? "name-error"
                  : undefined
              }
              aria-invalid={Boolean(formik.touched.name && formik.errors.name)}
              autoComplete="name"
              className={`${authInputClassName} ps-10`}
              disabled={formik.isSubmitting || isOAuthLoading}
              id="name"
              name="name"
              placeholder="Your name"
              value={formik.values.name}
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
            />
          </div>
          <FieldError className="text-xs" id="name-error">
            {formik.touched.name && formik.errors.name}
          </FieldError>
        </div>

        <div className="space-y-1">
          <Label className="text-sm font-semibold text-[#0b1c30]" htmlFor="email">
            Email Address
          </Label>
          <div className="relative">
            <AuthInputIcon icon={Mail} />
            <Input
              aria-describedby={
                formik.touched.email && formik.errors.email
                  ? "register-email-error"
                  : undefined
              }
              aria-invalid={Boolean(formik.touched.email && formik.errors.email)}
              autoComplete="email"
              className={`${authInputClassName} ps-10`}
              disabled={Boolean(invitationToken) || formik.isSubmitting || isOAuthLoading}
              id="email"
              name="email"
              placeholder="name@company.com"
              type="email"
              value={formik.values.email}
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
            />
          </div>
          <FieldError className="text-xs" id="register-email-error">
            {formik.touched.email && formik.errors.email}
          </FieldError>
        </div>

        <div className="space-y-1">
          <Label className="text-sm font-semibold text-[#0b1c30]" htmlFor="password">
            {t("register.password")}
          </Label>
          <PasswordInput
            aria-describedby={
              formik.touched.password && formik.errors.password
                ? "register-password-error"
                : undefined
            }
            aria-invalid={Boolean(formik.touched.password && formik.errors.password)}
            autoComplete="new-password"
            className={authInputClassName}
            disabled={formik.isSubmitting || isOAuthLoading}
            id="password"
            leadingIcon={LockKeyhole}
            name="password"
            placeholder="Create a password"
            value={formik.values.password}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError className="text-xs" id="register-password-error">
            {formik.touched.password && formik.errors.password}
          </FieldError>
        </div>

        <div className="space-y-1">
          <Label
            className="text-sm font-semibold text-[#0b1c30]"
            htmlFor="confirmPassword"
          >
            {t("register.confirmPassword")}
          </Label>
          <PasswordInput
            aria-describedby={
              formik.touched.confirmPassword && formik.errors.confirmPassword
                ? "confirm-password-error"
                : undefined
            }
            aria-invalid={Boolean(
              formik.touched.confirmPassword && formik.errors.confirmPassword
            )}
            autoComplete="new-password"
            className={authInputClassName}
            disabled={formik.isSubmitting || isOAuthLoading}
            id="confirmPassword"
            leadingIcon={LockKeyhole}
            name="confirmPassword"
            placeholder="Confirm password"
            value={formik.values.confirmPassword}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError className="text-xs" id="confirm-password-error">
            {formik.touched.confirmPassword && formik.errors.confirmPassword}
          </FieldError>
        </div>
      </div>

      <Button
        className="h-11 w-full rounded-[8px] bg-[#3525cd] text-sm font-semibold text-white shadow-none hover:bg-[#2f22b6] focus-visible:ring-[#3525cd]/35 lg:h-10"
        disabled={formik.isSubmitting || isOAuthLoading}
        isLoading={formik.isSubmitting}
        loadingLabel={t("register.submitting")}
        type="submit"
      >
        {t("register.submit")}
        {!formik.isSubmitting ? (
          <ArrowRight className="ms-2 size-4" aria-hidden="true" />
        ) : null}
      </Button>

      {googleEnabled && googleClientId ? (
        <div className="space-y-3">
          <div className="relative flex h-7 items-center justify-center text-xs uppercase tracking-[0.1em] text-[#8a93a6]">
            <span className="absolute inset-x-0 top-1/2 h-px bg-[#e3e7ef]" />
            <span className="relative bg-white px-4">
              Or continue with
            </span>
          </div>
          <GoogleSignInButton
            className="max-w-none"
            clientId={googleClientId}
            disabled={formik.isSubmitting || isOAuthLoading}
            isLoading={isOAuthLoading}
            onClick={signInWithGoogle}
          />
        </div>
      ) : null}
    </form>
  );
}
