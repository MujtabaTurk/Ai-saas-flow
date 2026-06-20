"use client";

import { useMemo } from "react";
import { useFormik } from "formik";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/features/auth/components/field-error";
import { bookingSettingsSchema } from "@/features/bookings/validation/booking-schema";

export function BookingSettingsForm({ settings, onSubmit, disabled = false }) {
  const initialValues = useMemo(
    () => ({
      bookingLeadTimeMin: settings?.bookingLeadTimeMin ?? 120,
      bookingWindowDays: settings?.bookingWindowDays ?? 30,
      cancellationWindowMin: settings?.cancellationWindowMin ?? 1440,
      allowGuestBookings: settings?.allowGuestBookings ?? true,
      autoConfirmBookings: settings?.autoConfirmBookings ?? false
    }),
    [settings]
  );
  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema: bookingSettingsSchema,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(null);

      try {
        const result = await onSubmit({
          ...values,
          bookingLeadTimeMin: Number(values.bookingLeadTimeMin),
          bookingWindowDays: Number(values.bookingWindowDays),
          cancellationWindowMin: Number(values.cancellationWindowMin)
        });
        helpers.setStatus(result.message);
      } catch (error) {
        helpers.setStatus(error.message);
        helpers.setErrors(error.details || {});
      }
    }
  });

  return (
    <form className="space-y-4" onSubmit={formik.handleSubmit}>
      {formik.status ? (
        <div className="rounded-2xl border border-growth-border bg-growth-mint/40 px-4 py-3 text-sm text-growth-sidebar">
          {formik.status}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="bookingLeadTimeMin">Minimum lead time (minutes)</Label>
          <Input
            id="bookingLeadTimeMin"
            name="bookingLeadTimeMin"
            type="number"
            min="0"
            disabled={disabled}
            value={formik.values.bookingLeadTimeMin}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError>{formik.touched.bookingLeadTimeMin && formik.errors.bookingLeadTimeMin}</FieldError>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bookingWindowDays">Booking window (days)</Label>
          <Input
            id="bookingWindowDays"
            name="bookingWindowDays"
            type="number"
            min="1"
            disabled={disabled}
            value={formik.values.bookingWindowDays}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError>{formik.touched.bookingWindowDays && formik.errors.bookingWindowDays}</FieldError>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cancellationWindowMin">Cancellation window (minutes)</Label>
          <Input
            id="cancellationWindowMin"
            name="cancellationWindowMin"
            type="number"
            min="0"
            disabled={disabled}
            value={formik.values.cancellationWindowMin}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError>
            {formik.touched.cancellationWindowMin && formik.errors.cancellationWindowMin}
          </FieldError>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex items-center gap-3 rounded-2xl border border-growth-border bg-white px-4 py-3 text-sm">
          <input
            checked={formik.values.allowGuestBookings}
            className="h-4 w-4"
            disabled={disabled}
            name="allowGuestBookings"
            type="checkbox"
            onChange={formik.handleChange}
          />
          Allow guest bookings
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-growth-border bg-white px-4 py-3 text-sm">
          <input
            checked={formik.values.autoConfirmBookings}
            className="h-4 w-4"
            disabled={disabled}
            name="autoConfirmBookings"
            type="checkbox"
            onChange={formik.handleChange}
          />
          Auto-confirm free bookings
        </label>
      </div>

      <Button
        disabled={disabled}
        isLoading={formik.isSubmitting}
        loadingLabel="Saving..."
        type="submit"
      >
        Save booking settings
      </Button>
    </form>
  );
}
