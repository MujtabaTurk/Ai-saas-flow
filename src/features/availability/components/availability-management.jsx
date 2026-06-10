"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DAYS_OF_WEEK } from "@/features/availability/constants";
import {
  useAvailability,
  useCreateAvailability,
  useCreateUnavailableDate,
  useDeleteAvailability,
  useDeleteUnavailableDate,
  useUnavailableDates,
  useUpdateAvailability,
  useUpdateAvailabilityStatus,
  useUpdateUnavailableDate
} from "@/features/availability/hooks/use-availability";
import { formatDateTimeInTimezone, formatTimeRange } from "@/features/availability/time";
import { useServices } from "@/features/services/hooks/use-services";
import { AvailabilityForm } from "./availability-form";
import { UnavailableDateForm } from "./unavailable-date-form";

export function AvailabilityManagement({
  businessId,
  timezone,
  isReadOnly = false
}) {
  const [tab, setTab] = useState("weekly");
  const [mode, setMode] = useState("list");
  const [selectedItem, setSelectedItem] = useState(null);
  const [message, setMessage] = useState(null);
  const [operationError, setOperationError] = useState(null);

  const availabilityQuery = useAvailability(businessId);
  const unavailableDatesQuery = useUnavailableDates(businessId);
  const servicesQuery = useServices(businessId);
  const createAvailabilityMutation = useCreateAvailability(businessId);
  const updateAvailabilityMutation = useUpdateAvailability(businessId);
  const deleteAvailabilityMutation = useDeleteAvailability(businessId);
  const statusMutation = useUpdateAvailabilityStatus(businessId);
  const createUnavailableMutation = useCreateUnavailableDate(businessId);
  const updateUnavailableMutation = useUpdateUnavailableDate(businessId);
  const deleteUnavailableMutation = useDeleteUnavailableDate(businessId);

  const availability = useMemo(
    () => availabilityQuery.data?.availability || [],
    [availabilityQuery.data?.availability]
  );
  const availabilitySummary = availabilityQuery.data?.summary;
  const unavailableDates = useMemo(
    () => unavailableDatesQuery.data?.unavailableDates || [],
    [unavailableDatesQuery.data?.unavailableDates]
  );
  const unavailableSummary = unavailableDatesQuery.data?.summary;
  const services = useMemo(() => servicesQuery.data?.services || [], [servicesQuery.data?.services]);

  const groupedAvailability = useMemo(
    () =>
      DAYS_OF_WEEK.map((day) => ({
        ...day,
        ranges: availability.filter((item) => item.dayOfWeek === day.value)
      })),
    [availability]
  );

  function closeForm() {
    setMode("list");
    setSelectedItem(null);
  }

  function showSuccess(nextMessage) {
    setOperationError(null);
    setMessage(nextMessage);
  }

  async function handleAvailabilitySubmit(values, helpers) {
    const result =
      mode === "edit"
        ? await updateAvailabilityMutation.mutateAsync({
            availabilityId: selectedItem.id,
            values
          })
        : await createAvailabilityMutation.mutateAsync(values);

    showSuccess(result.message);
    helpers.resetForm();
    closeForm();
  }

  async function handleUnavailableSubmit(values, helpers) {
    const result =
      mode === "edit"
        ? await updateUnavailableMutation.mutateAsync({
            unavailableDateId: selectedItem.id,
            values
          })
        : await createUnavailableMutation.mutateAsync(values);

    showSuccess(result.message);
    helpers.resetForm();
    closeForm();
  }

  async function runAction(action) {
    try {
      const result = await action();
      showSuccess(result.message);
    } catch (error) {
      setMessage(null);
      setOperationError(error.message);
    }
  }

  if (mode !== "list" && tab === "weekly") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{mode === "edit" ? "Edit working hours" : "Add working hours"}</CardTitle>
        </CardHeader>
        <CardContent>
          <AvailabilityForm
            availability={mode === "edit" ? selectedItem : null}
            services={services}
            onCancel={closeForm}
            onSubmit={handleAvailabilitySubmit}
          />
        </CardContent>
      </Card>
    );
  }

  if (mode !== "list" && tab === "unavailable") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{mode === "edit" ? "Edit unavailable date" : "Add unavailable date"}</CardTitle>
        </CardHeader>
        <CardContent>
          <UnavailableDateForm
            services={services}
            timezone={timezone}
            unavailableDate={mode === "edit" ? selectedItem : null}
            onCancel={closeForm}
            onSubmit={handleUnavailableSubmit}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {message ? (
        <div className="rounded-2xl border border-growth-border bg-growth-mint/40 px-4 py-3 text-sm font-medium text-growth-sidebar">
          {message}
        </div>
      ) : null}
      {operationError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {operationError}
        </div>
      ) : null}
      {availabilityQuery.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {availabilityQuery.error.message}
        </div>
      ) : null}
      {unavailableDatesQuery.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {unavailableDatesQuery.error.message}
        </div>
      ) : null}
      {servicesQuery.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {servicesQuery.error.message}
        </div>
      ) : null}

      {isReadOnly ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This business is suspended. Scheduling configuration is available in read-only mode.
        </div>
      ) : null}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex gap-2 rounded-2xl border border-growth-border bg-white p-1">
          <Button
            size="sm"
            variant={tab === "weekly" ? "default" : "ghost"}
            onClick={() => {
              setTab("weekly");
              closeForm();
            }}
          >
            Weekly schedule
          </Button>
          <Button
            size="sm"
            variant={tab === "unavailable" ? "default" : "ghost"}
            onClick={() => {
              setTab("unavailable");
              closeForm();
            }}
          >
            Unavailable dates
          </Button>
        </div>
        <Button
          disabled={isReadOnly}
          onClick={() => {
            setMode("create");
            setSelectedItem(null);
          }}
        >
          {tab === "weekly" ? "Add working hours" : "Add unavailable date"}
        </Button>
      </div>

      {tab === "weekly" ? (
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Working days</p>
                <p className="mt-2 text-2xl font-bold text-growth-sidebar">
                  {availabilitySummary?.workingDays ?? 0}/7
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Active ranges</p>
                <p className="mt-2 text-2xl font-bold text-growth-sidebar">
                  {availabilitySummary?.activeRanges ?? 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Service overrides</p>
                <p className="mt-2 text-2xl font-bold text-growth-sidebar">
                  {availabilitySummary?.serviceSpecificRanges ?? 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Slot interval</p>
                <p className="mt-2 text-2xl font-bold text-growth-sidebar">
                  {availabilitySummary?.shortestSlotDurationMin
                    ? `${availabilitySummary.shortestSlotDurationMin}-${availabilitySummary.longestSlotDurationMin}m`
                    : "None"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Weekly working hours</CardTitle>
              <p className="text-sm text-muted-foreground">
                All times use {timezone}. Gaps between ranges act as break times. Service-specific ranges override
                the global schedule for that service.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {availabilityQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading working hours...</p>
              ) : (
                groupedAvailability.map((day) => (
                  <div
                    className="grid gap-3 rounded-2xl border border-growth-border bg-white p-4 md:grid-cols-[140px_1fr]"
                    key={day.value}
                  >
                    <div>
                      <p className="font-bold text-growth-sidebar">{day.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {day.ranges.filter((range) => range.isActive).length > 0 ? "Working" : "Closed"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {day.ranges.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No working hours configured.</p>
                      ) : (
                        day.ranges.map((range) => (
                          <div
                            className="flex flex-col justify-between gap-3 rounded-2xl bg-growth-dashboard px-4 py-3 md:flex-row md:items-center"
                            key={range.id}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-growth-sidebar">
                                {formatTimeRange(range.startTime, range.endTime)}
                              </span>
                              <Badge variant={range.isActive ? "success" : "outline"}>
                                {range.isActive ? "Active" : "Inactive"}
                              </Badge>
                              {range.service ? <Badge variant="warning">Service override</Badge> : null}
                              <span className="text-xs text-muted-foreground">
                                {range.service?.name || "All services"} | every {range.slotDurationMin} min
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                disabled={isReadOnly}
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedItem(range);
                                  setMode("edit");
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                disabled={isReadOnly || statusMutation.isPending}
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  runAction(() =>
                                    statusMutation.mutateAsync({
                                      availabilityId: range.id,
                                      isActive: !range.isActive
                                    })
                                  )
                                }
                              >
                                {range.isActive ? "Deactivate" : "Activate"}
                              </Button>
                              <Button
                                disabled={isReadOnly || deleteAvailabilityMutation.isPending}
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  if (window.confirm("Delete this working-hours range?")) {
                                    runAction(() => deleteAvailabilityMutation.mutateAsync(range.id));
                                  }
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Upcoming</p>
                <p className="mt-2 text-2xl font-bold text-growth-sidebar">
                  {unavailableSummary?.upcoming ?? 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Full-day</p>
                <p className="mt-2 text-2xl font-bold text-growth-sidebar">
                  {unavailableSummary?.fullDay ?? 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Partial-day</p>
                <p className="mt-2 text-2xl font-bold text-growth-sidebar">
                  {unavailableSummary?.partialDay ?? 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Service-specific</p>
                <p className="mt-2 text-2xl font-bold text-growth-sidebar">
                  {unavailableSummary?.serviceSpecific ?? 0}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Unavailable dates</CardTitle>
              <p className="text-sm text-muted-foreground">
                Full-day or partial-day exceptions override the weekly schedule.
              </p>
            </CardHeader>
            <CardContent>
              {unavailableDatesQuery.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading unavailable dates...</p>
              ) : unavailableDates.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-growth-border bg-growth-dashboard p-8 text-center">
                  <h3 className="font-bold text-growth-sidebar">No unavailable dates</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Add holidays, maintenance windows, or temporary closures.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unavailableDates.map((item) => {
                    const start = formatDateTimeInTimezone(item.startsAt, timezone);
                    const end = formatDateTimeInTimezone(item.endsAt, timezone);

                    return (
                      <div
                        className="flex flex-col justify-between gap-4 rounded-2xl border border-growth-border bg-white p-4 md:flex-row md:items-center"
                        key={item.id}
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-growth-sidebar">{start.date}</p>
                            <Badge>{item.isFullDay ? "Full day" : `${start.time} - ${end.time}`}</Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {item.service?.name || "Entire business"}
                            {item.reason ? ` | ${item.reason}` : ""}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            disabled={isReadOnly}
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedItem(item);
                              setMode("edit");
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            disabled={isReadOnly || deleteUnavailableMutation.isPending}
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (window.confirm("Delete this unavailable date?")) {
                                runAction(() => deleteUnavailableMutation.mutateAsync(item.id));
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
