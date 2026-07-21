"use client";

import {
  ArrowLeft,
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Edit3,
  Globe2,
  Mail,
  MessageSquareText,
  Phone,
  ShieldCheck,
  Trash2,
  UserRound,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ActionErrorDialog } from "@/components/ui/action-error-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { Modal } from "@/components/ui/modal";
import {
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
import { cn } from "@/lib/utils";
import { CustomerForm } from "./customer-form";

function formatDateTime(value, timezone) {
  return new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatDate(value, timezone) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    dateStyle: "medium"
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

function readableStatus(status) {
  return status.replaceAll("_", " ");
}

function getInitials(name) {
  const parts = (name || "Customer")
    .split(/[\s._-]+/)
    .filter(Boolean);

  return (
    parts
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("") || "C"
  );
}

function isUpcomingBooking(booking) {
  return (
    new Date(booking.startsAt).getTime() >= Date.now() &&
    (booking.status === "PENDING" || booking.status === "CONFIRMED")
  );
}

function MetricCard({ icon: Icon, label, meta, value }) {
  return (
    <div className="rounded-[12px] border border-[#c7c4d8] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm leading-6 text-[#464555]">{label}</p>
        <span className="grid size-7 place-items-center rounded-md bg-[#eef2ff] text-[#3525cd]">
          <Icon className="size-3.5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-4xl font-bold leading-[44px] tracking-tight text-[#0b1c30]">
        {value}
      </p>
      {meta ? <p className="mt-1 text-sm leading-5 text-[#464555]">{meta}</p> : null}
    </div>
  );
}

function Panel({ children, className }) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[12px] border border-[#c7c4d8] bg-white shadow-sm",
        className
      )}
    >
      {children}
    </section>
  );
}

function PanelHeader({ children, icon: Icon, title }) {
  return (
    <div className="flex min-h-[73px] items-center justify-between border-b border-[#c7c4d8] px-6 py-5">
      <h3 className="text-base font-medium uppercase leading-6 tracking-[-0.025em] text-[#0b1c30]">
        {title}
      </h3>
      {children ||
        (Icon ? (
          <Icon className="size-4 text-[#464555]" aria-hidden="true" />
        ) : null)}
    </div>
  );
}

function DetailRow({ children, icon: Icon, label }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-[#e5eeff] text-[#3525cd]">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#777587]">
          {label}
        </p>
        <div className="mt-1 text-sm leading-5 text-[#464555]">{children}</div>
      </div>
    </div>
  );
}

