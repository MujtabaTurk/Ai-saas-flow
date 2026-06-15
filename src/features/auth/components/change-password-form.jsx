"use client";

import { useFormik } from "formik";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { changePasswordSchema } from "@/features/auth/validation/change-password-schema";
import { FieldError } from "./field-error";

export function ChangePasswordForm() {
  const formik = useFormik({
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    },
    validationSchema: changePasswordSchema,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(null);

      const response = await fetch("/api/auth/change-password", {
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
          message: payload?.error?.message || "Could not update password."
        });
        helpers.setErrors(payload?.error?.details || {});
        return;
      }

      helpers.resetForm();
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
          {formik.status.message}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <PasswordInput
          id="currentPassword"
          name="currentPassword"
          autoComplete="current-password"
          value={formik.values.currentPassword}
          onBlur={formik.handleBlur}
          onChange={formik.handleChange}
        />
        <FieldError>
          {formik.touched.currentPassword && formik.errors.currentPassword}
        </FieldError>
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">New password</Label>
        <PasswordInput
          id="newPassword"
          name="newPassword"
          autoComplete="new-password"
          value={formik.values.newPassword}
          onBlur={formik.handleBlur}
          onChange={formik.handleChange}
        />
        <FieldError>{formik.touched.newPassword && formik.errors.newPassword}</FieldError>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm new password</Label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          value={formik.values.confirmPassword}
          onBlur={formik.handleBlur}
          onChange={formik.handleChange}
        />
        <FieldError>
          {formik.touched.confirmPassword && formik.errors.confirmPassword}
        </FieldError>
      </div>

      <Button disabled={formik.isSubmitting} type="submit">
        {formik.isSubmitting ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}
