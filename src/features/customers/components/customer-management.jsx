"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  MetricCardsSkeleton,
  TableSkeleton,
  useDelayedVisibility
} from "@/components/ui/skeleton";
import {
  useCreateCustomer,
  useCustomers
} from "@/features/customers/hooks/use-customers";
import { CustomerForm } from "./customer-form";

function SelectField({ children, ...props }) {
  return (
    <select
      className="h-11 rounded-2xl border border-input bg-white px-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      {...props}
    >
      {children}
    </select>
  );
}

function formatDate(value, timezone) {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    dateStyle: "medium"
  }).format(new Date(value));
}

export function CustomerManagement({
  businessId,
  businessLocale,
  businessTimezone,
  isReadOnly = false
}) {
  const [mode, setMode] = useState("list");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [marketing, setMarketing] = useState("ALL");
  const [sort, setSort] = useState("CREATED_DESC");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState(null);
  const filters = useMemo(
    () => ({
      search: deferredSearch,
      marketing,
      sort,
      page,
      pageSize: 25
    }),
    [deferredSearch, marketing, page, sort]
  );
  const customersQuery = useCustomers(businessId, filters);
  const createMutation = useCreateCustomer(businessId);
  const showCustomersSkeleton = useDelayedVisibility(customersQuery.isLoading);
  const customers = useMemo(
    () => customersQuery.data?.customers || [],
    [customersQuery.data?.customers]
  );
  const summary = customersQuery.data?.summary;
  const access = customersQuery.data?.access;
  const pagination = customersQuery.data?.pagination;
  const effectiveReadOnly = isReadOnly || access?.isReadOnly === true;
  const canManage =
    !effectiveReadOnly &&
    !customersQuery.isLoading &&
    !customersQuery.isError &&
    access?.canManage === true;

  if (mode === "create") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create customer</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerForm
            businessLocale={businessLocale}
            businessTimezone={businessTimezone}
            onCancel={() => setMode("list")}
            onSubmit={async (values, helpers) => {
              const result = await createMutation.mutateAsync(values);
              helpers.resetForm();
              setMessage(result.message);
              setMode("list");
            }}
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

      {customersQuery.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {customersQuery.error.message}
        </div>
      ) : null}

      {effectiveReadOnly ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This business is suspended. Customer records are available in
          read-only mode.
        </div>
      ) : null}

      {customersQuery.isLoading ? (
        showCustomersSkeleton ? (
          <MetricCardsSkeleton count={4} />
        ) : (
          <div className="min-h-28" role="status" aria-label="Loading customer metrics" />
        )
      ) : (
      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Total customers
            </p>
            <p className="mt-2 text-2xl font-bold text-growth-sidebar">
              {summary?.total ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              With bookings
            </p>
            <p className="mt-2 text-2xl font-bold text-growth-sidebar">
              {summary?.withBookings ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Marketing consent
            </p>
            <p className="mt-2 text-2xl font-bold text-growth-sidebar">
              {summary?.marketingOptedIn ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              New this month
            </p>
            <p className="mt-2 text-2xl font-bold text-growth-sidebar">
              {summary?.newThisMonth ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <CardTitle>Customer directory</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Profiles are created automatically from bookings. You can also
                add customers manually.
              </p>
            </div>
            <Button disabled={!canManage} onClick={() => setMode("create")}>
              Create customer
            </Button>
          </div>

          <div className="grid gap-3 pt-3 lg:grid-cols-[1fr_auto_auto]">
            <Input
              placeholder="Search name, email, or phone..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
            <SelectField
              value={marketing}
              onChange={(event) => {
                setMarketing(event.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All consent states</option>
              <option value="OPTED_IN">Marketing opted in</option>
              <option value="NOT_OPTED_IN">Not opted in</option>
            </SelectField>
            <SelectField
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
            >
              <option value="CREATED_DESC">Newest customers</option>
              <option value="CREATED_ASC">Oldest customers</option>
              <option value="UPDATED_DESC">Recently updated</option>
              <option value="NAME_ASC">Name A-Z</option>
            </SelectField>
          </div>
        </CardHeader>

        <CardContent>
          {customersQuery.isLoading ? (
            showCustomersSkeleton ? (
              <TableSkeleton columns={6} rows={6} minWidth="900px" />
            ) : (
              <div className="min-h-80" role="status" aria-label="Loading customers" />
            )
          ) : customers.length === 0 ? (
            <EmptyState
              title="No customers found"
              description="Customer profiles appear automatically after a booking, or you can create one manually."
              action={
                <Button
                  disabled={!canManage}
                  onClick={() => setMode("create")}
                >
                  Create first customer
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-growth-border">
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead className="bg-growth-mint/50 text-growth-sidebar">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">Bookings</th>
                    <th className="px-4 py-3 font-semibold">Last appointment</th>
                    <th className="px-4 py-3 font-semibold">Consent</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-growth-border bg-white">
                  {customers.map((customer) => (
                    <tr
                      className="hover:bg-growth-mint/20"
                      key={customer.id}
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold text-growth-sidebar">
                          {customer.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {customer.email}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {customer.phone || "Not provided"}
                      </td>
                      <td className="px-4 py-4">
                        <Badge>{customer.bookingCount}</Badge>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        <p>
                          {formatDate(
                            customer.lastBooking?.startsAt,
                            businessTimezone
                          )}
                        </p>
                        {customer.lastBooking ? (
                          <p className="text-xs">
                            {customer.lastBooking.serviceNameSnapshot}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant={
                            customer.marketingOptIn ? "success" : "outline"
                          }
                        >
                          {customer.marketingOptIn
                            ? "Opted in"
                            : "Not opted in"}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/customers/${customer.id}`}>
                            View profile
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination && pagination.totalItems > 0 ? (
            <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-sm text-muted-foreground">
                Showing {customers.length} of {pagination.totalItems}. Page{" "}
                {pagination.page} of {pagination.totalPages}.
              </p>
              <div className="flex gap-2">
                <Button
                  disabled={
                    !pagination.hasPreviousPage || customersQuery.isFetching
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
                    !pagination.hasNextPage || customersQuery.isFetching
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
  );
}
