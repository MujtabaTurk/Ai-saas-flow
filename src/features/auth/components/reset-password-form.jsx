"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { resetPasswordSchema } from "@/features/auth/validation/reset-password-schema";
import {
  AUTH_INPUT_CLASS_NAME,
  AuthFormAlert
} from "./auth-form-ui";
import { FieldError } from "./field-error";

export function ResetPasswordForm({
  loginPath = "/login"
}) {
  const { t } = useTranslation("auth");
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const formik = useFormik({
    initialValues: {
      token,
      password: "",
      confirmPassword: ""
    },
    enableReinitialize: true,
    validationSchema: resetPasswordSchema,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(null);

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });
      const payload = await response.json();

      if (!response.ok) {
        helpers.setStatus({
          type: "error",
          message: payload?.error?.message || t("resetPassword.error")
        });
        helpers.setErrors(payload?.error?.details || {});
        return;
      }

      helpers.resetForm({
        values: {
          token,
          password: "",
          confirmPassword: ""
        }
      });
      helpers.setStatus({
        type: "success",
        message: payload.data.message
      });
    }
  });

  return (
    <form className="space-y-5" onSubmit={formik.handleSubmit}>
      {formik.status ? (
        <AuthFormAlert variant={formik.status.type}>
          <p>{formik.status.message}</p>
          {formik.status.type === "success" ? (
            <Link className="mt-2 block font-semibold text-[#3525cd] hover:underline" href={loginPath}>
              {t("resetPassword.goLogin")}
            </Link>
          ) : null}
        </AuthFormAlert>
      ) : null}

      {!token ? (
        <AuthFormAlert variant="warning">
          {t("resetPassword.missingToken")}
        </AuthFormAlert>
      ) : null}

      <div className="space-y-1">
        <Label className="text-sm font-semibold text-[#0b1c30]" htmlFor="password">
          {t("resetPassword.newPassword")}
        </Label>
        <PasswordInput
          aria-describedby={
            formik.touched.password && formik.errors.password
              ? "reset-password-error"
              : undefined
          }
          aria-invalid={Boolean(formik.touched.password && formik.errors.password)}
          autoComplete="new-password"
          className={AUTH_INPUT_CLASS_NAME}
          id="password"
          leadingIcon={LockKeyhole}
          name="password"
          placeholder="Create a password"
          value={formik.values.password}
          onBlur={formik.handleBlur}
          onChange={formik.handleChange}
        />
        <FieldError className="text-xs" id="reset-password-error">
          {formik.touched.password && formik.errors.password}
        </FieldError>
      </div>

      <div className="space-y-1">
        <Label className="text-sm font-semibold text-[#0b1c30]" htmlFor="confirmPassword">
          {t("resetPassword.confirmPassword")}
        </Label>
        <PasswordInput
          aria-describedby={
            formik.touched.confirmPassword && formik.errors.confirmPassword
              ? "reset-confirm-password-error"
              : undefined
          }
          aria-invalid={Boolean(
            formik.touched.confirmPassword && formik.errors.confirmPassword
          )}
          autoComplete="new-password"
          className={AUTH_INPUT_CLASS_NAME}
          id="confirmPassword"
          leadingIcon={LockKeyhole}
          name="confirmPassword"
          placeholder="Confirm password"
          value={formik.values.confirmPassword}
          onBlur={formik.handleBlur}
          onChange={formik.handleChange}
        />
        <FieldError className="text-xs" id="reset-confirm-password-error">
          {formik.touched.confirmPassword && formik.errors.confirmPassword}
        </FieldError>
      </div>

      <Button
        className="h-11 w-full rounded-[8px] bg-[#3525cd] text-sm font-semibold text-white shadow-none hover:bg-[#2f22b6] focus-visible:ring-[#3525cd]/35"
        disabled={formik.isSubmitting || !token}
        isLoading={formik.isSubmitting}
        loadingLabel={t("resetPassword.submitting")}
        type="submit"
      >
        {t("resetPassword.submit")}
        {!formik.isSubmitting ? (
          <ArrowRight className="ms-2 size-4" aria-hidden="true" />
        ) : null}
      </Button>
    </form>
  );
}
