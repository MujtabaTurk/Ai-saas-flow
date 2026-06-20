"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  getSafeCallbackUrl
} from "@/features/auth/callback-url";
import { registerSchema } from "@/features/auth/validation/register-schema";
import { FieldError } from "./field-error";

export function RegisterForm({
  accountType = "BUSINESS",
  defaultCallbackUrl = "/onboarding",
  googleEnabled = false,
  invitationCallbackUrl = null,
  invitationEmail = null,
  invitationToken = null
}) {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
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

      router.push(result?.url || callbackUrl);
      router.refresh();
    }
  });

  function signInWithGoogle() {
    const authorizationParams = {
      prompt: "select_account"
    };

    if (initialEmail) {
      authorizationParams.login_hint = initialEmail;
    }

    return signIn("google", { callbackUrl }, authorizationParams);
  }

  return (
    <form className="space-y-4" onSubmit={formik.handleSubmit}>
      {formik.status ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formik.status}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="name">{t("register.name")}</Label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          value={formik.values.name}
          onBlur={formik.handleBlur}
          onChange={formik.handleChange}
        />
        <FieldError>{formik.touched.name && formik.errors.name}</FieldError>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t("register.email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          disabled={Boolean(invitationToken)}
          value={formik.values.email}
          onBlur={formik.handleBlur}
          onChange={formik.handleChange}
        />
        <FieldError>{formik.touched.email && formik.errors.email}</FieldError>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("register.password")}</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          value={formik.values.password}
          onBlur={formik.handleBlur}
          onChange={formik.handleChange}
        />
        <FieldError>{formik.touched.password && formik.errors.password}</FieldError>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">
          {t("register.confirmPassword")}
        </Label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          value={formik.values.confirmPassword}
          onBlur={formik.handleBlur}
          onChange={formik.handleChange}
        />
        <FieldError>{formik.touched.confirmPassword && formik.errors.confirmPassword}</FieldError>
      </div>

      <Button className="w-full" disabled={formik.isSubmitting} type="submit">
        {formik.isSubmitting
          ? t("register.submitting")
          : t("register.submit")}
      </Button>

      {googleEnabled ? (
        <Button
          className="w-full"
          type="button"
          variant="outline"
          onClick={signInWithGoogle}
        >
          {t("login.google")}
        </Button>
      ) : null}
    </form>
  );
}
