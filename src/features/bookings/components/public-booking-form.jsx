"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/features/auth/components/field-error";
import {
  addDaysToDateValue,
  formatDateTimeInTimezone
} from "@/features/availability/time";
import {
  useCreatePublicBooking,
  usePublicSlots
} from "@/features/bookings/hooks/use-bookings";
import { publicBookingFormSchema } from "@/features/bookings/validation/booking-schema";
import {
  formatLocalizedDateTime,
  formatLocalizedMoney
} from "@/i18n/format";

function formatStatus(status, t) {
  const key =
    status === "NO_SHOW"
      ? "noShow"
      : status.toLowerCase();

  return t(`bookings:statuses.${key}`);
}

export function PublicBookingForm({ business, services }) {
  const { t, i18n } = useTranslation(["public", "bookings"]);
  const language = i18n.resolvedLanguage || i18n.language;
  const localToday = formatDateTimeInTimezone(
    new Date(),
    business.timezone
  ).date;
  const [serviceId, setServiceId] = useState(services[0]?.id || "");
  const [date, setDate] = useState(localToday);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const idempotencyKeyRef = useRef(null);
  const slotsQuery = usePublicSlots(business.slug, serviceId, date);
  const bookingMutation = useCreatePublicBooking(business.slug);
  const selectedService = useMemo(
    () => services.find((service) => service.id === serviceId),
    [serviceId, services]
  );
  const slots = slotsQuery.data?.slots || [];
  const formik = useFormik({
    initialValues: {
      serviceId,
      startsAt: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      notes: ""
    },
    enableReinitialize: true,
    validationSchema: publicBookingFormSchema,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(null);

      try {
        idempotencyKeyRef.current ??=
          globalThis.crypto?.randomUUID?.() ??
          `${Date.now()}-${Math.random().toString(16).slice(2)}`;

        const result = await bookingMutation.mutateAsync({
          ...values,
          serviceId,
          startsAt: selectedSlot,
          idempotencyKey: idempotencyKeyRef.current
        });
        setConfirmation(result);
      } catch (error) {
        helpers.setStatus(error.message);
        helpers.setErrors(error.details || {});
      }
    }
  });

  if (confirmation) {
    const manageUrl = `/${business.slug}/booking/${confirmation.booking.bookingNumber}?token=${confirmation.customerAccessToken}`;
    return (
      <Card>
        <CardHeader>
          <Badge variant="success">{t("booking.created")}</Badge>
          <CardTitle>{confirmation.booking.serviceNameSnapshot}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            {t("booking.reference")}:{" "}
            <strong className="text-growth-sidebar">
              {confirmation.booking.bookingNumber}
            </strong>
          </p>
          <p>
            {t("booking.status")}:{" "}
            {formatStatus(confirmation.booking.status, t)}
          </p>
          {confirmation.booking.paymentRequiredSnapshot ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
              {t("booking.paymentRequired")}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button asChild size="sm">
              <Link href={manageUrl}>{t("booking.manage")}</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/customer">Customer dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form className="space-y-6" onSubmit={formik.handleSubmit}>
      {formik.status ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formik.status}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t("booking.chooseService")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {services.map((service) => (
            <button
              className={`rounded-2xl border p-4 text-start transition ${
                serviceId === service.id
                  ? "border-primary bg-growth-mint/30"
                  : "border-growth-border bg-white hover:bg-growth-dashboard"
              }`}
              key={service.id}
              type="button"
              onClick={() => {
                idempotencyKeyRef.current = null;
                setServiceId(service.id);
                setSelectedSlot("");
                formik.setFieldValue("serviceId", service.id);
                formik.setFieldValue("startsAt", "");
              }}
            >
              <p className="font-bold text-growth-sidebar">{service.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("booking.shortMinutes", {
                  count: service.durationMin
                })}{" "}
                |{" "}
                {service.priceCents === null ||
                service.priceCents === undefined
                  ? t("booking.free")
                  : formatLocalizedMoney(
                      service.priceCents,
                      service.currency,
                      language
                    )}
              </p>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("booking.chooseDateTime")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="booking-date">{t("booking.date")}</Label>
            <Input
              id="booking-date"
              min={localToday}
              max={addDaysToDateValue(
                localToday,
                business.bookingWindowDays || 30
              )}
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
          {slotsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">
              {t("booking.loadingTimes")}
            </p>
          ) : slotsQuery.error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {slotsQuery.error.message}
            </p>
          ) : slots.length === 0 ? (
            <p className="rounded-2xl bg-growth-dashboard p-4 text-sm text-muted-foreground">
              {t("booking.noTimes")}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <Button
                  key={slot.startsAt}
                  size="sm"
                  type="button"
                  variant={selectedSlot === slot.startsAt ? "default" : "outline"}
                  onClick={() => {
                    idempotencyKeyRef.current = null;
                    setSelectedSlot(slot.startsAt);
                    formik.setFieldValue("startsAt", slot.startsAt);
                  }}
                >
                  {formatLocalizedDateTime(
                    slot.startsAt,
                    business.timezone,
                    language,
                    {
                    hour: "numeric",
                    minute: "2-digit"
                    }
                  )}
                </Button>
              ))}
            </div>
          )}
          <FieldError>
            {formik.submitCount > 0 && !selectedSlot
              ? t("booking.chooseTime")
              : null}
          </FieldError>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("booking.yourDetails")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="customerName">{t("booking.name")}</Label>
            <Input
              id="customerName"
              name="customerName"
              value={formik.values.customerName}
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
            />
            <FieldError>{formik.touched.customerName && formik.errors.customerName}</FieldError>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerEmail">{t("booking.email")}</Label>
            <Input
              id="customerEmail"
              name="customerEmail"
              type="email"
              value={formik.values.customerEmail}
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
            />
            <FieldError>{formik.touched.customerEmail && formik.errors.customerEmail}</FieldError>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="customerPhone">{t("booking.phone")}</Label>
            <Input
              id="customerPhone"
              name="customerPhone"
              value={formik.values.customerPhone}
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
            />
            <FieldError>{formik.touched.customerPhone && formik.errors.customerPhone}</FieldError>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">{t("booking.notes")}</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formik.values.notes}
              onBlur={formik.handleBlur}
              onChange={formik.handleChange}
            />
            <FieldError>{formik.touched.notes && formik.errors.notes}</FieldError>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full" disabled={formik.isSubmitting || !selectedService || !selectedSlot} type="submit">
        {formik.isSubmitting ? t("booking.creating") : t("booking.create")}
      </Button>
    </form>
  );
}
