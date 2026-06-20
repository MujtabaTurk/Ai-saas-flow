"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { ErrorDialog } from "@/components/ui/error-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { Modal } from "@/components/ui/modal";
import {
  CardListSkeleton,
  MetricCardsSkeleton,
  Skeleton,
  useDelayedVisibility
} from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  useCustomer,
  useDeleteCustomer,
  useUpdateCustomer
} from "@/features/customers/hooks/use-customers";
import { CustomerForm } from "./customer-form";

function formatDateTime(value, timezone) {
  return new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatPrice(booking) {
  if (
    booking.servicePriceCentsSnapshot === null ||
    booking.servicePriceCentsSnapshot === undefined
  ) {
    return "Free";
  }

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: booking.serviceCurrencySnapshot
  }).format(booking.servicePriceCentsSnapshot / 100);
}

function statusVariant(status) {
  if (status === "CONFIRMED" || status === "COMPLETED") {
    return "success";
  }

  if (status === "CANCELED") {
    return "destructive";
  }

  if (status === "PENDING") {
    return "warning";
  }

  return "outline";
}

export function CustomerProfile({
  businessId,
  customerId,
  businessLocale,
  businessTimezone,
  isReadOnly = false
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [mode, setMode] = useState("view");
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const customerQuery = useCustomer(businessId, customerId, page);
  const updateMutation = useUpdateCustomer(businessId, customerId);
  const deleteMutation = useDeleteCustomer(businessId, customerId);
  const showCustomerSkeleton = useDelayedVisibility(customerQuery.isLoading);

  if (customerQuery.isLoading) {
    if (!showCustomerSkeleton) {
      return <div className="min-h-96" role="status" aria-label="Loading customer profile" />;
    }

    return (
      <div className="space-y-5" role="status" aria-label="Loading customer profile">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-9 w-56" />
            <Skeleton className="mt-3 h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-2xl" />
            <Skeleton className="h-10 w-20 rounded-2xl" />
          </div>
        </div>
        <MetricCardsSkeleton count={4} />
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-5">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index}>
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="mt-2 h-4 w-48" />
                  <Skeleton className="mt-2 h-3 w-36" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent>
              <CardListSkeleton count={4} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (customerQuery.error) {
    return (
      <ErrorState
        description={customerQuery.error.message}
        onAction={() => customerQuery.refetch()}
      />
    );
  }

  const data = customerQuery.data;
  const customer = data.customer;
  const summary = data.summary;
  const pagination = data.pagination;
  const effectiveReadOnly = isReadOnly || data.access?.isReadOnly === true;

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync();
      setDeleteDialogOpen(false);
      showToast({ title: "Customer deleted.", variant: "success" });
      router.push("/dashboard/customers");
      router.refresh();
    } catch (error) {
      setDeleteDialogOpen(false);
      setActionError({
        description: "We could not delete this customer. Customers with booking history must remain available for records.",
        details: error.message,
        title: "Delete customer failed"
      });
    }
  }

  return (
    <div className="space-y-5">
      <ErrorDialog
        description={actionError?.description}
        details={actionError?.details}
        open={Boolean(actionError)}
        title={actionError?.title}
        onOpenChange={(open) => {
          if (!open) {
            setActionError(null);
          }
        }}
      />

      <ConfirmationDialog
        confirmLabel="Delete customer"
        description={`This permanently deletes "${customer.name}" only if the customer has no booking history.`}
        isLoading={deleteMutation.isPending}
        loadingLabel="Deleting..."
        open={deleteDialogOpen}
        title="Delete customer?"
        onConfirm={handleDelete}
        onOpenChange={setDeleteDialogOpen}
      />

      <Modal
        description="Update contact details, preferences, marketing consent, and private customer notes."
        isDismissDisabled={updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setMode("view");
          }
        }}
        open={mode === "edit"}
        size="lg"
        title="Edit customer"
      >
        <CustomerForm
          businessLocale={businessLocale}
          businessTimezone={businessTimezone}
          customer={customer}
          onCancel={() => setMode("view")}
          onSubmit={async (values) => {
            const result = await updateMutation.mutateAsync(values);
            showToast({ title: result.message, variant: "success" });
            setMode("view");
          }}
        />
      </Modal>

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Link
            className="text-sm font-semibold text-primary hover:underline"
            href="/dashboard/customers"
          >
            Back to customers
          </Link>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-growth-sidebar">
            {customer.name}
          </h2>
          <p className="text-muted-foreground">{customer.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={effectiveReadOnly}
            variant="outline"
            onClick={() => setMode("edit")}
          >
            Edit profile
          </Button>
          <Button
            disabled={
              effectiveReadOnly ||
              deleteMutation.isPending ||
              summary.bookingTotal > 0
            }
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete
          </Button>
        </div>
      </div>

      {effectiveReadOnly ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This business is suspended. The customer profile is available in
          read-only mode.
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Total bookings
            </p>
            <p className="mt-2 text-2xl font-bold text-growth-sidebar">
              {summary.bookingTotal}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Upcoming
            </p>
            <p className="mt-2 text-2xl font-bold text-growth-sidebar">
              {summary.upcoming}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Completed
            </p>
            <p className="mt-2 text-2xl font-bold text-growth-sidebar">
              {summary.completed}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Canceled
            </p>
            <p className="mt-2 text-2xl font-bold text-growth-sidebar">
              {summary.canceled}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Contact
              </p>
              <p className="mt-1 font-medium text-growth-sidebar">
                {customer.email}
              </p>
              <p className="text-muted-foreground">
                {customer.phone || "No phone provided"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Preferences
              </p>
              <p className="mt-1 text-muted-foreground">
                {customer.locale || businessLocale} |{" "}
                {customer.timezone || businessTimezone}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Marketing
              </p>
              <Badge
                className="mt-1"
                variant={customer.marketingOptIn ? "success" : "outline"}
              >
                {customer.marketingOptIn
                  ? "Consent recorded"
                  : "No consent recorded"}
              </Badge>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                Private notes
              </p>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                {customer.notes || "No private notes yet."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking history</CardTitle>
          </CardHeader>
          <CardContent>
            {data.bookings.length === 0 ? (
              <p className="rounded-2xl bg-growth-dashboard p-6 text-center text-sm text-muted-foreground">
                This customer has no booking history.
              </p>
            ) : (
              <div className="space-y-3">
                {data.bookings.map((booking) => (
                  <div
                    className="rounded-2xl border border-growth-border bg-white p-4"
                    key={booking.id}
                  >
                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-growth-sidebar">
                            {booking.serviceNameSnapshot}
                          </p>
                          <Badge variant={statusVariant(booking.status)}>
                            {booking.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatDateTime(
                            booking.startsAt,
                            booking.timezone || businessTimezone
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {booking.bookingNumber} | {booking.source}
                        </p>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="font-semibold text-growth-sidebar">
                          {formatPrice(booking)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {booking.serviceDurationMinSnapshot} minutes
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pagination.totalItems > 0 ? (
              <div className="mt-5 flex flex-col justify-between gap-3 border-t border-growth-border pt-4 sm:flex-row sm:items-center">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    disabled={
                      !pagination.hasPreviousPage || customerQuery.isFetching
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
                    disabled={
                      !pagination.hasNextPage || customerQuery.isFetching
                    }
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
    </div>
  );
}
