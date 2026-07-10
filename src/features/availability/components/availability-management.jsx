"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { useMemo, useState } from "react";
import { ActionErrorDialog } from "@/components/ui/action-error-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Modal } from "@/components/ui/modal";
import {
  CardListSkeleton,
  MetricCardsSkeleton,
  useDelayedVisibility
} from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
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
  const { showToast } = useToast();
  const [tab, setTab] = useState("weekly");
  const [mode, setMode] = useState("list");
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

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
  const showAvailabilitySkeleton = useDelayedVisibility(
    availabilityQuery.isLoading
  );
  const showUnavailableSkeleton = useDelayedVisibility(
    unavailableDatesQuery.isLoading
  );

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
  const access =
    availabilityQuery.data?.access || unavailableDatesQuery.data?.access || null;
  const effectiveReadOnly = isReadOnly || access?.isReadOnly === true;
  const canConfigure =
    !effectiveReadOnly &&
    !availabilityQuery.isLoading &&
    !availabilityQuery.isError &&
    access?.canConfigure === true;
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
    showToast({ title: nextMessage, variant: "success" });
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

  async function runAction(action, errorTitle = "Scheduling update failed") {
    try {
      const result = await action();
      showSuccess(result.message);
    } catch (error) {
      setActionError({
        description: "We could not update the scheduling configuration. Please review the details and try again.",
        details: error.message,
        title: errorTitle
      });
    }
  }

  async function confirmDeleteTarget() {
    if (!deleteTarget) {
      return;
    }

    const { item, type } = deleteTarget;

    try {
      const result =
        type === "availability"
          ? await deleteAvailabilityMutation.mutateAsync(item.id)
          : await deleteUnavailableMutation.mutateAsync(item.id);

      setDeleteTarget(null);
      showSuccess(result.message);
    } catch (error) {
      setDeleteTarget(null);
      setActionError({
        description:
          type === "availability"
            ? "We could not delete this working-hours range. Please try again."
            : "We could not delete this unavailable date. Please try again.",
        details: error.message,
        title:
          type === "availability"
            ? "Delete working hours failed"
            : "Delete unavailable date failed"
      });
    }
  }

  return (
    <div className="space-y-5">
      <ActionErrorDialog
        error={actionError}
        onClear={() => setActionError(null)}
      />

      <ConfirmationDialog
        confirmLabel={
          deleteTarget?.type === "availability"
            ? "Delete range"
            : "Delete unavailable date"
        }
        description={
          deleteTarget?.type === "availability"
            ? "This removes the selected working-hours range from your public scheduling rules."
            : "This removes the selected calendar exception and reopens any affected availability."
        }
        isLoading={
          deleteAvailabilityMutation.isPending ||
          deleteUnavailableMutation.isPending
        }
        loadingLabel="Deleting..."
        open={Boolean(deleteTarget)}
        title={
          deleteTarget?.type === "availability"
            ? "Delete working-hours range?"
            : "Delete unavailable date?"
        }
        onConfirm={confirmDeleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      />

      <Modal
        description="Configure recurring working hours and optional service-specific slot rules."
        isDismissDisabled={
          createAvailabilityMutation.isPending ||
          updateAvailabilityMutation.isPending
        }
        onOpenChange={(open) => {
          if (!open) {
            closeForm();
          }
        }}
        open={mode !== "list" && tab === "weekly"}
        size="lg"
        title={mode === "edit" ? "Edit working hours" : "Add working hours"}
      >
        <AvailabilityForm
          availability={mode === "edit" ? selectedItem : null}
          services={services}
          onCancel={closeForm}
          onSubmit={handleAvailabilitySubmit}
        />
      </Modal>

      <Modal
        description="Block full-day or partial-day scheduling for holidays, maintenance windows, or temporary closures."
        isDismissDisabled={
          createUnavailableMutation.isPending ||
          updateUnavailableMutation.isPending
        }
        onOpenChange={(open) => {
          if (!open) {
            closeForm();
          }
        }}
        open={mode !== "list" && tab === "unavailable"}
        size="lg"
        title={mode === "edit" ? "Edit unavailable date" : "Add unavailable date"}
      >
        <UnavailableDateForm
          services={services}
          timezone={timezone}
          unavailableDate={mode === "edit" ? selectedItem : null}
          onCancel={closeForm}
          onSubmit={handleUnavailableSubmit}
        />
      </Modal>
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

      {effectiveReadOnly ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This business is suspended. Scheduling configuration is available in read-only mode.
        </div>
      ) : null}

      {access &&
      !access.subscriptionEntitled &&
      !access.canConfigure &&
      !effectiveReadOnly ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          An active subscription is required to add, edit, or activate scheduling configuration.
          Existing ranges can still be deactivated or deleted.
        </div>
      ) : null}

      <TabsPrimitive.Root
        className="space-y-5"
        value={tab}
        onValueChange={(nextTab) => {
          setTab(nextTab);
          closeForm();
        }}
      >
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <TabsPrimitive.List className="flex flex-wrap gap-2 rounded-2xl border border-growth-border bg-white p-1">
            <TabsPrimitive.Trigger asChild value="weekly">
              <Button
                size="sm"
                variant={tab === "weekly" ? "default" : "ghost"}
              >
                Weekly schedule
              </Button>
            </TabsPrimitive.Trigger>
            <TabsPrimitive.Trigger asChild value="unavailable">
              <Button
                size="sm"
                variant={tab === "unavailable" ? "default" : "ghost"}
              >
                Unavailable dates
              </Button>
            </TabsPrimitive.Trigger>
          </TabsPrimitive.List>
          <Button
            disabled={!canConfigure}
            onClick={() => {
              setMode("create");
              setSelectedItem(null);
            }}
          >
            {tab === "weekly" ? "Add working hours" : "Add unavailable date"}
          </Button>
        </div>

        <TabsPrimitive.Content className="space-y-5" value="weekly">
          {availabilityQuery.isLoading ? (
            showAvailabilitySkeleton ? (
              <MetricCardsSkeleton count={4} />
            ) : (
              <div className="min-h-28" role="status" aria-label="Loading working-hours metrics" />
            )
          ) : (
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
          )}

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
                showAvailabilitySkeleton ? (
                  <CardListSkeleton count={7} />
                ) : (
                  <div className="min-h-96" role="status" aria-label="Loading working hours" />
                )
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
                                disabled={!canConfigure}
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
                                disabled={
                                  effectiveReadOnly ||
                                  statusMutation.isPending ||
                                  (!range.isActive && !canConfigure)
                                }
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
                                disabled={
                                  effectiveReadOnly ||
                                  deleteAvailabilityMutation.isPending
                                }
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  setDeleteTarget({
                                    item: range,
                                    type: "availability"
                                  })
                                }
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
        </TabsPrimitive.Content>

        <TabsPrimitive.Content className="space-y-5" value="unavailable">
          {unavailableDatesQuery.isLoading ? (
            showUnavailableSkeleton ? (
              <MetricCardsSkeleton count={4} />
            ) : (
              <div className="min-h-28" role="status" aria-label="Loading unavailable-date metrics" />
            )
          ) : (
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
          )}

          <Card>
            <CardHeader>
              <CardTitle>Unavailable dates</CardTitle>
              <p className="text-sm text-muted-foreground">
                Full-day or partial-day exceptions override the weekly schedule.
              </p>
            </CardHeader>
            <CardContent>
              {unavailableDatesQuery.isLoading ? (
                showUnavailableSkeleton ? (
                  <CardListSkeleton count={4} />
                ) : (
                  <div className="min-h-72" role="status" aria-label="Loading unavailable dates" />
                )
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
                            disabled={!canConfigure}
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
                            disabled={
                              effectiveReadOnly ||
                              deleteUnavailableMutation.isPending
                            }
                            size="sm"
                            variant="destructive"
                            onClick={() =>
                              setDeleteTarget({
                                item,
                                type: "unavailable"
                              })
                            }
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
        </TabsPrimitive.Content>
      </TabsPrimitive.Root>
    </div>
  );
}
