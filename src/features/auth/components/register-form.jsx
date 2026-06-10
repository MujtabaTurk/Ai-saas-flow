"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useFormik } from "formik";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema } from "@/features/auth/validation/register-schema";
import { FieldError } from "./field-error";

export function RegisterForm() {
  const router = useRouter();
  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: ""
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
        helpers.setStatus(payload?.error?.message || "Could not create your account.");
        helpers.setErrors(payload?.error?.details || {});
        return;
      }

      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
        callbackUrl: "/onboarding"
      });

      router.push(result?.url || "/onboarding");
      router.refresh();
    }
  });

  return (
    <form className="space-y-4" onSubmit={formik.handleSubmit}>
      {formik.status ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formik.status}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
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

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={formik.values.password}
          onBlur={formik.handleBlur}
          onChange={formik.handleChange}
        />
        <FieldError>{formik.touched.password && formik.errors.password}</FieldError>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={formik.values.confirmPassword}
          onBlur={formik.handleBlur}
          onChange={formik.handleChange}
        />
        <FieldError>{formik.touched.confirmPassword && formik.errors.confirmPassword}</FieldError>
      </div>

      <Button className="w-full" disabled={formik.isSubmitting} type="submit">
        {formik.isSubmitting ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}

