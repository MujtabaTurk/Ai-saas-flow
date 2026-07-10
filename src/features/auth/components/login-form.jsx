"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import { ArrowRight, LockKeyhole, Mail, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  buildPostLoginUrl,
  getSafeNavigationUrl,
  getSafeCallbackUrl
} from "@/features/auth/callback-url";
import { loginSchema } from "@/features/auth/validation/login-schema";
import { FieldError } from "./field-error";
import { GoogleSignInButton } from "./google-sign-in-button";
import {
  AUTH_COMPACT_INPUT_CLASS_NAME,
  AuthFormAlert,
  AuthInputIcon,
  AuthOAuthDivider
} from "./auth-form-ui";

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

export function LoginForm({
  authMode = "business",
  googleEnabled = false,
  googleClientId = null,
  defaultCallbackUrl = null,
  forgotPasswordPath = "/forgot-password"
}) {
  const { t } = useTranslation("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const rememberedEmailLoadedRef = useRef(false);
  const isSuperAdminMode = authMode === "super-admin";
  const callbackUrl = getSafeCallbackUrl(
    searchParams.get("callbackUrl"),
    defaultCallbackUrl
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

      router.push(getSafeNavigationUrl(result?.url, postLoginUrl));
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
    if (formik.isSubmitting || isOAuthLoading) {
      return null;
    }

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
    <form
      className="w-full space-y-4"
      onSubmit={formik.handleSubmit}
    >
      {isSuperAdminMode ? (
        <div className="flex gap-3 rounded-[8px] border border-[#f59e0b]/45 bg-[#fff7ed] px-3 py-3 text-sm leading-5 text-[#7c2d12]">
          <ShieldAlert
            className="mt-0.5 size-4 shrink-0 text-[#b45309]"
            aria-hidden="true"
          />
          <div>
            <span className="block font-semibold text-[#7c2d12]">
              {t("login.adminNoticeTitle")}
            </span>
            <span>{t("login.adminNotice")}</span>
          </div>
        </div>
      ) : null}

      <AuthFormAlert compact>{formik.status}</AuthFormAlert>

      <div className="space-y-4">
        <div className="space-y-1">
          <Label className="text-sm font-semibold text-[#0b1c30]" htmlFor="email">
            Email Address
          </Label>
          <div className="relative">
            <AuthInputIcon icon={Mail} />
            <Input
              aria-describedby={
                formik.touched.email && formik.errors.email
                  ? "email-error"
                  : undefined
              }
              aria-invalid={Boolean(formik.touched.email && formik.errors.email)}
              autoComplete="email"
              className={`${AUTH_COMPACT_INPUT_CLASS_NAME} ps-10`}
              disabled={formik.isSubmitting || isOAuthLoading}
              id="email"
              name="email"
              placeholder="name@company.com"
              type="email"
              value={formik.values.email}
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
            />
          </div>
          <FieldError className="text-xs" id="email-error">
            {formik.touched.email && formik.errors.email}
          </FieldError>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm font-semibold text-[#0b1c30]" htmlFor="password">
              {t("login.password")}
            </Label>
            <Link
              className="text-xs font-semibold text-[#3525cd] transition-colors hover:text-[#2f22b6] hover:underline"
              href={forgotPasswordPath}
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            aria-describedby={
              formik.touched.password && formik.errors.password
                ? "password-error"
                : undefined
            }
            aria-invalid={Boolean(formik.touched.password && formik.errors.password)}
            autoComplete="current-password"
            className={AUTH_COMPACT_INPUT_CLASS_NAME}
            disabled={formik.isSubmitting || isOAuthLoading}
            id="password"
            leadingIcon={LockKeyhole}
            name="password"
            placeholder="Password"
            value={formik.values.password}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError className="text-xs" id="password-error">
            {formik.touched.password && formik.errors.password}
          </FieldError>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3 text-xs font-medium text-[#464555]">
        <Checkbox
          className="size-4 rounded-[4px] border-[#c7c4d8] text-[#3525cd] accent-[#3525cd] focus-visible:ring-[#3525cd]/30 data-[state=checked]:border-[#3525cd] data-[state=checked]:bg-[#3525cd]"
          checked={rememberMe}
          disabled={formik.isSubmitting || isOAuthLoading}
          onChange={handleRememberMeChange}
        />
        <span>{t("login.rememberMe")}</span>
      </label>

      <Button
        className="h-11 w-full rounded-[8px] bg-[#3525cd] text-sm font-semibold text-white shadow-none hover:bg-[#2f22b6] focus-visible:ring-[#3525cd]/35 lg:h-10"
        disabled={formik.isSubmitting || isOAuthLoading}
        isLoading={formik.isSubmitting}
        loadingLabel={t("login.submitting")}
        type="submit"
      >
        {isSuperAdminMode ? t("login.adminSubmit") : t("login.submit")}
        {!formik.isSubmitting ? (
          <ArrowRight className="ms-2 size-4" aria-hidden="true" />
        ) : null}
      </Button>

      {googleEnabled && googleClientId ? (
        <div className="space-y-3">
          <AuthOAuthDivider />
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
