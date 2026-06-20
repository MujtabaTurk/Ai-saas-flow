"use client";

import { useMemo } from "react";
import { useFormik } from "formik";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/features/auth/components/field-error";
import { formatDateTimeInTimezone } from "@/features/availability/time";
import { unavailableDateSchema } from "@/features/availability/validation/availability-schema";

function SelectField({ children, ...props }) {
  return (
    <select
      className="flex h-11 w-full rounded-2xl border border-input bg-white px-4 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      {...props}
    >
      {children}
    </select>
  );
}

function todayValue(timezone) {
  return formatDateTimeInTimezone(new Date(), timezone).date;
}

export function UnavailableDateForm({
  unavailableDate = null,
  services = [],
  timezone,
  onSubmit,
  onCancel
}) {
  const initialValues = useMemo(() => {
    const start = unavailableDate
      ? formatDateTimeInTimezone(unavailableDate.startsAt, timezone)
      : { date: todayValue(timezone), time: "09:00" };
    const end = unavailableDate
      ? formatDateTimeInTimezone(unavailableDate.endsAt, timezone)
      : { time: "17:00" };

    return {
      serviceId: unavailableDate?.serviceId || "",
      date: start.date,
      isFullDay: unavailableDate?.isFullDay ?? true,
      startTime: unavailableDate?.isFullDay ? "09:00" : start.time,
      endTime: unavailableDate?.isFullDay ? "17:00" : end.time,
      reason: unavailableDate?.reason || ""
    };
  }, [timezone, unavailableDate]);

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema: unavailableDateSchema,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(null);

      try {
        await onSubmit(
          {
            ...values,
            serviceId: values.serviceId || null
          },
          helpers
        );
      } catch (error) {
        helpers.setStatus(error.message || "Could not save unavailable date.");
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
          <Label htmlFor="exception-date">Date</Label>
          <Input
            id="exception-date"
            name="date"
            type="date"
            value={formik.values.date}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError>{formik.touched.date && formik.errors.date}</FieldError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="exception-service">Applies to</Label>
          <SelectField
            id="exception-service"
            name="serviceId"
            value={formik.values.serviceId}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          >
            <option value="">Entire business</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </SelectField>
          <FieldError>{formik.touched.serviceId && formik.errors.serviceId}</FieldError>
        </div>

        <label className="flex items-center gap-3 rounded-2xl border border-growth-border bg-white px-4 py-3 text-sm md:col-span-2">
          <input
            checked={formik.values.isFullDay}
            className="h-4 w-4 rounded border-growth-border text-primary focus:ring-primary"
            name="isFullDay"
            type="checkbox"
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          Unavailable for the full day
        </label>

        {!formik.values.isFullDay ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="exception-start">Start time</Label>
              <Input
                id="exception-start"
                name="startTime"
                type="time"
                step="300"
                value={formik.values.startTime}
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
              />
              <FieldError>{formik.touched.startTime && formik.errors.startTime}</FieldError>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exception-end">End time</Label>
              <Input
                id="exception-end"
                name="endTime"
                type="time"
                step="300"
                value={formik.values.endTime}
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
              />
              <FieldError>{formik.touched.endTime && formik.errors.endTime}</FieldError>
            </div>
          </>
        ) : null}

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="reason">Reason</Label>
          <Input
            id="reason"
            name="reason"
            placeholder="Holiday, maintenance, vacation..."
            value={formik.values.reason}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError>{formik.touched.reason && formik.errors.reason}</FieldError>
        </div>
      </div>

      <div className="rounded-2xl border border-growth-border bg-growth-dashboard p-4 text-sm text-muted-foreground">
        Times are interpreted in the business timezone: <strong>{timezone}</strong>.
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
          {unavailableDate ? "Save changes" : "Add unavailable date"}
        </Button>
      </div>
    </form>
  );
}
