"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  buildPostLoginUrl,
  getSafeCallbackUrl
} from "@/features/auth/callback-url";
import { loginSchema } from "@/features/auth/validation/login-schema";
import { FieldError } from "./field-error";

const REMEMBERED_EMAIL_KEY = "serviceflow_remembered_login_email";

function getAuthenticationError(error, t) {
  if (error === "OAuthAccountNotLinked") {
    return t("login.oauthAccountNotLinked");
  }

  if (error) {
    return t("login.authenticationError");
  }

  return null;
}

export function LoginForm({ googleEnabled = false }) {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const rememberedEmailLoadedRef = useRef(false);
  const callbackUrl = getSafeCallbackUrl(
    searchParams.get("callbackUrl")
  );
  const postLoginUrl = buildPostLoginUrl({
    callbackUrl
  });
  const initialEmail = searchParams.get("email") || "";

  const formik = useFormik({
    initialValues: {
      email: initialEmail,
      password: ""
    },
    initialStatus: getAuthenticationError(
      searchParams.get("error"),
      t
    ),
    validationSchema: loginSchema,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(null);

      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
        callbackUrl: postLoginUrl
      });

      if (result?.error) {
        helpers.setStatus(t("login.invalid"));
        return;
      }

      if (rememberMe) {
        window.localStorage.setItem(
          REMEMBERED_EMAIL_KEY,
          values.email.trim()
        );
      } else {
        window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }

      router.push(result?.url || postLoginUrl);
      router.refresh();
    }
  });
  const setFieldValue = formik.setFieldValue;

  useEffect(() => {
    if (rememberedEmailLoadedRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (rememberedEmailLoadedRef.current) {
        return;
      }

      rememberedEmailLoadedRef.current = true;
      const rememberedEmail = window.localStorage.getItem(
        REMEMBERED_EMAIL_KEY
      );

      if (!rememberedEmail) {
        return;
      }

      setRememberMe(true);

      if (!initialEmail) {
        void setFieldValue("email", rememberedEmail, false);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [initialEmail, setFieldValue]);

  function handleRememberMeChange(event) {
    const isChecked = event.target.checked;

    setRememberMe(isChecked);

    if (!isChecked) {
      window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }
  }

  async function signInWithGoogle() {
    const authorizationParams = {
      prompt: "select_account"
    };

    if (formik.values.email.trim()) {
      authorizationParams.login_hint = formik.values.email.trim();
    }

    if (!rememberMe) {
      window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    } else if (formik.values.email.trim()) {
      window.localStorage.setItem(
        REMEMBERED_EMAIL_KEY,
        formik.values.email.trim()
      );
    }

    setIsOAuthLoading(true);
    const result = await signIn(
      "google",
      {
        callbackUrl: postLoginUrl
      },
      authorizationParams
    );

    if (result?.error) {
      setIsOAuthLoading(false);
    }

    return result;
  }

  return (
    <form className="space-y-4" onSubmit={formik.handleSubmit}>
      {formik.status ? (
        <div
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          aria-live="polite"
          role="alert"
        >
          {formik.status}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">{t("login.email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          disabled={formik.isSubmitting || isOAuthLoading}
          value={formik.values.email}
          onBlur={formik.handleBlur}
          onChange={formik.handleChange}
        />
        <FieldError>{formik.touched.email && formik.errors.email}</FieldError>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="password">{t("login.password")}</Label>
          <Link className="text-sm font-medium text-primary hover:underline" href="/forgot-password">
            {t("login.forgot")}
          </Link>
        </div>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          disabled={formik.isSubmitting || isOAuthLoading}
          value={formik.values.password}
          onBlur={formik.handleBlur}
          onChange={formik.handleChange}
        />
        <FieldError>{formik.touched.password && formik.errors.password}</FieldError>
      </div>

      <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-growth-sidebar">
        <input
          className="size-4 rounded border-growth-border text-primary accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          type="checkbox"
          checked={rememberMe}
          disabled={formik.isSubmitting || isOAuthLoading}
          onChange={handleRememberMeChange}
        />
        <span>{t("login.rememberMe")}</span>
      </label>

      <Button
        className="w-full"
        disabled={formik.isSubmitting || isOAuthLoading}
        type="submit"
      >
        {formik.isSubmitting ? t("login.submitting") : t("login.submit")}
      </Button>

      {googleEnabled ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            <span className="h-px flex-1 bg-growth-border" />
            {t("login.or")}
            <span className="h-px flex-1 bg-growth-border" />
          </div>
          <Button
            className="w-full"
            disabled={formik.isSubmitting || isOAuthLoading}
            type="button"
            variant="outline"
            onClick={signInWithGoogle}
          >
            {isOAuthLoading
              ? t("login.googleSubmitting")
              : t("login.google")}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
