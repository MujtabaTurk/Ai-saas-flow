"use client";

import { useMemo, useState } from "react";
import { useFormik } from "formik";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/features/auth/components/field-error";
import { SUPPORTED_CURRENCIES } from "@/features/businesses/constants";
import {
  MEMBERSHIP_BILLING_INTERVALS
} from "@/features/memberships/lifecycle";
import {
  mapMembershipPlanFormToApiPayload,
  mapMembershipPlanToFormValues
} from "@/features/memberships/mapper";
import {
  createMembershipSlugFromName,
  normalizeMembershipSlug
} from "@/features/memberships/slug";
import { membershipPlanFormSchema } from "@/features/memberships/validation/membership-schema";

function SelectField({ children, className = "", ...props }) {
  return (
    <Select
      className={`flex h-11 w-full rounded-2xl border border-input bg-white px-4 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </Select>
  );
}

const intervalOptions = Object.values(MEMBERSHIP_BILLING_INTERVALS);

export function MembershipPlanForm({
  businessCurrency = "usd",
  mode = "create",
  plan = null,
  onCancel,
  onSubmit
}) {
  const [slugEdited, setSlugEdited] = useState(Boolean(plan?.slug));
  const initialValues = useMemo(
    () => mapMembershipPlanToFormValues(plan, businessCurrency),
    [plan, businessCurrency]
  );
  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema: membershipPlanFormSchema,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(null);

      try {
        await onSubmit(mapMembershipPlanFormToApiPayload(values), helpers);
      } catch (error) {
        helpers.setStatus(error.message || "Could not save membership plan.");
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
      formik.setFieldValue(
        "slug",
        createMembershipSlugFromName(event.target.value)
      );
    }
  }

  function handleSlugChange(event) {
    setSlugEdited(true);
    formik.setFieldValue("slug", normalizeMembershipSlug(event.target.value));
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
          <Label htmlFor="membership-plan-name">Plan name</Label>
          <Input
            id="membership-plan-name"
            name="name"
            placeholder="Unlimited Gym Membership"
            value={formik.values.name}
            onBlur={formik.handleBlur}
            onChange={handleNameChange}
          />
          <FieldError>{formik.touched.name && formik.errors.name}</FieldError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="membership-plan-slug">Slug</Label>
          <Input
            id="membership-plan-slug"
            name="slug"
            placeholder="unlimited-gym"
            value={formik.values.slug}
            onBlur={formik.handleBlur}
            onChange={handleSlugChange}
          />
          <FieldError>{formik.touched.slug && formik.errors.slug}</FieldError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="billingInterval">Billing interval</Label>
          <SelectField
            id="billingInterval"
            name="billingInterval"
            value={formik.values.billingInterval}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          >
            {intervalOptions.map((interval) => (
              <option key={interval} value={interval}>
                {interval.toLowerCase()}
              </option>
            ))}
          </SelectField>
          <FieldError>{formik.touched.billingInterval && formik.errors.billingInterval}</FieldError>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="membership-description">Description</Label>
          <Textarea
            id="membership-description"
            name="description"
            placeholder="Describe access, classes, facilities, or member benefits."
            value={formik.values.description}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError>{formik.touched.description && formik.errors.description}</FieldError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="membership-price">Price</Label>
          <Input
            id="membership-price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            placeholder="49.00"
            value={formik.values.price}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError>{formik.touched.price && formik.errors.price}</FieldError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="membership-currency">Currency</Label>
          <SelectField
            id="membership-currency"
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

        <div className="space-y-2">
          <Label htmlFor="durationDays">Duration days</Label>
          <Input
            id="durationDays"
            name="durationDays"
            type="number"
            min="1"
            max="3660"
            value={formik.values.durationDays}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError>{formik.touched.durationDays && formik.errors.durationDays}</FieldError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="trialDays">Trial days</Label>
          <Input
            id="trialDays"
            name="trialDays"
            type="number"
            min="0"
            max="365"
            value={formik.values.trialDays}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError>{formik.touched.trialDays && formik.errors.trialDays}</FieldError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxActiveMembers">Member cap</Label>
          <Input
            id="maxActiveMembers"
            name="maxActiveMembers"
            type="number"
            min="1"
            placeholder="No cap"
            value={formik.values.maxActiveMembers}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError>{formik.touched.maxActiveMembers && formik.errors.maxActiveMembers}</FieldError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="membership-sortOrder">Sort order</Label>
          <Input
            id="membership-sortOrder"
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

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="featureText">Features</Label>
          <Textarea
            id="featureText"
            name="featureText"
            placeholder={"Unlimited gym access\n2 guest passes per month\nLocker room access"}
            value={formik.values.featureText}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError>{formik.touched.featureText && formik.errors.featureText}</FieldError>
        </div>

        <label className="flex items-center gap-3 rounded-2xl border border-growth-border bg-white px-4 py-3 text-sm">
          <Checkbox
            checked={formik.values.requiresPayment}
            className="h-4 w-4 rounded border-growth-border text-primary focus:ring-primary"
            name="requiresPayment"
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          Require payment to activate
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-growth-border bg-white px-4 py-3 text-sm">
          <Checkbox
            checked={formik.values.isActive}
            className="h-4 w-4 rounded border-growth-border text-primary focus:ring-primary"
            name="isActive"
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          Publicly available
        </label>
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
          {mode === "edit" ? "Save changes" : "Create plan"}
        </Button>
      </div>
    </form>
  );
}
