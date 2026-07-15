"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { HorizontalScrollArea } from "@/components/ui/scroll-area";
import {
  MetricCardsSkeleton,
  Skeleton,
  TableSkeleton,
  useDelayedVisibility
} from "@/components/ui/skeleton";
import {
  AdminPagination,
  AdminSelect,
  AdminSummaryCard,
  adminStatusVariant,
  formatAdminDate
} from "@/features/admin/components/admin-shared";
import { useAdminPlans, useAdminSubscriptions } from "@/features/admin/hooks/use-admin";

export function SubscriptionManagement() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [planCode, setPlanCode] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const filters = useMemo(
    () => ({
      search: deferredSearch,
      planCode,
      status,
      page,
      pageSize: 25
    }),
    [deferredSearch, page, planCode, status]
  );
  const subscriptionsQuery = useAdminSubscriptions(filters);
  const plansQuery = useAdminPlans();
  const showSubscriptionsSkeleton = useDelayedVisibility(
    subscriptionsQuery.isLoading
  );
  const subscriptions = subscriptionsQuery.data?.subscriptions || [];
  const summary = subscriptionsQuery.data?.summary;
  const pagination = subscriptionsQuery.data?.pagination;

  if (subscriptionsQuery.isLoading) {
    if (!showSubscriptionsSkeleton) {
      return <div className="min-h-96" role="status" aria-label="Loading subscriptions" />;
    }

    return (
      <div className="space-y-5" role="status" aria-label="Loading subscriptions">
        <MetricCardsSkeleton count={5} className="md:grid-cols-5 xl:grid-cols-5" />
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
            <div className="grid gap-3 pt-3 md:grid-cols-[1fr_auto_auto]">
              <Skeleton className="h-11 rounded-2xl" />
              <Skeleton className="h-11 w-32 rounded-2xl" />
              <Skeleton className="h-11 w-40 rounded-2xl" />
            </div>
          </CardHeader>
          <CardContent>
            <TableSkeleton columns={6} rows={6} minWidth="1150px" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (subscriptionsQuery.isError) {
    return (
      <ErrorState
        description={subscriptionsQuery.error.message}
        onAction={() => subscriptionsQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-growth-border bg-growth-mint/30 px-4 py-3 text-sm text-growth-sidebar">
        Subscription records are read-only here. Stripe webhooks remain the
        billing source of truth.
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <AdminSummaryCard label="Records" value={summary?.total ?? 0} />
        <AdminSummaryCard label="Active" value={summary?.active ?? 0} />
        <AdminSummaryCard label="Trialing" value={summary?.trialing ?? 0} />
        <AdminSummaryCard
          label="Past due"
          tone="warning"
          value={summary?.pastDue ?? 0}
        />
        <AdminSummaryCard
          label="Canceled"
          tone="danger"
          value={summary?.canceled ?? 0}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription oversight</CardTitle>
          <div className="grid gap-3 pt-3 md:grid-cols-[1fr_auto_auto]">
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
                setPlanCode(event.target.value);
                setPage(1);
              }}
              value={planCode}
            >
              <option value="ALL">All plans</option>
              {(plansQuery.data?.plans || []).map((plan) => (
                <option key={plan.code} value={plan.code}>{plan.name}</option>
              ))}
            </AdminSelect>
            <AdminSelect
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              value={status}
            >
              <option value="ALL">All statuses</option>
              <option value="TRIALING">Trialing</option>
              <option value="ACTIVE">Active</option>
              <option value="PAST_DUE">Past due</option>
              <option value="CANCELED">Canceled</option>
              <option value="INCOMPLETE">Incomplete</option>
              <option value="INCOMPLETE_EXPIRED">Incomplete expired</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PAUSED">Paused</option>
            </AdminSelect>
          </div>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <EmptyState
              title="No subscriptions found"
              description="No subscription matches the current filters."
            />
          ) : (
            <HorizontalScrollArea className="rounded-2xl border border-growth-border">
              <table className="w-full min-w-[1150px] border-collapse text-start text-sm">
                <thead className="bg-growth-mint/50 text-growth-sidebar">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Business</th>
                    <th className="px-4 py-3 font-semibold">Plan</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Period</th>
                    <th className="px-4 py-3 font-semibold">Payment signal</th>
                    <th className="px-4 py-3 font-semibold">Stripe linkage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-growth-border bg-white">
                  {subscriptions.map((subscription) => (
                    <tr
                      className="hover:bg-growth-mint/20"
                      key={subscription.id}
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold text-growth-sidebar">
                          {subscription.business.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {subscription.business.owner.email || "No owner email"}
                        </p>
                        {subscription.business.status !== "ACTIVE" ? (
                          <Badge
                            className="mt-2"
                            variant={adminStatusVariant(
                              subscription.business.status
                            )}
                          >
                            Tenant {subscription.business.status}
                          </Badge>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">
                        <Badge>{subscription.planCode}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant={adminStatusVariant(subscription.status)}
                        >
                          {subscription.status}
                        </Badge>
                        {subscription.cancelAtPeriodEnd ? (
                          <p className="mt-2 text-xs text-amber-700">
                            Cancels at period end
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        <p>
                          Start:{" "}
                          {formatAdminDate(subscription.currentPeriodStart)}
                        </p>
                        <p>
                          End: {formatAdminDate(subscription.currentPeriodEnd)}
                        </p>
                        {subscription.trialEndsAt ? (
                          <p>
                            Trial: {formatAdminDate(subscription.trialEndsAt)}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        <p>
                          Last paid:{" "}
                          {formatAdminDate(subscription.lastPaymentAt)}
                        </p>
                        <p className={subscription.lastPaymentFailedAt ? "text-red-700" : ""}>
                          Last failed:{" "}
                          {formatAdminDate(subscription.lastPaymentFailedAt)}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        <p>
                          Customer:{" "}
                          {subscription.stripeCustomerId ? "Linked" : "Missing"}
                        </p>
                        <p>
                          Subscription:{" "}
                          {subscription.stripeSubscriptionId
                            ? "Linked"
                            : "Local only"}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </HorizontalScrollArea>
          )}

          <AdminPagination
            isFetching={subscriptionsQuery.isFetching}
            itemCount={subscriptions.length}
            onPageChange={setPage}
            pagination={pagination}
          />
        </CardContent>
      </Card>
    </div>
  );
}
