"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { resetPasswordSchema } from "@/features/auth/validation/reset-password-schema";
import { FieldError } from "./field-error";

export function ResetPasswordForm() {
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
    <form className="space-y-4" onSubmit={formik.handleSubmit}>
      {formik.status ? (
        <div
          className={
            formik.status.type === "error"
              ? "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              : "rounded-2xl border border-growth-border bg-growth-mint/40 px-4 py-3 text-sm text-growth-sidebar"
          }
        >
          <p>{formik.status.message}</p>
          {formik.status.type === "success" ? (
            <Link className="mt-2 block font-semibold text-primary hover:underline" href="/login">
              {t("resetPassword.goLogin")}
            </Link>
          ) : null}
        </div>
      ) : null}

      {!token ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {t("resetPassword.missingToken")}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="password">
          {t("resetPassword.newPassword")}
        </Label>
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
          {t("resetPassword.confirmPassword")}
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

      <Button className="w-full" disabled={formik.isSubmitting || !token} type="submit">
        {formik.isSubmitting
          ? t("resetPassword.submitting")
          : t("resetPassword.submit")}
      </Button>
    </form>
  );
}
