"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormik } from "formik";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema } from "@/features/auth/validation/login-schema";
import { FieldError } from "./field-error";

export function LoginForm({ googleEnabled = false }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const formik = useFormik({
    initialValues: {
      email: "",
      password: ""
    },
    validationSchema: loginSchema,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(null);

      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
        callbackUrl
      });

      if (result?.error) {
        helpers.setStatus("Invalid email or password.");
        return;
      }

      router.push(result?.url || callbackUrl);
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
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="password">Password</Label>
          <Link className="text-sm font-medium text-primary hover:underline" href="/forgot-password">
            Forgot?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={formik.values.password}
          onBlur={formik.handleBlur}
          onChange={formik.handleChange}
        />
        <FieldError>{formik.touched.password && formik.errors.password}</FieldError>
      </div>

      <Button className="w-full" disabled={formik.isSubmitting} type="submit">
        {formik.isSubmitting ? "Signing in..." : "Sign in"}
      </Button>

      {googleEnabled ? (
        <Button
          className="w-full"
          type="button"
          variant="outline"
          onClick={() => signIn("google", { callbackUrl })}
        >
          Continue with Google
        </Button>
      ) : null}
    </form>
  );
}
