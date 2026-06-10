"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useCancelPublicBooking,
  usePublicBooking
} from "@/features/bookings/hooks/use-bookings";

export function PublicBookingManager({ businessSlug, bookingNumber, token }) {
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState(null);
  const bookingQuery = usePublicBooking(businessSlug, bookingNumber, token);
  const cancelMutation = useCancelPublicBooking(businessSlug, bookingNumber, token);

  if (!token) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        This booking link is invalid or incomplete.
      </div>
    );
  }

  if (bookingQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading booking...</p>;
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
          <Badge>{booking.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        {message ? <div className="rounded-2xl bg-growth-dashboard p-4">{message}</div> : null}
        <p>Reference: {booking.bookingNumber}</p>
        <p>
          Appointment:{" "}
          {new Intl.DateTimeFormat("en", {
            timeZone: booking.timezone,
            dateStyle: "full",
            timeStyle: "short"
          }).format(new Date(booking.startsAt))}
        </p>
        <p>
          Cancellation deadline:{" "}
          {new Intl.DateTimeFormat("en", {
            timeZone: booking.timezone,
            dateStyle: "medium",
            timeStyle: "short"
          }).format(new Date(data.cancellationDeadline))}
        </p>
        {data.canCancel ? (
          <div className="space-y-3 border-t border-growth-border pt-4">
            <Input
              placeholder="Optional cancellation reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
            <Button variant="destructive" disabled={cancelMutation.isPending} onClick={cancelBooking}>
              {cancelMutation.isPending ? "Canceling..." : "Cancel booking"}
            </Button>
          </div>
        ) : (
          <p className="rounded-2xl bg-growth-dashboard p-4">
            This booking can no longer be canceled online.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
