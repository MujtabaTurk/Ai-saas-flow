"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useCancelPublicBooking,
  usePublicBooking
} from "@/features/bookings/hooks/use-bookings";
import { PublicReviewForm } from "@/features/reviews/components/public-review-form";
import { usePublicBookingReview } from "@/features/reviews/hooks/use-reviews";
import { formatLocalizedDateTime } from "@/i18n/format";

function formatStatus(status, t) {
  const key =
    status === "NO_SHOW"
      ? "noShow"
      : status.toLowerCase();

  return t(`bookings:statuses.${key}`);
}

export function PublicBookingManager({ businessSlug, bookingNumber, token, sessionId = "" }) {
  const { t, i18n } = useTranslation(["public", "bookings"]);
  const language = i18n.resolvedLanguage || i18n.language;
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState(null);
  const bookingQuery = usePublicBooking(businessSlug, bookingNumber, token, sessionId);
  const reviewQuery = usePublicBookingReview(
    businessSlug,
    bookingNumber,
    token
  );
  const cancelMutation = useCancelPublicBooking(businessSlug, bookingNumber, token);

  if (!token) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {t("booking.invalidLink")}
      </div>
    );
  }

  if (bookingQuery.isLoading) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("booking.loading")}
      </p>
    );
  }

  if (bookingQuery.error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {bookingQuery.error.message}
      </div>
    );
  }

  const data = bookingQuery.data;
  const booking = data.booking;

  async function cancelBooking() {
    try {
      const result = await cancelMutation.mutateAsync(reason);
      setMessage(result.message);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>{booking.serviceNameSnapshot}</CardTitle>
          <Badge>{formatStatus(booking.status, t)}</Badge>
          {booking.payment ? <Badge variant={booking.payment.status === "SUCCEEDED" ? "success" : "warning"}>Payment: {booking.payment.status === "SUCCEEDED" ? "Paid" : booking.payment.status === "PENDING" ? "Pending" : booking.payment.status}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        {booking.status === "CONFIRMED" && booking.payment?.method === "BUSINESS_LOCATION" ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"><p className="font-semibold">Booking Confirmed</p><p className="mt-1">Payment will be collected at the business location.</p></div> : null}
        {booking.status === "CONFIRMED" && booking.payment?.method === "CARD" && booking.payment?.status === "SUCCEEDED" ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"><p className="font-semibold">Booking Confirmed</p><p className="mt-1">Payment Received</p></div> : null}
        {message ? <div className="rounded-2xl bg-growth-dashboard p-4">{message}</div> : null}
        <p>
          {t("booking.reference")}: {booking.bookingNumber}
        </p>
        <p>
          {t("booking.appointment")}:{" "}
          {formatLocalizedDateTime(
            booking.startsAt,
            booking.timezone,
            language,
            {
              dateStyle: "full",
              timeStyle: "short"
            }
          )}
        </p>
        <p>
          {t("booking.cancellationDeadline")}:{" "}
          {formatLocalizedDateTime(
            data.cancellationDeadline,
            booking.timezone,
            language,
            {
              dateStyle: "medium",
              timeStyle: "short"
            }
          )}
        </p>
        {data.canCancel ? (
          <div className="space-y-3 border-t border-growth-border pt-4">
            <Input
              placeholder={t("booking.cancellationReason")}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
            <Button variant="destructive" disabled={cancelMutation.isPending} onClick={cancelBooking}>
              {cancelMutation.isPending
                ? t("booking.canceling")
                : t("booking.cancel")}
            </Button>
          </div>
        ) : (
          <p className="rounded-2xl bg-growth-dashboard p-4">
            {t("booking.cannotCancel")}
          </p>
        )}
        {booking.status === "COMPLETED" ? (
          <div className="space-y-3 border-t border-growth-border pt-4">
            <div>
              <h2 className="text-lg font-bold text-growth-sidebar">
                {t("review.experience")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("review.description")}
              </p>
            </div>
            {reviewQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">
                {t("review.loading")}
              </p>
            ) : reviewQuery.error ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {reviewQuery.error.message}
              </p>
            ) : (
              <PublicReviewForm
                bookingNumber={bookingNumber}
                businessSlug={businessSlug}
                review={reviewQuery.data?.review}
                token={token}
              />
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
