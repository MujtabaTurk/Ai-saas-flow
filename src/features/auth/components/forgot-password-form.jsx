"use client";

import Link from "next/link";
import { useFormik } from "formik";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema } from "@/features/auth/validation/forgot-password-schema";
import { FieldError } from "./field-error";

export function ForgotPasswordForm() {
  const formik = useFormik({
    initialValues: {
      email: ""
    },
    validationSchema: forgotPasswordSchema,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(null);

      const response = await fetch("/api/auth/forgot-password", {
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
          message: payload?.error?.message || "Could not prepare a reset link."
        });
        helpers.setErrors(payload?.error?.details || {});
        return;
      }

      helpers.setStatus({
        type: "success",
        message: payload.data.message,
        devResetUrl: payload.data.devResetUrl
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
          {formik.status.devResetUrl ? (
            <Link className="mt-2 block font-semibold text-primary hover:underline" href={formik.status.devResetUrl}>
              Open development reset link
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={formik.values.email}
          onBlur={formik.handleBlur}
          onChange={formik.handleChange}
        />
        <FieldError>{formik.touched.email && formik.errors.email}</FieldError>
      </div>

      <Button className="w-full" disabled={formik.isSubmitting} type="submit">
        {formik.isSubmitting ? "Preparing link..." : "Send reset link"}
      </Button>
    </form>
  );
}

