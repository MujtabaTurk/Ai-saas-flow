"use client";

import { useState } from "react";
import {
  BarChart3,
  CalendarCheck,
  CircleDollarSign,
  Star,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Tooltip } from "@/components/ui/tooltip";
import {
  ChartSkeleton,
  MetricCardsSkeleton,
  Skeleton,
  TableSkeleton,
  useDelayedVisibility
} from "@/components/ui/skeleton";
import { ANALYTICS_PERIOD_OPTIONS } from "@/features/analytics/constants";
import { useAnalytics } from "@/features/analytics/hooks/use-analytics";

function formatMoney(cents, currency) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency || "usd",
    maximumFractionDigits: 0
  }).format((cents || 0) / 100);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC"
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatHour(hour) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    timeZone: "UTC"
  }).format(new Date(Date.UTC(2026, 0, 1, hour)));
}

function humanize(value) {
  return String(value || "")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^\w/, (character) => character.toUpperCase());
}

function comparisonLabel(value) {
  if (value === null) {
    return "New versus the previous period";
  }

  if (value === 0) {
    return "No change versus the previous period";
  }

  return `${value > 0 ? "+" : ""}${value}% versus the previous period`;
}

function comparisonClass(value) {
  if (value === null || value === 0) {
    return "text-muted-foreground";
  }

  return value > 0 ? "text-emerald-700" : "text-red-700";
}

