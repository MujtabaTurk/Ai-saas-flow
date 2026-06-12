"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useBookings,
  useBookingSettings,
  useUpdateBookingAssignment,
  useUpdateBookingNotes,
  useUpdateBookingSettings,
  useUpdateBookingStatus
} from "@/features/bookings/hooks/use-bookings";
import { useServices } from "@/features/services/hooks/use-services";
import { useTeam } from "@/features/team/hooks/use-team";
import { BookingSettingsForm } from "./booking-settings-form";
import { DashboardBookingForm } from "./dashboard-booking-form";

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

export function BookingManagement({
  businessId,
  timezone,
  isReadOnly,
  businessRole
}) {
  const [mode, setMode] = useState("list");
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const filters = useMemo(
    () => ({ status, search: deferredSearch, page, pageSize: 25 }),
    [status, deferredSearch, page]
  );
  const bookingsQuery = useBookings(businessId, filters);
  const settingsQuery = useBookingSettings(businessId);
  const servicesQuery = useServices(businessId);
  const teamQuery = useTeam(businessId);
  const statusMutation = useUpdateBookingStatus(businessId);
  const notesMutation = useUpdateBookingNotes(businessId);
  const assignmentMutation = useUpdateBookingAssignment(businessId);
  const settingsMutation = useUpdateBookingSettings(businessId);
  const bookings = useMemo(() => bookingsQuery.data?.bookings || [], [bookingsQuery.data?.bookings]);
  const summary = bookingsQuery.data?.summary;
  const access = summary?.access;
  const settingsAccess = settingsQuery.data?.access;
  const services = useMemo(
    () => servicesQuery.data?.services || [],
    [servicesQuery.data?.services]
  );
  const activeServices = services.filter((service) => service.isActive);
  const canCreateBooking =
    access?.canCreate === true && activeServices.length > 0;
  const canConfigure =
    settingsAccess?.canConfigure ??
    (!isReadOnly && access?.subscriptionEntitled === true);
  const pagination = bookingsQuery.data?.pagination;
  const teamMembers = teamQuery.data?.members || [];
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

  async function editInternalNotes(booking) {
    const internalNotes = window.prompt(
      "Internal notes:",
      booking.internalNotes || ""
    );

    if (internalNotes === null) {
      return;
    }

    try {
      const result = await notesMutation.mutateAsync({
        bookingId: booking.id,
        internalNotes
      });
      setError(null);
      setMessage(result.message);
    } catch (actionError) {
      setMessage(null);
      setError(actionError.message);
    }
  }

  async function changeAssignment(booking, membershipId) {
    try {
      const result = await assignmentMutation.mutateAsync({
        bookingId: booking.id,
        membershipId: membershipId || null
      });
      setError(null);
      setMessage(result.message);
    } catch (actionError) {
      setMessage(null);
      setError(actionError.message);
    }
  }

  if (mode === "create") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create booking</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardBookingForm
            bookingWindowDays={
              settingsQuery.data?.settings?.bookingWindowDays || 30
            }
            businessId={businessId}
            services={services}
            timezone={timezone}
            onCancel={() => setMode("list")}
            onSuccess={(result) => {
              setError(null);
              setMessage(result.message);
              setMode("list");
            }}
          />
        </CardContent>
      </Card>
    );
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
      {servicesQuery.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {servicesQuery.error.message}
        </div>
      ) : null}

      {access?.businessStatus !== "ACTIVE" || isReadOnly ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This business is suspended. New bookings are blocked; existing bookings remain visible and operational.
        </div>
      ) : null}

      {access &&
      access.businessStatus === "ACTIVE" &&
      !access.subscriptionEntitled ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          An active subscription is required before accepting new bookings
          {access.canConfigure ? "." : " or changing booking settings."} Existing
          appointments remain operational.
        </div>
      ) : null}

      {access?.createBlockedReason === "PLAN_LIMIT_REACHED" ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          The current plan has reached its booking limit. Existing appointments
          can still be managed.
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

      {businessRole !== "STAFF" ? (
      <div className="flex justify-end">
        <Button
          disabled={
            !canCreateBooking ||
            servicesQuery.isLoading ||
            bookingsQuery.isLoading
          }
          onClick={() => setMode("create")}
        >
          Create booking
        </Button>
      </div>
      ) : null}

      {businessRole !== "STAFF" ? (
      <Card>
        <CardHeader>
          <CardTitle>Booking rules</CardTitle>
        </CardHeader>
        <CardContent>
          {settingsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading settings...</p>
          ) : (
            <BookingSettingsForm
              disabled={!canConfigure}
              settings={settingsQuery.data?.settings}
              onSubmit={(values) => settingsMutation.mutateAsync(values)}
            />
          )}
        </CardContent>
      </Card>
      ) : null}

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
                  onClick={() => {
                    setStatus(option);
                    setPage(1);
                  }}
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
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
          {summary ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Showing {bookings.length} of {summary.filteredTotal} matching
              bookings.
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
                        {formatDateTime(booking.startsAt, timezone)} |{" "}
                        {businessRole === "STAFF" ? (
                          <span className="font-medium text-growth-sidebar">
                            {booking.customerName}
                          </span>
                        ) : (
                          <Link
                            className="font-medium text-primary hover:underline"
                            href={`/dashboard/customers/${booking.customerId}`}
                          >
                            {booking.customerName}
                          </Link>
                        )}{" "}
                        | {booking.customerEmail}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.bookingNumber} | Source: {booking.source}
                      </p>
                      {booking.internalNotes ? (
                        <p className="max-w-2xl rounded-xl bg-growth-dashboard px-3 py-2 text-xs text-muted-foreground">
                          Internal: {booking.internalNotes}
                        </p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">
                        Assigned to:{" "}
                        <span className="font-semibold text-growth-sidebar">
                          {booking.assignedMember?.user?.name ||
                            booking.assignedMember?.user?.email ||
                            "Unassigned"}
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {access?.canAssign ? (
                        <select
                          className="h-9 rounded-xl border border-input bg-white px-3 text-sm"
                          disabled={assignmentMutation.isPending}
                          value={booking.assignedMemberId || ""}
                          onChange={(event) =>
                            changeAssignment(booking, event.target.value)
                          }
                        >
                          <option value="">Unassigned</option>
                          {teamMembers
                            .filter((member) =>
                              member.serviceAssignments.some(
                                (assignment) =>
                                  assignment.serviceId === booking.serviceId
                              )
                            )
                            .map((member) => (
                              <option key={member.id} value={member.id}>
                                {member.user.name || member.user.email}
                              </option>
                            ))}
                        </select>
                      ) : null}
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
                      <Button
                        disabled={notesMutation.isPending}
                        size="sm"
                        variant="outline"
                        onClick={() => editInternalNotes(booking)}
                      >
                        Internal notes
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {pagination && pagination.totalItems > 0 ? (
            <div className="mt-5 flex flex-col justify-between gap-3 border-t border-growth-border pt-4 sm:flex-row sm:items-center">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  disabled={
                    !pagination.hasPreviousPage || bookingsQuery.isFetching
                  }
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setPage((currentPage) => Math.max(currentPage - 1, 1))
                  }
                >
                  Previous
                </Button>
                <Button
                  disabled={!pagination.hasNextPage || bookingsQuery.isFetching}
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setPage((currentPage) => currentPage + 1)
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
