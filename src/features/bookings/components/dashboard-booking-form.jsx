"use client";

import { useMemo, useRef, useState } from "react";
import { useFormik } from "formik";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addDaysToDateValue, formatDateTimeInTimezone } from "@/features/availability/time";
import { FieldError } from "@/features/auth/components/field-error";
import {
  useCreateDashboardBooking,
  useDashboardSlots
} from "@/features/bookings/hooks/use-bookings";
import { publicBookingFormSchema } from "@/features/bookings/validation/booking-schema";

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

export function DashboardBookingForm({
  businessId,
  timezone,
  bookingWindowDays = 30,
  services,
  onCancel,
  onSuccess
}) {
  const localToday = formatDateTimeInTimezone(new Date(), timezone).date;
  const [date, setDate] = useState(localToday);
  const [selectedSlot, setSelectedSlot] = useState("");
  const idempotencyKeyRef = useRef(null);
  const activeServices = useMemo(
    () => services.filter((service) => service.isActive),
    [services]
  );
  const initialServiceId = activeServices[0]?.id || "";
  const [serviceId, setServiceId] = useState(initialServiceId);
  const slotsQuery = useDashboardSlots(businessId, serviceId, date);
  const createMutation = useCreateDashboardBooking(businessId);
  const slots = slotsQuery.data?.slots || [];
  const formik = useFormik({
    initialValues: {
      serviceId: initialServiceId,
      startsAt: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      notes: ""
    },
    validationSchema: publicBookingFormSchema,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(null);

      try {
        idempotencyKeyRef.current ??=
          globalThis.crypto?.randomUUID?.() ??
          `${Date.now()}-${Math.random().toString(16).slice(2)}`;

        const result = await createMutation.mutateAsync({
          ...values,
          serviceId,
          startsAt: selectedSlot,
          idempotencyKey: idempotencyKeyRef.current
        });

        onSuccess(result);
      } catch (error) {
        helpers.setStatus(error.message || "Could not create booking.");
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
          <Label htmlFor="dashboard-booking-service">Service</Label>
          <SelectField
            id="dashboard-booking-service"
            name="serviceId"
            value={serviceId}
            onChange={(event) => {
              const nextServiceId = event.target.value;
              idempotencyKeyRef.current = null;
              setServiceId(nextServiceId);
              setSelectedSlot("");
              formik.setFieldValue("serviceId", nextServiceId);
              formik.setFieldValue("startsAt", "");
            }}
          >
            {activeServices.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} ({service.durationMin} min)
              </option>
            ))}
          </SelectField>
          <FieldError>
            {formik.touched.serviceId && formik.errors.serviceId}
          </FieldError>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dashboard-booking-date">Date</Label>
          <Input
            id="dashboard-booking-date"
            min={localToday}
            max={addDaysToDateValue(localToday, bookingWindowDays)}
            type="date"
            value={date}
            onChange={(event) => {
              idempotencyKeyRef.current = null;
              setDate(event.target.value);
              setSelectedSlot("");
              formik.setFieldValue("startsAt", "");
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Available time</Label>
        {slotsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">
            Loading available times...
          </p>
        ) : slotsQuery.error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {slotsQuery.error.message}
          </p>
        ) : slots.length === 0 ? (
          <p className="rounded-2xl bg-growth-dashboard p-4 text-sm text-muted-foreground">
            No available times for this date.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => (
              <Button
                key={slot.startsAt}
                size="sm"
                type="button"
                variant={
                  selectedSlot === slot.startsAt ? "default" : "outline"
                }
                onClick={() => {
                  idempotencyKeyRef.current = null;
                  setSelectedSlot(slot.startsAt);
                  formik.setFieldValue("startsAt", slot.startsAt);
                }}
              >
                {new Intl.DateTimeFormat("en", {
                  timeZone: timezone,
                  hour: "numeric",
                  minute: "2-digit"
                }).format(new Date(slot.startsAt))}
              </Button>
            ))}
          </div>
        )}
        <FieldError>
          {formik.submitCount > 0 && !selectedSlot
            ? "Choose an available time."
            : null}
        </FieldError>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dashboard-customer-name">Customer name</Label>
          <Input
            id="dashboard-customer-name"
            name="customerName"
            value={formik.values.customerName}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError>
            {formik.touched.customerName && formik.errors.customerName}
          </FieldError>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dashboard-customer-email">Customer email</Label>
          <Input
            id="dashboard-customer-email"
            name="customerEmail"
            type="email"
            value={formik.values.customerEmail}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError>
            {formik.touched.customerEmail && formik.errors.customerEmail}
          </FieldError>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="dashboard-customer-phone">Phone</Label>
          <Input
            id="dashboard-customer-phone"
            name="customerPhone"
            value={formik.values.customerPhone}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError>
            {formik.touched.customerPhone && formik.errors.customerPhone}
          </FieldError>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="dashboard-booking-notes">Customer notes</Label>
          <Textarea
            id="dashboard-booking-notes"
            name="notes"
            value={formik.values.notes}
            onBlur={formik.handleBlur}
            onChange={formik.handleChange}
          />
          <FieldError>
            {formik.touched.notes && formik.errors.notes}
          </FieldError>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          disabled={
            formik.isSubmitting ||
            !serviceId ||
            !selectedSlot ||
            activeServices.length === 0
          }
          type="submit"
        >
          {formik.isSubmitting ? "Creating..." : "Create booking"}
        </Button>
      </div>
    </form>
  );
}