function BookingTimelineItem({ booking, businessTimezone }) {
  const upcoming = isUpcomingBooking(booking);

  return (
    <article className="relative pl-9">
      <span
        className={cn(
          "absolute left-[-1px] top-1 grid size-6 place-items-center rounded-full border-2 bg-white",
          upcoming ? "border-[#3525cd] text-[#3525cd]" : "border-[#777587] text-[#777587]"
        )}
      >
        {upcoming ? (
          <CalendarCheck2 className="size-3" aria-hidden="true" />
        ) : (
          <span className="size-1.5 rounded-full bg-current" />
        )}
      </span>

      <div
        className={cn(
          "rounded-[8px] border p-4",
          upcoming
            ? "border-[#3525cd]/20 bg-[#3525cd]/5"
            : "border-transparent bg-white"
        )}
      >
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold uppercase tracking-[0.04em] text-[#3525cd]">
                {upcoming ? "Upcoming Appointment" : readableStatus(booking.status)}
              </p>
              <Badge variant={statusVariant(booking.status)}>
                {readableStatus(booking.status)}
              </Badge>
            </div>
            <h4 className="mt-2 text-base font-medium leading-6 text-[#0b1c30]">
              {booking.serviceNameSnapshot}
            </h4>
            <p className="mt-1 text-sm leading-5 text-[#464555]">
              Duration: {booking.serviceDurationMinSnapshot} mins | Source:{" "}
              {booking.source}
            </p>
            {booking.notes ? (
              <p className="mt-2 text-sm leading-5 text-[#777587]">
                {booking.notes}
              </p>
            ) : null}
            {booking.cancellationReason ? (
              <p className="mt-2 text-sm leading-5 text-red-700">
                {booking.cancellationReason}
              </p>
            ) : null}
          </div>
          <div className="shrink-0 text-start sm:text-end">
            <p className="text-sm leading-5 text-[#464555]">
              {formatDateTime(booking.startsAt, booking.timezone || businessTimezone)}
            </p>
            <p className="mt-2 text-sm font-semibold text-[#0b1c30]">
              {formatPrice(booking)}
            </p>
            <p className="text-xs text-[#777587]">{booking.bookingNumber}</p>
          </div>
        </div>
      </div>
    </article>
  );
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
      <div
        className="mx-auto max-w-[1024px] space-y-8"
        role="status"
        aria-label="Loading customer profile"
      >
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="flex gap-6">
            <Skeleton className="size-24 rounded-[16px]" />
            <div>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-3 h-11 w-72" />
              <Skeleton className="mt-3 h-5 w-80 max-w-full" />
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-11 w-32 rounded-[8px]" />
            <Skeleton className="h-11 w-24 rounded-[8px]" />
          </div>
        </div>
        <MetricCardsSkeleton count={4} />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_309px]">
          <Skeleton className="h-[420px] rounded-[12px]" />
          <div className="space-y-5">
            <Skeleton className="h-[260px] rounded-[12px]" />
            <Skeleton className="h-[260px] rounded-[12px]" />
          </div>
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
  const initials = getInitials(customer.name);
  const contactPhone = customer.phone || "No phone provided";
  const effectiveLocale = customer.locale || businessLocale;
  const effectiveTimezone = customer.timezone || businessTimezone;

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
    <div className="mx-auto max-w-[1024px] space-y-8">
      <ActionErrorDialog
        error={actionError}
        onClear={() => setActionError(null)}
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

      <div className="space-y-6">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#3525cd] transition-colors hover:text-[#2f22b6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3525cd]/30"
          href="/dashboard/customers"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to customers
        </Link>

        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-[16px] border border-[#c7c4d8] bg-[#d3e4fe] p-1 shadow-sm">
              <span className="grid size-full place-items-center rounded-[12px] bg-white/55 text-3xl font-bold text-[#0b1c30]">
                {initials}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-bold leading-[44px] tracking-tight text-[#0b1c30]">
                  {customer.name}
                </h1>
                <span className="rounded-sm border border-[#dcfce7] bg-[#f0fdf4] px-3 py-1 text-base leading-6 text-[#065f46]">
                  Active Customer
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm leading-5 text-[#464555]">
                <span className="inline-flex items-center gap-2">
                  <Mail className="size-3.5" aria-hidden="true" />
                  {customer.email}
                </span>
                <span className="hidden text-[#c7c4d8] sm:inline">|</span>
                <span className="inline-flex items-center gap-2">
                  <Phone className="size-3.5" aria-hidden="true" />
                  {contactPhone}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              className="h-[46px] rounded-[8px] border-[#c7c4d8] bg-white px-5 text-base font-normal text-[#0b1c30] hover:bg-[#eef2ff]"
              disabled={effectiveReadOnly}
              variant="outline"
              onClick={() => setMode("edit")}
            >
              <Edit3 className="me-2 size-4" aria-hidden="true" />
              Edit Profile
            </Button>
            <Button
              className="h-[46px] rounded-[8px] border-red-200 bg-white px-5 text-base font-normal text-red-700 hover:bg-red-50"
              disabled={
                effectiveReadOnly ||
                deleteMutation.isPending ||
                summary.bookingTotal > 0
              }
              variant="outline"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="me-2 size-4" aria-hidden="true" />
              Delete
            </Button>
          </div>
        </div>

        {effectiveReadOnly ? (
          <div className="rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This business is suspended. The customer profile is available in
            read-only mode.
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        <MetricCard
          icon={ClipboardList}
          label="Total Bookings"
          meta={`${summary.upcoming} upcoming`}
          value={summary.bookingTotal}
        />
        <MetricCard
          icon={CalendarClock}
          label="Upcoming"
          meta="Scheduled ahead"
          value={summary.upcoming}
        />
        <MetricCard
          icon={CheckCircle2}
          label="Completed"
          meta="Finished visits"
          value={summary.completed}
        />
        <MetricCard
          icon={XCircle}
          label="Canceled"
          meta="Historical records"
          value={summary.canceled}
        />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_309px]">
        <Panel>
          <div className="flex min-h-[81px] items-center justify-between border-b border-[#c7c4d8] px-6 py-5">
            <h2 className="text-2xl font-bold leading-8 text-[#0b1c30]">
              Booking History
            </h2>
            <Badge variant="outline">{pagination.totalItems} total</Badge>
          </div>

          <div className="p-6">
            {data.bookings.length === 0 ? (
              <p className="rounded-[12px] bg-[#eef4ff] p-6 text-center text-sm text-[#464555]">
                This customer has no booking history.
              </p>
            ) : (
              <div className="relative space-y-8 before:absolute before:bottom-6 before:left-[11px] before:top-2 before:w-px before:bg-[#c7c4d8]">
                {data.bookings.map((booking) => (
                  <BookingTimelineItem
                    booking={booking}
                    businessTimezone={businessTimezone}
                    key={booking.id}
                  />
                ))}
              </div>
            )}

            {pagination.totalItems > 0 ? (
              <div className="mt-8 flex flex-col justify-between gap-3 border-t border-[#c7c4d8] pt-5 sm:flex-row sm:items-center">
                <p className="text-sm text-[#464555]">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    className="rounded-[8px] border-[#c7c4d8] bg-white text-[#464555] hover:bg-[#eef2ff]"
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
                    className="rounded-[8px] border-[#c7c4d8] bg-white text-[#464555] hover:bg-[#eef2ff]"
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
          </div>
        </Panel>

        <div className="space-y-5">
          <Panel>
            <PanelHeader icon={UserRound} title="Profile Details" />
            <div className="space-y-5 p-6">
              <DetailRow icon={Mail} label="Email">
                <p className="break-words font-medium text-[#0b1c30]">
                  {customer.email}
                </p>
              </DetailRow>
              <DetailRow icon={Phone} label="Phone">
                <p>{contactPhone}</p>
              </DetailRow>
              <DetailRow icon={Globe2} label="Preferences">
                <p>
                  {effectiveLocale} | {effectiveTimezone}
                </p>
              </DetailRow>
              <DetailRow icon={ShieldCheck} label="Marketing">
                <Badge
                  className="mt-0"
                  variant={customer.marketingOptIn ? "success" : "outline"}
                >
                  {customer.marketingOptIn
                    ? "Consent recorded"
                    : "No consent recorded"}
                </Badge>
              </DetailRow>
              <DetailRow icon={CalendarCheck2} label="Customer Since">
                <p>{formatDate(customer.createdAt, effectiveTimezone)}</p>
              </DetailRow>
            </div>
          </Panel>

          <Panel>
            <PanelHeader icon={MessageSquareText} title="Internal Notes" />
            <div className="space-y-4 p-6">
              <div className="rounded-[8px] border border-[#fef3c7] bg-[#fffbeb] px-4 py-4">
                <p className="whitespace-pre-wrap text-sm italic leading-[22px] text-[#0b1c30]">
                  {customer.notes || "No private notes yet."}
                </p>
              </div>
              <div className="rounded-[8px] border border-[#c7c4d8] bg-white px-3 py-3 text-sm text-[#6b7280]">
                Last updated {formatDate(customer.updatedAt, effectiveTimezone)}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
