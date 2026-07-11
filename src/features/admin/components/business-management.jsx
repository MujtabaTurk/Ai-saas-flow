"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { ActionErrorDialog } from "@/components/ui/action-error-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { HorizontalScrollArea } from "@/components/ui/scroll-area";
import {
  MetricCardsSkeleton,
  Skeleton,
  TableSkeleton,
  useDelayedVisibility
} from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {
  AdminPagination,
  AdminSelect,
  AdminSummaryCard,
  adminStatusVariant,
  formatAdminDate
} from "@/features/admin/components/admin-shared";
import {
  useAdminBusinesses,
  useUpdateAdminBusinessStatus
} from "@/features/admin/hooks/use-admin";

export function BusinessManagement() {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pendingStatuses, setPendingStatuses] = useState({});
  const [actionError, setActionError] = useState(null);
  const [statusReasonDialog, setStatusReasonDialog] = useState(null);
  const filters = useMemo(
    () => ({
      search: deferredSearch,
      status,
      page,
      pageSize: 25
    }),
    [deferredSearch, page, status]
  );
  const businessesQuery = useAdminBusinesses(filters);
  const updateMutation = useUpdateAdminBusinessStatus();
  const showBusinessesSkeleton = useDelayedVisibility(
    businessesQuery.isLoading
  );
  const businesses = businessesQuery.data?.businesses || [];
  const summary = businessesQuery.data?.summary;
  const pagination = businessesQuery.data?.pagination;

  async function applyStatus(business) {
    const nextStatus = pendingStatuses[business.id] || business.status;

    if (nextStatus === business.status) {
      return;
    }

    if (["SUSPENDED", "ARCHIVED"].includes(nextStatus)) {
      setStatusReasonDialog({
        business,
        nextStatus,
        reason: "",
        validationError: null
      });
      return;
    }

    await submitBusinessStatus(business, nextStatus, null);
  }

  async function submitBusinessStatus(business, nextStatus, reason) {
    try {
      const result = await updateMutation.mutateAsync({
        businessId: business.id,
        status: nextStatus,
        reason
      });
      showToast({ title: result.message, variant: "success" });
      setPendingStatuses((current) => {
        const next = { ...current };
        delete next[business.id];
        return next;
      });
      return true;
    } catch (error) {
      setActionError({
        description: "We could not update this tenant status. Please review the details and try again.",
        details: error.message,
        title: "Tenant status update failed"
      });
      return false;
    }
  }

  async function submitStatusReason(event) {
    event.preventDefault();

    if (!statusReasonDialog) {
      return;
    }

    const reason = statusReasonDialog.reason.trim();

    if (reason.length < 3) {
      setStatusReasonDialog((current) =>
        current
          ? {
              ...current,
              validationError: "Provide a short reason before restricting a business."
            }
          : current
      );
      return;
    }

    const success = await submitBusinessStatus(
      statusReasonDialog.business,
      statusReasonDialog.nextStatus,
      reason
    );

    if (success) {
      setStatusReasonDialog(null);
    }
  }

  if (businessesQuery.isLoading) {
    if (!showBusinessesSkeleton) {
      return <div className="min-h-96" role="status" aria-label="Loading businesses" />;
    }

    return (
      <div className="space-y-5" role="status" aria-label="Loading businesses">
        <MetricCardsSkeleton count={4} />
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-96 max-w-full" />
            <div className="grid gap-3 pt-3 md:grid-cols-[1fr_auto]">
              <Skeleton className="h-11 rounded-2xl" />
              <Skeleton className="h-11 w-40 rounded-2xl" />
            </div>
          </CardHeader>
          <CardContent>
            <TableSkeleton columns={6} rows={6} minWidth="1100px" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (businessesQuery.isError) {
    return (
      <ErrorState
        description={businessesQuery.error.message}
        onAction={() => businessesQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-5">
      <ActionErrorDialog
        error={actionError}
        onClear={() => setActionError(null)}
      />

      <Modal
        description={
          statusReasonDialog
            ? `Record why ${statusReasonDialog.business.name} should be marked ${statusReasonDialog.nextStatus.toLowerCase()}.`
            : ""
        }
        isDismissDisabled={updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setStatusReasonDialog(null);
          }
        }}
        open={Boolean(statusReasonDialog)}
        title="Status change reason"
      >
        <form className="space-y-4" onSubmit={submitStatusReason}>
          <div className="space-y-2">
            <Label htmlFor="business-status-reason">Reason</Label>
            <Textarea
              id="business-status-reason"
              rows={5}
              value={statusReasonDialog?.reason || ""}
              onChange={(event) =>
                setStatusReasonDialog((current) =>
                  current
                    ? {
                        ...current,
                        reason: event.target.value,
                        validationError: null
                      }
                    : current
                )
              }
            />
            {statusReasonDialog?.validationError ? (
              <p className="text-xs text-[hsl(var(--error-foreground))]">
                {statusReasonDialog.validationError}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              disabled={updateMutation.isPending}
              type="button"
              variant="outline"
              onClick={() => setStatusReasonDialog(null)}
            >
              Cancel
            </Button>
            <Button
              disabled={updateMutation.isPending}
              isLoading={updateMutation.isPending}
              loadingLabel="Applying..."
              type="submit"
              variant="destructive"
            >
              Apply status
            </Button>
          </div>
        </form>
      </Modal>

      <div className="grid gap-3 md:grid-cols-4">
        <AdminSummaryCard label="Total tenants" value={summary?.total ?? 0} />
        <AdminSummaryCard label="Active" value={summary?.active ?? 0} />
        <AdminSummaryCard
          label="Suspended"
          tone="warning"
          value={summary?.suspended ?? 0}
        />
        <AdminSummaryCard
          label="Archived"
          tone="danger"
          value={summary?.archived ?? 0}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business directory</CardTitle>
          <p className="text-sm text-muted-foreground">
            Suspending a tenant blocks new bookings and configuration writes,
            while existing records remain available.
          </p>
          <div className="grid gap-3 pt-3 md:grid-cols-[1fr_auto]">
            <Input
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search business, slug, or owner email..."
              value={search}
            />
            <AdminSelect
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              value={status}
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="ARCHIVED">Archived</option>
            </AdminSelect>
          </div>
        </CardHeader>
        <CardContent>
          {businesses.length === 0 ? (
            <EmptyState
              title="No businesses found"
              description="No tenant matches the current filters."
            />
          ) : (
            <HorizontalScrollArea className="rounded-2xl border border-growth-border">
              <table className="w-full min-w-[1100px] border-collapse text-start text-sm">
                <thead className="bg-growth-mint/50 text-growth-sidebar">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Business</th>
                    <th className="px-4 py-3 font-semibold">Owner</th>
                    <th className="px-4 py-3 font-semibold">Subscription</th>
                    <th className="px-4 py-3 font-semibold">Usage</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                    <th className="px-4 py-3 font-semibold">Status action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-growth-border bg-card">
                  {businesses.map((business) => (
                    <tr className="hover:bg-growth-mint/20" key={business.id}>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-growth-sidebar">
                          {business.name}
                        </p>
                        <Link
                          className="text-xs text-primary hover:underline"
                          href={`/${business.slug}`}
                          rel="noreferrer"
                          target="_blank"
                        >
                          /{business.slug}
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <p>{business.owner.name || "Unnamed owner"}</p>
                        <p className="text-xs text-muted-foreground">
                          {business.owner.email || "No email"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        {business.subscription ? (
                          <div className="flex flex-wrap gap-2">
                            <Badge>{business.subscription.planCode}</Badge>
                            <Badge
                              variant={adminStatusVariant(
                                business.subscription.status
                              )}
                            >
                              {business.subscription.status}
                            </Badge>
                          </div>
                        ) : (
                          <Badge variant="destructive">Missing</Badge>
                        )}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        <p>{business._count.services} services</p>
                        <p>{business._count.bookings} bookings</p>
                        <p>{business._count.customers} customers</p>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {formatAdminDate(business.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <AdminSelect
                            className="min-w-36"
                            onChange={(event) =>
                              setPendingStatuses((current) => ({
                                ...current,
                                [business.id]: event.target.value
                              }))
                            }
                            value={
                              pendingStatuses[business.id] || business.status
                            }
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="SUSPENDED">Suspended</option>
                            <option value="ARCHIVED">Archived</option>
                          </AdminSelect>
                          <Button
                            disabled={
                              updateMutation.isPending ||
                              (pendingStatuses[business.id] ||
                                business.status) === business.status
                            }
                            onClick={() => applyStatus(business)}
                            size="sm"
                          >
                            Apply
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </HorizontalScrollArea>
          )}

          <AdminPagination
            isFetching={businessesQuery.isFetching}
            itemCount={businesses.length}
            onPageChange={setPage}
            pagination={pagination}
          />
        </CardContent>
      </Card>
    </div>
  );
}
