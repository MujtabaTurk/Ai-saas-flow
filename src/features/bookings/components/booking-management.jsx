"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useBookings,
  useBookingSettings,
  useUpdateBookingSettings,
  useUpdateBookingStatus
} from "@/features/bookings/hooks/use-bookings";
import { BookingSettingsForm } from "./booking-settings-form";

const STATUS_OPTIONS = ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELED", "NO_SHOW"];

function formatDateTime(value, timezone) {
  return new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function statusVariant(status) {
  if (status === "CONFIRMED" || status === "COMPLETED") return "success";
  if (status === "CANCELED") return "destructive";
  if (status === "PENDING") return "warning";
  return "outline";
}

export function BookingManagement({ businessId, timezone, isReadOnly }) {
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const filters = useMemo(() => ({ status, search }), [status, search]);
  const bookingsQuery = useBookings(businessId, filters);
  const settingsQuery = useBookingSettings(businessId);
  const statusMutation = useUpdateBookingStatus(businessId, filters);
  const settingsMutation = useUpdateBookingSettings(businessId);
  const bookings = useMemo(() => bookingsQuery.data?.bookings || [], [bookingsQuery.data?.bookings]);
  const summary = bookingsQuery.data?.summary;
  const listLimit = bookingsQuery.data?.limit;
  const planUsageLabel =
    summary?.plan?.limit === null
      ? `${summary?.plan?.used ?? 0} used / unlimited`
      : summary?.plan?.limit
        ? `${summary.plan.used}/${summary.plan.limit} used`
        : "Plan usage unavailable";

  function getStatusCount(option) {
    if (!summary?.statusCounts) {
      return null;
    }

    if (option === "ALL") {
      return Object.values(summary.statusCounts).reduce((total, count) => total + count, 0);
    }

    return summary.statusCounts[option] ?? 0;
  }

  async function changeStatus(booking, nextStatus) {
    let cancellationReason = null;

    if (nextStatus === "CANCELED") {
      cancellationReason = window.prompt("Cancellation reason:", "Canceled by business");

      if (cancellationReason === null) {
        return;
      }
    }

    try {
      const result = await statusMutation.mutateAsync({
        bookingId: booking.id,
        values: {
          status: nextStatus,
          cancellationReason
        }
      });
      setError(null);
      setMessage(result.message);
    } catch (actionError) {
      setMessage(null);
      setError(actionError.message);
    }
  }

  return (
    <div className="space-y-6">
      {message ? (
        <div className="rounded-2xl border border-growth-border bg-growth-mint/40 px-4 py-3 text-sm text-growth-sidebar">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {bookingsQuery.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {bookingsQuery.error.message}
        </div>
      ) : null}
      {settingsQuery.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {settingsQuery.error.message}
        </div>
      ) : null}

      {isReadOnly ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This business is suspended. New bookings are blocked; existing bookings remain visible and operational.
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Today</p>
            <p className="mt-2 text-2xl font-bold text-growth-sidebar">{summary?.today ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Upcoming</p>
            <p className="mt-2 text-2xl font-bold text-growth-sidebar">{summary?.upcoming ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Pending</p>
            <p className="mt-2 text-2xl font-bold text-growth-sidebar">
              {summary?.statusCounts?.PENDING ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              {summary?.plan?.code ? `${summary.plan.code} plan` : "Plan usage"}
            </p>
            <p className="mt-2 text-lg font-bold text-growth-sidebar">{planUsageLabel}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking rules</CardTitle>
        </CardHeader>
        <CardContent>
          {settingsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading settings...</p>
          ) : (
            <BookingSettingsForm
              disabled={isReadOnly}
              settings={settingsQuery.data?.settings}
              onSubmit={(values) => settingsMutation.mutateAsync(values)}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <CardTitle>Bookings</CardTitle>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => (
                <Button
                  key={option}
                  size="sm"
                  variant={status === option ? "default" : "outline"}
                  onClick={() => setStatus(option)}
                >
                  {option.replace("_", " ")}
                  {getStatusCount(option) !== null ? ` (${getStatusCount(option)})` : ""}
                </Button>
              ))}
            </div>
          </div>
          <Input
            className="mt-4"
            placeholder="Search booking number, customer, email, or service..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {summary ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Showing {bookings.length} of {summary.filteredTotal} matching bookings
              {listLimit && summary.filteredTotal > listLimit ? `, limited to the latest ${listLimit}` : ""}.
            </p>
          ) : null}
        </CardHeader>
        <CardContent>
          {bookingsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading bookings...</p>
          ) : bookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-growth-border bg-growth-dashboard p-8 text-center">
              <h3 className="font-bold text-growth-sidebar">No bookings found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Public bookings will appear here when customers reserve available slots.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div
                  className="rounded-2xl border border-growth-border bg-white p-4"
                  key={booking.id}
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-growth-sidebar">{booking.serviceNameSnapshot}</p>
                        <Badge variant={statusVariant(booking.status)}>{booking.status.replace("_", " ")}</Badge>
                        {booking.paymentRequiredSnapshot ? <Badge variant="warning">Payment required</Badge> : null}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(booking.startsAt, timezone)} | {booking.customerName} | {booking.customerEmail}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.bookingNumber} | Source: {booking.source}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {booking.status === "PENDING" ? (
                        <Button size="sm" onClick={() => changeStatus(booking, "CONFIRMED")}>
                          Confirm
                        </Button>
                      ) : null}
                      {booking.status === "CONFIRMED" ? (
                        <>
                          <Button size="sm" onClick={() => changeStatus(booking, "COMPLETED")}>
                            Complete
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => changeStatus(booking, "NO_SHOW")}>
                            No-show
                          </Button>
                        </>
                      ) : null}
                      {["PENDING", "CONFIRMED"].includes(booking.status) ? (
                        <Button size="sm" variant="destructive" onClick={() => changeStatus(booking, "CANCELED")}>
                          Cancel
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
