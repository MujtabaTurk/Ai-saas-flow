"use client";

import { useFormik } from "formik";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/features/auth/components/field-error";
import { customerProfileSchema } from "@/features/customer-portal/validation/customer-portal-schema";

export function CustomerProfileForm({ data }) {
  const { update } = useSession();
  const formik = useFormik({
    initialValues: {
      name: data.profile.name || "",
      email: data.profile.email || "",
      phone: data.profile.phone || "",
      image: data.profile.image || ""
    },
    validationSchema: customerProfileSchema,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(null);

      const response = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        helpers.setStatus({
          type: "error",
          message: payload?.error?.message || "Could not update profile."
        });
        helpers.setErrors(payload?.error?.details || {});
        return;
      }

      await update();
      helpers.setStatus({
        type: "success",
        message: payload?.data?.message || "Profile updated."
      });
    }
  });

  const photoUrl = formik.values.image?.trim();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Customer profile</p>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Keep your contact details current across businesses you book with.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <Card>
          <CardHeader>
            <CardTitle>Profile Photo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex aspect-square max-w-64 items-center justify-center overflow-hidden rounded-2xl border border-growth-border bg-growth-mint/40">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  className="h-full w-full object-cover"
                  src={photoUrl}
                />
              ) : (
                <span className="text-5xl font-bold text-growth-forest">
                  {(formik.values.name || data.profile.email || "C")
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              A clear photo helps businesses recognize your customer account.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
          </CardHeader>
          <CardContent>
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

              <div className="grid gap-4 sm:grid-cols-2">
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
                  <FieldError>
                    {formik.touched.name && formik.errors.name}
                  </FieldError>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    disabled
                    id="email"
                    name="email"
                    type="email"
                    value={formik.values.email}
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for booking confirmations and account security.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    autoComplete="tel"
                    value={formik.values.phone}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                  />
                  <FieldError>
                    {formik.touched.phone && formik.errors.phone}
                  </FieldError>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Profile photo URL</Label>
                  <Input
                    id="image"
                    name="image"
                    type="url"
                    value={formik.values.image}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                  />
                  <FieldError>
                    {formik.touched.image && formik.errors.image}
                  </FieldError>
                </div>
              </div>

              <Button disabled={formik.isSubmitting} type="submit">
                {formik.isSubmitting ? "Saving..." : "Save profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