function MetricCard({
  label,
  value,
  helper,
  comparison,
  icon: Icon
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold text-growth-sidebar">
            {value}
          </p>
          {comparison !== undefined ? (
            <p
              className={`mt-1 text-xs ${comparisonClass(comparison)}`}
            >
              {comparisonLabel(comparison)}
            </p>
          ) : helper ? (
            <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
          ) : null}
        </div>
        {Icon ? (
          <div className="rounded-2xl bg-growth-mint/50 p-3 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function DistributionBar({ label, value, total, detail }) {
  const percent = total === 0 ? 0 : Math.round((value / total) * 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between gap-4 text-sm">
        <span className="font-medium text-growth-sidebar">{label}</span>
        <span className="text-muted-foreground">
          {detail || `${value} | ${percent}%`}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-growth-dashboard">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function BookingTrend({ trend }) {
  const maxBookings = Math.max(
    ...trend.points.map((point) => point.bookings),
    1
  );

  return (
    <div>
      <div className="flex h-64 min-w-[680px] items-end gap-2 border-b border-growth-border px-2 pt-5">
        {trend.points.map((point) => {
          const height = Math.max(
            Math.round((point.bookings / maxBookings) * 210),
            point.bookings > 0 ? 8 : 2
          );
          const completedHeight =
            point.bookings === 0
              ? 0
              : Math.round((point.completed / point.bookings) * height);
          const pointSummary = `${point.startDate} to ${point.endDate}: ${point.bookings} bookings, ${point.completed} completed, ${point.canceled} canceled`;

          return (
            <Tooltip content={pointSummary} key={point.startDate}>
              <div className="flex min-w-0 flex-1 flex-col items-center justify-end">
                <span className="mb-1 text-[10px] text-muted-foreground">
                  {point.bookings}
                </span>
                <div
                  className="relative w-full max-w-8 overflow-hidden rounded-t-lg bg-growth-mint"
                  style={{ height: `${height}px` }}
                >
                  <div
                    className="absolute inset-x-0 bottom-0 bg-primary"
                    style={{ height: `${completedHeight}px` }}
                  />
                </div>
              </div>
            </Tooltip>
          );
        })}
      </div>
      <div className="mt-3 flex justify-between text-xs text-muted-foreground">
        <span>{formatDate(trend.points[0]?.startDate)}</span>
        <span>
          {trend.bucketDays === 1
            ? "Daily booking volume"
            : `${trend.bucketDays}-day booking groups`}
        </span>
        <span>{formatDate(trend.points.at(-1)?.endDate)}</span>
      </div>
      <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-growth-mint" />
          Total
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-primary" />
          Completed
        </span>
      </div>
    </div>
  );
}

function ServicePerformance({ services, currency }) {
  if (services.length === 0) {
    return (
      <EmptyState
        title="No service activity"
        description="Service performance appears after bookings fall inside the selected period."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-growth-border">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead className="bg-growth-mint/50 text-growth-sidebar">
          <tr>
            <th className="px-4 py-3 font-semibold">Service</th>
            <th className="px-4 py-3 font-semibold">Bookings</th>
            <th className="px-4 py-3 font-semibold">Completed</th>
            <th className="px-4 py-3 font-semibold">Completion</th>
            <th className="px-4 py-3 font-semibold">Booked value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-growth-border bg-white">
          {services.map((service) => (
            <tr className="hover:bg-growth-mint/20" key={service.serviceId}>
              <td className="px-4 py-4 font-semibold text-growth-sidebar">
                {service.name}
              </td>
              <td className="px-4 py-4 text-muted-foreground">
                {service.bookings}
              </td>
              <td className="px-4 py-4 text-muted-foreground">
                {service.completed}
              </td>
              <td className="px-4 py-4">
                <Badge variant="outline">{service.completionRate}%</Badge>
              </td>
              <td className="px-4 py-4 text-muted-foreground">
                {formatMoney(service.bookedValueCents, currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TeamWorkload({ workload, currency }) {
  if (workload.length === 0) {
    return (
      <EmptyState
        title="No assigned workload"
        description="Assign bookings to team members to compare workload here."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-growth-border">
      <table className="w-full min-w-[700px] border-collapse text-left text-sm">
        <thead className="bg-growth-mint/50 text-growth-sidebar">
          <tr>
            <th className="px-4 py-3 font-semibold">Team member</th>
            <th className="px-4 py-3 font-semibold">Bookings</th>
            <th className="px-4 py-3 font-semibold">Completed</th>
            <th className="px-4 py-3 font-semibold">Completion</th>
            <th className="px-4 py-3 font-semibold">Booked value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-growth-border bg-white">
          {workload.map((member) => (
            <tr
              className="hover:bg-growth-mint/20"
              key={member.membershipId || "unassigned"}
            >
              <td className="px-4 py-4 font-semibold text-growth-sidebar">
                {member.name}
              </td>
              <td className="px-4 py-4 text-muted-foreground">
                {member.bookings}
              </td>
              <td className="px-4 py-4 text-muted-foreground">
                {member.completed}
              </td>
              <td className="px-4 py-4">
                <Badge variant="outline">{member.completionRate}%</Badge>
              </td>
              <td className="px-4 py-4 text-muted-foreground">
                {formatMoney(member.bookedValueCents, currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AnalyticsDashboard({
  businessId,
  businessCurrency,
  businessTimezone
}) {
  const [days, setDays] = useState(30);
  const analyticsQuery = useAnalytics(businessId, days);
  const showAnalyticsSkeleton = useDelayedVisibility(analyticsQuery.isLoading);
  const report = analyticsQuery.data?.analytics;
  const access = analyticsQuery.data?.access;
  const overview = report?.overview;
  const advanced = report?.advanced;

  if (analyticsQuery.isLoading) {
    if (!showAnalyticsSkeleton) {
      return <div className="min-h-96" role="status" aria-label="Loading business analytics" />;
    }

    return (
      <div className="space-y-6" role="status" aria-label="Loading business analytics">
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-growth-border bg-white p-4 md:flex-row md:items-center">
          <div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-36 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="mt-3 h-4 w-96 max-w-full" />
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton className="h-9 w-20 rounded-xl" key={index} />
            ))}
          </div>
        </div>
        <MetricCardsSkeleton count={4} />
        <section className="grid gap-5 xl:grid-cols-[1.45fr_0.55fr]">
          <ChartSkeleton />
          <ChartSkeleton bars={5} />
        </section>
        <MetricCardsSkeleton count={4} />
        <div className="grid gap-5 xl:grid-cols-2">
          <TableSkeleton columns={5} rows={5} minWidth="760px" />
          <TableSkeleton columns={5} rows={5} minWidth="700px" />
        </div>
      </div>
    );
  }

  if (analyticsQuery.isError) {
    return (
      <ErrorState
        description={analyticsQuery.error.message}
        onAction={() => analyticsQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-growth-border bg-white p-4 md:flex-row md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={access.isAdvanced ? "success" : "outline"}>
              {access.isAdvanced ? "Advanced analytics" : "Basic analytics"}
            </Badge>
            <Badge variant="outline">{access.planCode} plan</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Appointments from {formatDate(report.period.startDate)} through{" "}
            {formatDate(report.period.endDate)} in {businessTimezone}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ANALYTICS_PERIOD_OPTIONS.map((periodDays) => (
            <Button
              disabled={!access.allowedPeriods.includes(periodDays)}
              key={periodDays}
              size="sm"
              variant={days === periodDays ? "default" : "outline"}
              onClick={() => setDays(periodDays)}
            >
              {periodDays === 365 ? "1 year" : `${periodDays} days`}
            </Button>
          ))}
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          comparison={overview.bookings.changePercent}
          icon={CalendarCheck}
          label="Bookings"
          value={overview.bookings.total}
        />
        <MetricCard
          comparison={overview.value.changePercent}
          icon={CircleDollarSign}
          label="Booked value"
          value={formatMoney(
            overview.value.bookedValueCents,
            report.currency || businessCurrency
          )}
        />
        <MetricCard
          comparison={overview.customers.changePercent}
          icon={Users}
          label="Booking customers"
          value={overview.customers.uniqueBookingCustomers}
        />
        <MetricCard
          helper={`${overview.bookings.completed} completed appointments`}
          icon={BarChart3}
          label="Completion rate"
          value={`${overview.bookings.completionRate}%`}
        />
      </section>

      {overview.value.mismatchedCurrencyBookings > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {overview.value.mismatchedCurrencyBookings} booking value record(s)
          were excluded because their snapshot currency differs from the
          business currency.
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1.45fr_0.55fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Booking trend</CardTitle>
            <p className="text-sm text-muted-foreground">
              Appointment volume by scheduled date. The darker section shows
              completed bookings.
            </p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <BookingTrend trend={report.trend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking outcomes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {report.statusDistribution.map((entry) => (
              <DistributionBar
                key={entry.status}
                label={humanize(entry.status)}
                total={overview.bookings.total}
                value={entry.bookings}
              />
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          helper={`${overview.bookings.completedHours} delivered hours`}
          label="Completed value"
          value={formatMoney(
            overview.value.completedValueCents,
            report.currency || businessCurrency
          )}
        />
        <MetricCard
          helper={`${overview.bookings.canceled} canceled bookings`}
          label="Cancellation rate"
          value={`${overview.bookings.cancellationRate}%`}
        />
        <MetricCard
          helper={`${overview.bookings.noShow} no-show bookings`}
          label="No-show rate"
          value={`${overview.bookings.noShowRate}%`}
        />
        <MetricCard
          comparison={overview.reviews.publishedChangePercent}
          icon={Star}
          label="Published reviews"
          value={overview.reviews.published}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Customer and reputation snapshot</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-growth-dashboard p-4">
            <p className="text-sm font-semibold text-growth-sidebar">
              New customer profiles
            </p>
            <p className="mt-2 text-2xl font-bold text-growth-sidebar">
              {overview.customers.newCustomerProfiles}
            </p>
          </div>
          <div className="rounded-2xl bg-growth-dashboard p-4">
            <p className="text-sm font-semibold text-growth-sidebar">
              Average public rating
            </p>
            <p className="mt-2 text-2xl font-bold text-growth-sidebar">
              {overview.reviews.averageRating ?? "No rating"}
            </p>
          </div>
          <div className="rounded-2xl bg-growth-dashboard p-4">
            <p className="text-sm font-semibold text-growth-sidebar">
              Previous-period bookings
            </p>
            <p className="mt-2 text-2xl font-bold text-growth-sidebar">
              {overview.bookings.previousTotal}
            </p>
          </div>
        </CardContent>
      </Card>

      {!access.isAdvanced ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-900">
              Advanced analytics requires Pro
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-800">
            Pro unlocks flexible reporting periods, service performance,
            customer retention, booking sources, demand patterns, and team
            workload.
          </CardContent>
        </Card>
      ) : null}

      {advanced ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Service performance</CardTitle>
              <p className="text-sm text-muted-foreground">
                Historical service names and prices come from booking snapshots,
                so later catalog edits do not rewrite this report.
              </p>
            </CardHeader>
            <CardContent>
              <ServicePerformance
                currency={report.currency}
                services={advanced.servicePerformance}
              />
            </CardContent>
          </Card>

          <section className="grid gap-5 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Customer retention</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-growth-dashboard p-4">
                  <p className="text-sm text-muted-foreground">
                    Unique booking customers
                  </p>
                  <p className="mt-2 text-2xl font-bold text-growth-sidebar">
                    {advanced.customerRetention.uniqueBookingCustomers}
                  </p>
                </div>
                <div className="rounded-2xl bg-growth-dashboard p-4">
                  <p className="text-sm text-muted-foreground">
                    Returning customers
                  </p>
                  <p className="mt-2 text-2xl font-bold text-growth-sidebar">
                    {advanced.customerRetention.returningBookingCustomers}
                  </p>
                </div>
                <div className="rounded-2xl bg-growth-dashboard p-4">
                  <p className="text-sm text-muted-foreground">
                    First-time customers
                  </p>
                  <p className="mt-2 text-2xl font-bold text-growth-sidebar">
                    {advanced.customerRetention.firstTimeBookingCustomers}
                  </p>
                </div>
                <div className="rounded-2xl bg-growth-dashboard p-4">
                  <p className="text-sm text-muted-foreground">
                    Returning rate
                  </p>
                  <p className="mt-2 text-2xl font-bold text-growth-sidebar">
                    {advanced.customerRetention.returningRate}%
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Booking sources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {advanced.sourceDistribution.map((entry) => (
                  <DistributionBar
                    detail={`${entry.bookings} | ${entry.percentage}%`}
                    key={entry.source}
                    label={humanize(entry.source)}
                    total={overview.bookings.total}
                    value={entry.bookings}
                  />
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Demand by weekday</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {advanced.demand.weekdays.map((entry) => (
                  <DistributionBar
                    detail={`${entry.bookings} bookings`}
                    key={entry.weekday}
                    label={humanize(entry.weekday)}
                    total={Math.max(
                      ...advanced.demand.weekdays.map(
                        (weekday) => weekday.bookings
                      ),
                      1
                    )}
                    value={entry.bookings}
                  />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Peak appointment hours</CardTitle>
              </CardHeader>
              <CardContent>
                {advanced.demand.hours.length === 0 ? (
                  <EmptyState
                    title="No demand pattern yet"
                    description="Peak hours appear after bookings fall inside this period."
                  />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {advanced.demand.hours.map((entry) => (
                      <div
                        className="rounded-2xl bg-growth-dashboard p-4"
                        key={entry.hour}
                      >
                        <p className="font-semibold text-growth-sidebar">
                          {formatHour(entry.hour)}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {entry.bookings} booking
                          {entry.bookings === 1 ? "" : "s"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Team booking workload</CardTitle>
              <p className="text-sm text-muted-foreground">
                This reports assigned booking outcomes, not capacity
                utilization.
              </p>
            </CardHeader>
            <CardContent>
              <TeamWorkload
                currency={report.currency}
                workload={advanced.teamWorkload}
              />
            </CardContent>
          </Card>
        </>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Booked value is calculated from service price snapshots and is not
        confirmed payment revenue. Reports use appointment dates in{" "}
        {businessTimezone}.
      </p>
    </div>
  );
}
