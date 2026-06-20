"use client";

import { useMemo, useState } from "react";
import { useFormik } from "formik";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SUPPORTED_CURRENCIES } from "@/features/businesses/constants";
import { FieldError } from "@/features/auth/components/field-error";
import { mapServiceFormToApiPayload, mapServiceToFormValues } from "@/features/services/service-mapper";
import { createServiceSlugFromName, normalizeServiceSlug } from "@/features/services/slug";
import { serviceFormSchema } from "@/features/services/validation/service-schema";

function SelectField({ children, className = "", ...props }) {
  return (
    <select
      className={`flex h-11 w-full rounded-2xl border border-input bg-white px-4 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function ServiceForm({ mode = "create", service = null, businessCurrency = "usd", onSubmit, onCancel }) {
  const [slugEdited, setSlugEdited] = useState(Boolean(service?.slug));
  const initialValues = useMemo(() => mapServiceToFormValues(service, businessCurrency), [service, businessCurrency]);

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema: serviceFormSchema,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(null);

      try {
        await onSubmit(mapServiceFormToApiPayload(values), helpers);
      } catch (error) {
        helpers.setStatus(error.message || "Could not save service.");
        helpers.setErrors({
          ...(error.details || {}),
          ...(error.details?.priceCents
            ? {
                price: error.details.priceCents
              }
            : {})
        });
      }
    }
  });

  function handleNameChange(event) {
    formik.handleChange(event);

    if (!slugEdited) {
      formik.setFieldValue("slug", createServiceSlugFromName(event.target.value));
    }
  }

  function handleSlugChange(event) {
    setSlugEdited(true);
    formik.setFieldValue("slug", normalizeServiceSlug(event.target.value));
  }

  return (
    <form className="space-y-5" onSubmit={formik.handleSubmit}>
      {formik.status ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formik.status}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="service-name">Service name</Label>
          <Input
            id="service-name"
            name="name"
            placeholder="Haircut consultation"
            value={formik.values.name}
            onBlur={formik.handleBlur}
            onChange={handleNameChange}
          />
          <FieldError>{formik.touched.name && formik.errors.name}</FieldError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="service-slug">Slug</Label>
          <Input
            id="service-slug"
            name="slug"
            placeholder="haircut-consultation"
            value={formik.values.slug}
            onBlur={formik.handleBlur}
            onChange={handleSlugChange}
          />
          <FieldError>{formik.touched.slug && formik.errors.slug}</FieldError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="durationMin">Duration minutes</Label>
          <Input
            id="durationMin"
            name="durationMin"
            type="number"
            min="5"
            max="480"
            step="5"
            value={formik.values.durationMin}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError>{formik.touched.durationMin && formik.errors.durationMin}</FieldError>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Explain what customers can expect from this service."
            value={formik.values.description}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError>{formik.touched.description && formik.errors.description}</FieldError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bufferBeforeMin">Buffer before</Label>
          <Input
            id="bufferBeforeMin"
            name="bufferBeforeMin"
            type="number"
            min="0"
            max="240"
            step="5"
            value={formik.values.bufferBeforeMin}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError>{formik.touched.bufferBeforeMin && formik.errors.bufferBeforeMin}</FieldError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bufferAfterMin">Buffer after</Label>
          <Input
            id="bufferAfterMin"
            name="bufferAfterMin"
            type="number"
            min="0"
            max="240"
            step="5"
            value={formik.values.bufferAfterMin}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError>{formik.touched.bufferAfterMin && formik.errors.bufferAfterMin}</FieldError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={formik.values.price}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError>{formik.touched.price && formik.errors.price}</FieldError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <SelectField
            id="currency"
            name="currency"
            value={formik.values.currency}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          >
            {SUPPORTED_CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency.toUpperCase()}
              </option>
            ))}
          </SelectField>
          <FieldError>{formik.touched.currency && formik.errors.currency}</FieldError>
        </div>

        <label className="flex items-center gap-3 rounded-2xl border border-growth-border bg-white px-4 py-3 text-sm md:col-span-2">
          <input
            checked={formik.values.requiresPayment}
            className="h-4 w-4 rounded border-growth-border text-primary focus:ring-primary"
            name="requiresPayment"
            type="checkbox"
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          Require payment before confirming this service
        </label>
        <FieldError>{formik.errors.requiresPayment}</FieldError>

        <div className="space-y-2">
          <Label htmlFor="sortOrder">Sort order</Label>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min="0"
            max="10000"
            value={formik.values.sortOrder}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError>{formik.touched.sortOrder && formik.errors.sortOrder}</FieldError>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button
            disabled={formik.isSubmitting}
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
        ) : null}
        <Button
          isLoading={formik.isSubmitting}
          loadingLabel="Saving..."
          type="submit"
        >
          {mode === "edit" ? "Save changes" : "Create service"}
        </Button>
      </div>
    </form>
  );
}
