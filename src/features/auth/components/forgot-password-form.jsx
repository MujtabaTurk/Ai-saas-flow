"use client";

import Link from "next/link";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema } from "@/features/auth/validation/forgot-password-schema";
import {
  AUTH_INPUT_CLASS_NAME,
  AuthFormAlert,
  AuthInputIcon
} from "./auth-form-ui";
import { FieldError } from "./field-error";

export function ForgotPasswordForm({
  resetPath = "/reset-password"
}) {
  const { t } = useTranslation("auth");
  const formik = useFormik({
    initialValues: {
      email: ""
    },
    validationSchema: forgotPasswordSchema,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(null);

      try {
        const response = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...values,
            resetPath
          })
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          const { devResetUrl, ...fieldErrors } =
            payload?.error?.details || {};

          helpers.setStatus({
            type: "error",
            message: payload?.error?.message || t("forgotPassword.error"),
            devResetUrl
          });
          helpers.setErrors(fieldErrors);
          return;
        }

        helpers.setStatus({
          type: "success",
          message: payload?.data?.message || t("forgotPassword.sent"),
          devResetUrl: payload?.data?.devResetUrl
        });
      } catch {
        helpers.setStatus({
          type: "error",
          message: t("forgotPassword.error")
        });
      }
    }
  });

  return (
    <form className="space-y-5" onSubmit={formik.handleSubmit}>
      {formik.status ? (
        <AuthFormAlert variant={formik.status.type}>
          <p>{formik.status.message}</p>
          {formik.status.devResetUrl ? (
            <Link className="mt-2 block font-semibold text-[#3525cd] hover:underline" href={formik.status.devResetUrl}>
              {t("forgotPassword.devLink")}
            </Link>
          ) : null}
        </AuthFormAlert>
      ) : null}

      <div className="space-y-1">
        <Label className="text-sm font-semibold text-[#0b1c30]" htmlFor="email">
          Email Address
        </Label>
        <div className="relative">
          <AuthInputIcon icon={Mail} />
          <Input
            aria-describedby={
              formik.touched.email && formik.errors.email
                ? "forgot-email-error"
                : undefined
            }
            aria-invalid={Boolean(formik.touched.email && formik.errors.email)}
            autoComplete="email"
            className={`${AUTH_INPUT_CLASS_NAME} ps-10`}
            id="email"
            name="email"
            placeholder="name@company.com"
            type="email"
            value={formik.values.email}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
        </div>
        <FieldError className="text-xs" id="forgot-email-error">
          {formik.touched.email && formik.errors.email}
        </FieldError>
      </div>

      <Button
        className="h-11 w-full rounded-[8px] bg-[#3525cd] text-sm font-semibold text-white shadow-none hover:bg-[#2f22b6] focus-visible:ring-[#3525cd]/35"
        disabled={formik.isSubmitting}
        isLoading={formik.isSubmitting}
        loadingLabel={t("forgotPassword.preparing")}
        type="submit"
      >
        {t("forgotPassword.submit")}
        {!formik.isSubmitting ? (
          <ArrowRight className="ms-2 size-4" aria-hidden="true" />
        ) : null}
      </Button>
    </form>
  );
}
