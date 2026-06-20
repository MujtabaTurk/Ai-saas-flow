"use client";

import { useMemo } from "react";
import { useFormik } from "formik";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/features/auth/components/field-error";
import {
  SUPPORTED_LOCALES,
  SUPPORTED_TIMEZONES
} from "@/features/businesses/constants";
import { customerSchema } from "@/features/customers/validation/customer-schema";

function SelectField({ children, ...props }) {
  return (
    <select
      className="flex h-11 w-full rounded-2xl border border-input bg-white px-4 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      {...props}
    >
      {children}
    </select>
  );
}

export function CustomerForm({
  customer = null,
  businessLocale = "en",
  businessTimezone = "UTC",
  onCancel,
  onSubmit
}) {
  const initialValues = useMemo(
    () => ({
      name: customer?.name || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
      notes: customer?.notes || "",
      locale: customer?.locale || businessLocale,
      timezone: customer?.timezone || businessTimezone,
      marketingOptIn: customer?.marketingOptIn ?? false
    }),
    [businessLocale, businessTimezone, customer]
  );
  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema: customerSchema,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(null);

      try {
        await onSubmit(
          {
            ...values,
            phone: values.phone || null,
            notes: values.notes || null,
            locale: values.locale || null,
            timezone: values.timezone || null
          },
          helpers
        );
      } catch (error) {
        helpers.setStatus(error.message || "Could not save customer.");
        helpers.setErrors(error.details || {});
      }
    }
  });

  return (
    <form className="space-y-5" onSubmit={formik.handleSubmit}>
      {formik.status ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formik.status}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customer-name">Name</Label>
          <Input
            id="customer-name"
            name="name"
            value={formik.values.name}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError>{formik.touched.name && formik.errors.name}</FieldError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer-email">Email</Label>
          <Input
            id="customer-email"
            name="email"
            type="email"
            value={formik.values.email}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError>{formik.touched.email && formik.errors.email}</FieldError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer-phone">Phone</Label>
          <Input
            id="customer-phone"
            name="phone"
            value={formik.values.phone}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError>{formik.touched.phone && formik.errors.phone}</FieldError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer-locale">Language</Label>
          <SelectField
            id="customer-locale"
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
          </SelectField>
          <FieldError>
            {formik.touched.locale && formik.errors.locale}
          </FieldError>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="customer-timezone">Timezone</Label>
          <SelectField
            id="customer-timezone"
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
          </SelectField>
          <FieldError>
            {formik.touched.timezone && formik.errors.timezone}
          </FieldError>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="customer-notes">Private customer notes</Label>
          <Textarea
            id="customer-notes"
            name="notes"
            placeholder="Preferences, follow-up context, or relationship notes..."
            value={formik.values.notes}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError>{formik.touched.notes && formik.errors.notes}</FieldError>
        </div>

        <label className="flex items-start gap-3 rounded-2xl border border-growth-border bg-white px-4 py-3 text-sm md:col-span-2">
          <input
            checked={formik.values.marketingOptIn}
            className="mt-0.5 h-4 w-4 rounded border-growth-border text-primary focus:ring-primary"
            name="marketingOptIn"
            type="checkbox"
            onChange={formik.handleChange}
          />
          <span>
            <strong className="block text-growth-sidebar">
              Marketing consent recorded
            </strong>
            Only enable this when the customer has explicitly agreed to receive
            marketing communication.
          </span>
        </label>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          disabled={formik.isSubmitting}
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          isLoading={formik.isSubmitting}
          loadingLabel="Saving..."
          type="submit"
        >
          {customer ? "Save customer" : "Create customer"}
        </Button>
      </div>
    </form>
  );
}
