"use client";

import { useFormik } from "formik";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import {
  SUPPORTED_LOCALES,
  SUPPORTED_TIMEZONES
} from "@/features/businesses/constants";
import { customerSettingsSchema } from "@/features/customer-portal/validation/customer-portal-schema";

function PreferenceCheckbox({
  checked,
  description,
  disabled,
  label,
  name,
  onChange
}) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-2xl border border-growth-border bg-white p-4">
      <Checkbox
        checked={checked}
        className="mt-1 size-4 rounded border-growth-border text-primary accent-primary"
        disabled={disabled}
        name={name}
        onChange={onChange}
      />
      <span>
        <span className="block font-semibold text-growth-sidebar">
          {label}
        </span>
        <span className="mt-1 block text-sm text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}

export function CustomerSettingsForm({ data }) {
  const { update } = useSession();
  const formik = useFormik({
    initialValues: {
      customerEmailNotifications:
        data.settings.customerEmailNotifications ?? true,
      customerBookingReminders:
        data.settings.customerBookingReminders ?? true,
      customerMarketingOptIn:
        data.settings.customerMarketingOptIn ?? false,
      locale: data.settings.locale || "en",
      timezone: data.settings.timezone || "UTC"
    },
    validationSchema: customerSettingsSchema,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(null);

      const response = await fetch("/api/customer/settings", {
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
          message: payload?.error?.message || "Could not update settings."
        });
        helpers.setErrors(payload?.error?.details || {});
        return;
      }

      await update();
      helpers.setStatus({
        type: "success",
        message: payload?.data?.message || "Settings updated."
      });
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">
          Customer settings
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Manage security, notifications, and account preferences for your
          customer portal.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Password Change</CardTitle>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={formik.handleSubmit}>
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

              <div className="space-y-3">
                <PreferenceCheckbox
                  checked={formik.values.customerEmailNotifications}
                  description="Receive account and booking status emails."
                  disabled={formik.isSubmitting}
                  label="Email notifications"
                  name="customerEmailNotifications"
                  onChange={formik.handleChange}
                />
                <PreferenceCheckbox
                  checked={formik.values.customerBookingReminders}
                  description="Receive reminders for upcoming appointments."
                  disabled={formik.isSubmitting}
                  label="Booking reminders"
                  name="customerBookingReminders"
                  onChange={formik.handleChange}
                />
                <PreferenceCheckbox
                  checked={formik.values.customerMarketingOptIn}
                  description="Receive occasional offers and updates from businesses."
                  disabled={formik.isSubmitting}
                  label="Marketing updates"
                  name="customerMarketingOptIn"
                  onChange={formik.handleChange}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="locale">Language</Label>
                  <Select
                    className="flex h-11 w-full rounded-2xl border border-input bg-white px-4 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    id="locale"
                    name="locale"
                    value={formik.values.locale}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                  >
                    {SUPPORTED_LOCALES.map((locale) => (
                      <option key={locale.value} value={locale.value}>
                        {locale.label}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    className="flex h-11 w-full rounded-2xl border border-input bg-white px-4 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    id="timezone"
                    name="timezone"
                    value={formik.values.timezone}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                  >
                    {SUPPORTED_TIMEZONES.map((timezone) => (
                      <option key={timezone} value={timezone}>
                        {timezone}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <Button disabled={formik.isSubmitting} type="submit">
                {formik.isSubmitting ? "Saving..." : "Save settings"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
