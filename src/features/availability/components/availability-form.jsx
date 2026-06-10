"use client";

import { useMemo } from "react";
import { useFormik } from "formik";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/features/auth/components/field-error";
import { DAYS_OF_WEEK, SLOT_DURATIONS } from "@/features/availability/constants";
import { availabilitySchema } from "@/features/availability/validation/availability-schema";

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

export function AvailabilityForm({ availability = null, services = [], onSubmit, onCancel }) {
  const initialValues = useMemo(
    () => ({
      serviceId: availability?.serviceId || "",
      dayOfWeek: availability?.dayOfWeek || "MONDAY",
      startTime: availability?.startTime || "09:00",
      endTime: availability?.endTime || "17:00",
      slotDurationMin: availability?.slotDurationMin || 30,
      bufferBeforeMin: availability?.bufferBeforeMin || 0,
      bufferAfterMin: availability?.bufferAfterMin || 0
    }),
    [availability]
  );

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validationSchema: availabilitySchema,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(null);

      try {
        await onSubmit(
          {
            ...values,
            serviceId: values.serviceId || null,
            slotDurationMin: Number(values.slotDurationMin),
            bufferBeforeMin: Number(values.bufferBeforeMin),
            bufferAfterMin: Number(values.bufferAfterMin)
          },
          helpers
        );
      } catch (error) {
        helpers.setStatus(error.message || "Could not save working hours.");
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

      <div className="rounded-2xl border border-growth-border bg-growth-dashboard p-4 text-sm text-muted-foreground">
        Add multiple non-overlapping ranges to create breaks. Example: `09:00-12:00` and `13:00-17:00`.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dayOfWeek">Working day</Label>
          <SelectField
            id="dayOfWeek"
            name="dayOfWeek"
            value={formik.values.dayOfWeek}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          >
            {DAYS_OF_WEEK.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </SelectField>
          <FieldError>{formik.touched.dayOfWeek && formik.errors.dayOfWeek}</FieldError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="serviceId">Applies to</Label>
          <SelectField
            id="serviceId"
            name="serviceId"
            value={formik.values.serviceId}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          >
            <option value="">All services</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </SelectField>
          <FieldError>{formik.touched.serviceId && formik.errors.serviceId}</FieldError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="startTime">Start time</Label>
          <Input
            id="startTime"
            name="startTime"
            type="time"
            value={formik.values.startTime}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError>{formik.touched.startTime && formik.errors.startTime}</FieldError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="endTime">End time</Label>
          <Input
            id="endTime"
            name="endTime"
            type="time"
            value={formik.values.endTime}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError>{formik.touched.endTime && formik.errors.endTime}</FieldError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="slotDurationMin">Slot interval</Label>
          <SelectField
            id="slotDurationMin"
            name="slotDurationMin"
            value={formik.values.slotDurationMin}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          >
            {SLOT_DURATIONS.map((duration) => (
              <option key={duration} value={duration}>
                Every {duration} minutes
              </option>
            ))}
          </SelectField>
          <FieldError>{formik.touched.slotDurationMin && formik.errors.slotDurationMin}</FieldError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bufferBeforeMin">Buffer before</Label>
          <Input
            id="bufferBeforeMin"
            name="bufferBeforeMin"
            type="number"
            min="0"
            max="240"
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
            value={formik.values.bufferAfterMin}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError>{formik.touched.bufferAfterMin && formik.errors.bufferAfterMin}</FieldError>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button disabled={formik.isSubmitting} type="submit">
          {formik.isSubmitting ? "Saving..." : availability ? "Save changes" : "Add working hours"}
        </Button>
      </div>
    </form>
  );
}

