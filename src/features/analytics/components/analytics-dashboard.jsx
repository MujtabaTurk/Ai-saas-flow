"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  CalendarCheck,
  Clock3,
  CreditCard,
  LineChart,
  ListChecks,
  Star,
  TrendingUp,
  UserPlus,
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
import { useBookings } from "@/features/bookings/hooks/use-bookings";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import {
  useBusinessMemberships,
  useMembershipAnalytics
} from "@/features/memberships/hooks/use-memberships";
import { useTeam } from "@/features/team/hooks/use-team";
import { cn } from "@/lib/utils";

const kpiAccentClasses = {
  primary: "border-primary/20 bg-growth-mint/40 text-primary",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  sky: "border-sky-200 bg-sky-50 text-sky-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700"
};

function formatMoney(cents, currency) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency || "usd",
    maximumFractionDigits: 0
  }).format((cents || 0) / 100);
}

function formatDate(value) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC"
  }).format(new Date(`${value}T00:00:00Z`));
}

function formatDateTime(value, timezone = "UTC") {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone
  }).format(new Date(value));
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

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
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

function periodLabel(days) {
  return days === 365 ? "1 year" : `${days} days`;
}

function getTopEntry(entries, valueKey = "bookings") {
  return [...(entries || [])].sort(
    (left, right) => (right[valueKey] || 0) - (left[valueKey] || 0)
  )[0];
}

function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-growth-sidebar">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function WelcomeHeader({
  access,
  businessName,
  currentPlan,
  days,
  onDaysChange,
  period,
  timezone
}) {
  const allowedPeriods = access?.allowedPeriods || [30];

  return (
    <section className="rounded-2xl border border-growth-border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={access?.isAdvanced ? "success" : "outline"}>
              {access?.isAdvanced ? "Advanced analytics" : "Basic analytics"}
            </Badge>
            <Badge variant="outline">{currentPlan || "No active plan"}</Badge>
          </div>
          <p className="mt-4 text-sm font-semibold text-primary">
            Business workspace
          </p>
          <h1 className="mt-1 truncate text-3xl font-bold tracking-tight text-growth-sidebar">
            {businessName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Overview from {formatDate(period?.startDate)} through{" "}
            {formatDate(period?.endDate)} in {timezone}.
          </p>
        </div>

        <div className="grid gap-3 lg:min-w-[520px]">
          <div className="flex flex-wrap gap-2 xl:justify-end">
            <Button asChild size="sm">
              <Link href="/dashboard/bookings">
                <CalendarCheck className="me-2 size-4" aria-hidden="true" />
                Bookings
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/customers">
                <Users className="me-2 size-4" aria-hidden="true" />
                Customers
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/memberships">
                <CreditCard className="me-2 size-4" aria-hidden="true" />
                Memberships
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 xl:justify-end" aria-label="Date range selector">
            {ANALYTICS_PERIOD_OPTIONS.map((periodDays) => (
              <Button
                disabled={!allowedPeriods.includes(periodDays)}
                key={periodDays}
                size="sm"
                variant={days === periodDays ? "default" : "outline"}
                onClick={() => onDaysChange(periodDays)}
              >
                {periodLabel(periodDays)}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function KpiCard({
  accent = "primary",
  comparison,
  helper,
  icon: Icon,
  label,
  value
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 truncate text-3xl font-bold text-growth-sidebar">
              {value}
            </p>
          </div>
          {Icon ? (
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-2xl border",
                kpiAccentClasses[accent]
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
            </div>
          ) : null}
        </div>
        {comparison !== undefined ? (
          <p className={cn("mt-3 text-xs font-medium", comparisonClass(comparison))}>
            {comparisonLabel(comparison)}
          </p>
        ) : helper ? (
          <p className="mt-3 text-xs text-muted-foreground">{helper}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function DistributionBar({ label, value, total, detail, accentClass = "bg-primary" }) {
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
          className={cn("h-full rounded-full", accentClass)}
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
          <span className="size-3 rounded bg-growth-mint" />
          Total
        </span>
        <span className="flex items-center gap-2">
          <span className="size-3 rounded bg-primary" />
          Completed
        </span>
      </div>
    </div>
  );
}

function RevenueTrend({ trend, currency }) {
  const maxValue = Math.max(
    ...trend.points.map((point) => point.bookedValueCents),
    1
  );

  return (
    <div>
      <div className="flex h-64 min-w-[680px] items-end gap-2 border-b border-growth-border px-2 pt-5">
        {trend.points.map((point) => {
          const height = Math.max(
            Math.round((point.bookedValueCents / maxValue) * 210),
            point.bookedValueCents > 0 ? 8 : 2
          );
          const pointSummary = `${point.startDate} to ${point.endDate}: ${formatMoney(point.bookedValueCents, currency)} booked value`;

          return (
            <Tooltip content={pointSummary} key={point.startDate}>
              <div className="flex min-w-0 flex-1 flex-col items-center justify-end">
                <span className="mb-1 text-[10px] text-muted-foreground">
                  {formatMoney(point.bookedValueCents, currency)}
                </span>
                <div
                  className="w-full max-w-8 rounded-t-lg bg-emerald-600"
                  style={{ height: `${height}px` }}
                />
              </div>
            </Tooltip>
          );
        })}
      </div>
      <div className="mt-3 flex justify-between text-xs text-muted-foreground">
        <span>{formatDate(trend.points[0]?.startDate)}</span>
        <span>Booked value trend</span>
        <span>{formatDate(trend.points.at(-1)?.endDate)}</span>
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
    <div className="sf-dashboard-table-wrap">
      <table className="sf-dashboard-table min-w-[760px]">
        <thead>
          <tr>
            <th className="px-4 py-3 font-semibold">Service</th>
            <th className="px-4 py-3 font-semibold">Bookings</th>
            <th className="px-4 py-3 font-semibold">Completed</th>
            <th className="px-4 py-3 font-semibold">Completion</th>
            <th className="px-4 py-3 font-semibold">Booked value</th>
          </tr>
        </thead>
        <tbody>
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
    <div className="sf-dashboard-table-wrap">
      <table className="sf-dashboard-table min-w-[700px]">
        <thead>
          <tr>
            <th className="px-4 py-3 font-semibold">Team member</th>
            <th className="px-4 py-3 font-semibold">Bookings</th>
            <th className="px-4 py-3 font-semibold">Completed</th>
            <th className="px-4 py-3 font-semibold">Completion</th>
            <th className="px-4 py-3 font-semibold">Booked value</th>
          </tr>
        </thead>
        <tbody>
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

function MembershipPlanTable({ analytics, businessCurrency }) {
  if (!analytics) {
    return (
      <div className="min-h-40" role="status" aria-label="Loading membership analytics" />
    );
  }

  if (analytics.plans.length === 0) {
    return (
      <EmptyState
        title="No membership plans"
        description="Membership analytics appears after plans and members are created."
      />
    );
  }

  return (
    <div className="sf-dashboard-table-wrap">
      <table className="sf-dashboard-table min-w-[700px]">
        <thead>
          <tr>
            <th className="px-4 py-3 font-semibold">Plan</th>
            <th className="px-4 py-3 font-semibold">Members</th>
            <th className="px-4 py-3 font-semibold">Payments</th>
            <th className="px-4 py-3 font-semibold">Revenue</th>
            <th className="px-4 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {analytics.plans.map((plan) => (
            <tr className="hover:bg-growth-mint/20" key={plan.id}>
              <td className="px-4 py-4 font-semibold text-growth-sidebar">
                {plan.name}
              </td>
              <td className="px-4 py-4 text-muted-foreground">
                {plan.memberCount}
              </td>
              <td className="px-4 py-4 text-muted-foreground">
                {plan.paymentCount}
              </td>
              <td className="px-4 py-4 text-muted-foreground">
                {formatMoney(plan.revenueCents, analytics.currency || businessCurrency)}
              </td>
              <td className="px-4 py-4">
                <Badge variant={plan.isActive ? "success" : "outline"}>
                  {plan.isActive ? "Active" : "Inactive"}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActivityItem({ title, description, meta, badge, badgeVariant = "outline" }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-growth-border py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-growth-sidebar">{title}</p>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{description}</p>
        {meta ? <p className="mt-1 text-xs text-muted-foreground">{meta}</p> : null}
      </div>
      {badge ? (
        <Badge className="shrink-0" variant={badgeVariant}>
          {badge}
        </Badge>
      ) : null}
    </div>
  );
}

function ActivityPanel({
  bookings,
  customers,
  memberships,
  timezone
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <EmptyState
              className="p-5"
              title="No bookings yet"
              description="Recent appointments appear here after customers book."
            />
          ) : (
            bookings.map((booking) => (
              <ActivityItem
                badge={humanize(booking.status)}
                description={`${booking.serviceNameSnapshot} for ${booking.customerName}`}
                key={booking.id}
                meta={formatDateTime(booking.startsAt, timezone)}
                title={`#${booking.bookingNumber}`}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Customers</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <EmptyState
              className="p-5"
              title="No customers yet"
              description="New customer profiles appear here."
            />
          ) : (
            customers.map((customer) => (
              <ActivityItem
                badge={pluralize(customer.bookingCount || 0, "booking")}
                description={customer.email}
                key={customer.id}
                meta={`Created ${formatDateTime(customer.createdAt, timezone)}`}
                title={customer.name}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Membership Changes</CardTitle>
        </CardHeader>
        <CardContent>
          {memberships.length === 0 ? (
            <EmptyState
              className="p-5"
              title="No membership changes"
              description="Recent membership updates appear here."
            />
          ) : (
            memberships.map((membership) => (
              <ActivityItem
                badge={humanize(membership.effectiveStatus || membership.status)}
                badgeVariant={
                  membership.effectiveStatus === "ACTIVE" ? "success" : "outline"
                }
                description={`${membership.customer.name} on ${membership.planNameSnapshot}`}
                key={membership.id}
                meta={`Updated ${formatDateTime(membership.updatedAt, timezone)}`}
                title={membership.customer.email}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InsightCard({ icon: Icon, label, value, helper }) {
  return (
    <div className="rounded-2xl border border-growth-border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-xl bg-growth-mint text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold text-growth-sidebar">{label}</p>
      </div>
      <p className="mt-4 text-lg font-bold text-growth-sidebar">{value}</p>
      {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

function LoadingOverview() {
  return (
    <div className="space-y-8" role="status" aria-label="Loading overview">
      <div className="rounded-2xl border border-growth-border bg-white p-5">
        <div className="flex flex-col justify-between gap-5 xl:flex-row">
          <div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-36 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="mt-5 h-4 w-40" />
            <Skeleton className="mt-3 h-9 w-72 max-w-full" />
            <Skeleton className="mt-3 h-4 w-96 max-w-full" />
          </div>
          <div className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton className="h-9 w-28 rounded-xl" key={index} />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton className="h-9 w-20 rounded-xl" key={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <MetricCardsSkeleton count={6} className="xl:grid-cols-6" />
      <section className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <ChartSkeleton />
        <ChartSkeleton bars={5} />
      </section>
      <div className="grid gap-5 xl:grid-cols-3">
        <TableSkeleton columns={3} rows={4} minWidth="480px" />
        <TableSkeleton columns={3} rows={4} minWidth="480px" />
        <TableSkeleton columns={3} rows={4} minWidth="480px" />
      </div>
    </div>
  );
}

export function OverviewDashboard({
  businessCurrency,
  businessId,
  businessName,
  businessTimezone,
  currentPlan,
  initialDays = 30
}) {
  const [days, setDays] = useState(initialDays);
  const analyticsQuery = useAnalytics(businessId, days);
  const membershipAnalyticsQuery = useMembershipAnalytics(businessId);
  const teamQuery = useTeam(businessId);
  const bookingsQuery = useBookings(businessId, {
    page: 1,
    pageSize: 5
  });
  const customersQuery = useCustomers(businessId, {
    page: 1,
    pageSize: 5,
    sort: "CREATED_DESC"
  });
  const membershipsQuery = useBusinessMemberships(businessId, {});
  const showAnalyticsSkeleton = useDelayedVisibility(analyticsQuery.isLoading);
  const report = analyticsQuery.data?.analytics;
  const access = analyticsQuery.data?.access;
  const overview = report?.overview;
  const advanced = report?.advanced;
  const membershipAnalytics = membershipAnalyticsQuery.data?.analytics;
  const currency = report?.currency || businessCurrency;
  const recentMemberships = (membershipsQuery.data?.memberships || []).slice(0, 5);

  const insights = useMemo(() => {
    const topHour = getTopEntry(advanced?.demand.hours);
    const topService = getTopEntry(advanced?.servicePerformance);
    const fastestMembership = getTopEntry(membershipAnalytics?.plans, "memberCount");
    const revenueChange = overview?.value.changePercent;

    return [
      {
        icon: Clock3,
        label: "Peak booking hours",
        value: topHour ? formatHour(topHour.hour) : "No pattern yet",
        helper: topHour ? pluralize(topHour.bookings, "booking") : "Needs more booking activity"
      },
      {
        icon: ListChecks,
        label: "Most popular service",
        value: topService?.name || "No service leader yet",
        helper: topService ? pluralize(topService.bookings, "booking") : "Service demand will appear here"
      },
      {
        icon: CreditCard,
        label: "Fastest growing membership",
        value: fastestMembership?.name || "No membership leader yet",
        helper: fastestMembership ? pluralize(fastestMembership.memberCount, "member") : "Membership adoption will appear here"
      },
      {
        icon: TrendingUp,
        label: "Revenue trend",
        value:
          revenueChange === null
            ? "New revenue"
            : `${revenueChange > 0 ? "+" : ""}${revenueChange || 0}%`,
        helper: "Booked value versus the previous period"
      }
    ];
  }, [advanced, membershipAnalytics, overview]);

  if (analyticsQuery.isLoading) {
    if (!showAnalyticsSkeleton) {
      return <div className="min-h-96" role="status" aria-label="Loading overview" />;
    }

    return <LoadingOverview />;
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
    <div className="space-y-8">
      <WelcomeHeader
        access={access}
        businessName={businessName}
        currentPlan={currentPlan || `${access.planCode} plan`}
        days={days}
        period={report.period}
        timezone={businessTimezone}
        onDaysChange={setDays}
      />

      <section className="space-y-4">
        <SectionHeader
          eyebrow="Performance"
          title="KPI Cards"
          description="A fast read on booking demand, estimated revenue, customers, memberships, team size, and growth."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <KpiCard
            accent="primary"
            comparison={overview.bookings.changePercent}
            icon={CalendarCheck}
            label="Total Bookings"
            value={overview.bookings.total}
          />
          <KpiCard
            accent="emerald"
            comparison={overview.value.changePercent}
            icon={LineChart}
            label="Revenue"
            value={formatMoney(overview.value.bookedValueCents, currency)}
          />
          <KpiCard
            accent="sky"
            comparison={overview.customers.changePercent}
            icon={Users}
            label="Active Customers"
            value={overview.customers.uniqueBookingCustomers}
          />
          <KpiCard
            accent="violet"
            helper={`${membershipAnalytics?.expiringSoon || 0} expiring soon`}
            icon={CreditCard}
            label="Memberships"
            value={membershipAnalytics?.activeMembers ?? "-"}
          />
          <KpiCard
            accent="amber"
            helper={`${teamQuery.data?.usage?.pendingInvitations || 0} pending invitations`}
            icon={UserPlus}
            label="Team Members"
            value={teamQuery.data?.usage?.activeMemberships ?? "-"}
          />
          <KpiCard
            accent="rose"
            helper={`${overview.bookings.previousTotal} in previous period`}
            icon={TrendingUp}
            label="Booking Growth"
            value={
              overview.bookings.changePercent === null
                ? "New"
                : `${overview.bookings.changePercent > 0 ? "+" : ""}${overview.bookings.changePercent}%`
            }
          />
        </div>
      </section>

      {overview.value.mismatchedCurrencyBookings > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {overview.value.mismatchedCurrencyBookings} booking value record(s)
          were excluded because their snapshot currency differs from the
          business currency.
        </div>
      ) : null}

      <section className="space-y-4">
        <SectionHeader
          eyebrow="Revenue"
          title="Revenue Analytics"
          description="Booked value and completed value are calculated from service price snapshots."
        />
        <div className="grid gap-5 xl:grid-cols-[1.45fr_0.55fr]">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Revenue Chart</CardTitle>
              <p className="text-sm text-muted-foreground">
                Estimated booked value by appointment date.
              </p>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <RevenueTrend currency={currency} trend={report.trend} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl bg-growth-dashboard p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Booked value growth</p>
                    <p className="mt-2 text-2xl font-bold text-growth-sidebar">
                      {formatMoney(overview.value.bookedValueCents, currency)}
                    </p>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <TrendingUp className="size-5" aria-hidden="true" />
                  </div>
                </div>
                <p className={cn("mt-2 text-xs font-medium", comparisonClass(overview.value.changePercent))}>
                  {comparisonLabel(overview.value.changePercent)}
                </p>
              </div>
              <div className="rounded-2xl bg-growth-dashboard p-4">
                <p className="text-sm text-muted-foreground">Completed value</p>
                <p className="mt-2 text-2xl font-bold text-growth-sidebar">
                  {formatMoney(overview.value.completedValueCents, currency)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {overview.bookings.completedHours} delivered hours
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          eyebrow="Bookings"
          title="Booking Analytics"
          description="Booking volume, outcomes, service demand, sources, peak times, and team workload."
        />
        <div className="grid gap-5 xl:grid-cols-[1.45fr_0.55fr]">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Booking Trends</CardTitle>
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
              <CardTitle>Booking Volume</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {report.statusDistribution.map((entry) => (
                <DistributionBar
                  detail={`${entry.bookings} | ${entry.percentage}%`}
                  key={entry.status}
                  label={humanize(entry.status)}
                  total={overview.bookings.total}
                  value={entry.bookings}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            helper={`${overview.bookings.completed} completed appointments`}
            icon={BarChart3}
            label="Completion rate"
            value={`${overview.bookings.completionRate}%`}
          />
          <KpiCard
            helper={`${overview.bookings.canceled} canceled bookings`}
            label="Cancellation rate"
            value={`${overview.bookings.cancellationRate}%`}
          />
          <KpiCard
            helper={`${overview.bookings.noShow} no-show bookings`}
            label="No-show rate"
            value={`${overview.bookings.noShowRate}%`}
          />
          <KpiCard
            comparison={overview.reviews.publishedChangePercent}
            icon={Star}
            label="Published reviews"
            value={overview.reviews.published}
          />
        </div>

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
                  <CardTitle>Peak Times</CardTitle>
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
                            {pluralize(entry.bookings, "booking")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Booking Sources</CardTitle>
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

              <Card>
                <CardHeader>
                  <CardTitle>Service Performance</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Historical service names and prices come from booking snapshots.
                  </p>
                </CardHeader>
                <CardContent>
                  <ServicePerformance
                    currency={report.currency}
                    services={advanced.servicePerformance}
                  />
                </CardContent>
              </Card>
            </section>

            <Card>
              <CardHeader>
                <CardTitle>Team Booking Workload</CardTitle>
                <p className="text-sm text-muted-foreground">
                  This reports assigned booking outcomes, not capacity utilization.
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
      </section>

      <section className="space-y-4">
        <SectionHeader
          eyebrow="Customers"
          title="Customer Analytics"
          description="New customers, returning customers, customer growth, and reputation signals."
        />
        <div className="grid gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Customer Growth</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-growth-dashboard p-4">
                <p className="text-sm text-muted-foreground">Active customers</p>
                <p className="mt-2 text-2xl font-bold text-growth-sidebar">
                  {overview.customers.uniqueBookingCustomers}
                </p>
              </div>
              <div className="rounded-2xl bg-growth-dashboard p-4">
                <p className="text-sm text-muted-foreground">New customers</p>
                <p className="mt-2 text-2xl font-bold text-growth-sidebar">
                  {overview.customers.newCustomerProfiles}
                </p>
              </div>
              <div className="rounded-2xl bg-growth-dashboard p-4">
                <p className="text-sm text-muted-foreground">Previous-period customers</p>
                <p className="mt-2 text-2xl font-bold text-growth-sidebar">
                  {overview.customers.previousUniqueBookingCustomers}
                </p>
              </div>
              <div className="rounded-2xl bg-growth-dashboard p-4">
                <p className="text-sm text-muted-foreground">Customer growth</p>
                <p className="mt-2 text-2xl font-bold text-growth-sidebar">
                  {overview.customers.changePercent === null
                    ? "New"
                    : `${overview.customers.changePercent > 0 ? "+" : ""}${overview.customers.changePercent}%`}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Returning Customers</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-growth-dashboard p-4">
                <p className="text-sm text-muted-foreground">Returning customers</p>
                <p className="mt-2 text-2xl font-bold text-growth-sidebar">
                  {advanced?.customerRetention.returningBookingCustomers ?? "-"}
                </p>
              </div>
              <div className="rounded-2xl bg-growth-dashboard p-4">
                <p className="text-sm text-muted-foreground">First-time customers</p>
                <p className="mt-2 text-2xl font-bold text-growth-sidebar">
                  {advanced?.customerRetention.firstTimeBookingCustomers ?? "-"}
                </p>
              </div>
              <div className="rounded-2xl bg-growth-dashboard p-4">
                <p className="text-sm text-muted-foreground">Returning rate</p>
                <p className="mt-2 text-2xl font-bold text-growth-sidebar">
                  {advanced ? `${advanced.customerRetention.returningRate}%` : "-"}
                </p>
              </div>
              <div className="rounded-2xl bg-growth-dashboard p-4">
                <p className="text-sm text-muted-foreground">Average public rating</p>
                <p className="mt-2 text-2xl font-bold text-growth-sidebar">
                  {overview.reviews.averageRating ?? "No rating"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          eyebrow="Memberships"
          title="Membership Analytics"
          description="Active memberships, membership revenue, and retention health."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            helper={`${membershipAnalytics?.expiringSoon || 0} expiring soon`}
            icon={Users}
            label="Active Memberships"
            value={membershipAnalytics?.activeMembers ?? "-"}
          />
          <KpiCard
            helper="Successful membership payments"
            icon={CreditCard}
            label="Membership Revenue"
            value={
              membershipAnalytics
                ? formatMoney(
                    membershipAnalytics.revenueTotalCents,
                    membershipAnalytics.currency || businessCurrency
                  )
                : "-"
            }
          />
          <KpiCard
            helper={`${membershipAnalytics?.pastDueMembers || 0} past due`}
            icon={TrendingUp}
            label="Membership Retention"
            value={
              membershipAnalytics?.totalMembers
                ? `${Math.round(
                    (membershipAnalytics.activeMembers /
                      membershipAnalytics.totalMembers) *
                      100
                  )}%`
                : "0%"
            }
          />
          <KpiCard
            helper={`${membershipAnalytics?.canceledMembers || 0} canceled`}
            icon={ArrowUpRight}
            label="This Month"
            value={
              membershipAnalytics
                ? formatMoney(
                    membershipAnalytics.revenueThisMonthCents,
                    membershipAnalytics.currency || businessCurrency
                  )
                : "-"
            }
          />
        </div>
        {membershipAnalyticsQuery.isLoading ? (
          <TableSkeleton columns={5} rows={4} minWidth="700px" />
        ) : membershipAnalyticsQuery.isError ? (
          <ErrorState
            description={membershipAnalyticsQuery.error.message}
            onAction={() => membershipAnalyticsQuery.refetch()}
          />
        ) : (
          <MembershipPlanTable
            analytics={membershipAnalytics}
            businessCurrency={businessCurrency}
          />
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          eyebrow="Activity"
          title="Recent Activity"
          description="Recent bookings, recently created customers, and latest membership changes."
        />
        {bookingsQuery.isLoading || customersQuery.isLoading || membershipsQuery.isLoading ? (
          <div className="grid gap-5 xl:grid-cols-3">
            <TableSkeleton columns={3} rows={5} minWidth="480px" />
            <TableSkeleton columns={3} rows={5} minWidth="480px" />
            <TableSkeleton columns={3} rows={5} minWidth="480px" />
          </div>
        ) : bookingsQuery.isError || customersQuery.isError || membershipsQuery.isError ? (
          <ErrorState
            description={
              bookingsQuery.error?.message ||
              customersQuery.error?.message ||
              membershipsQuery.error?.message
            }
            onAction={() => {
              bookingsQuery.refetch();
              customersQuery.refetch();
              membershipsQuery.refetch();
            }}
          />
        ) : (
          <ActivityPanel
            bookings={bookingsQuery.data?.bookings || []}
            customers={customersQuery.data?.customers || []}
            memberships={recentMemberships}
            timezone={businessTimezone}
          />
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          eyebrow="Insights"
          title="Quick Insights"
          description="Signals that point to the next operating move."
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {insights.map((insight) => (
            <InsightCard
              helper={insight.helper}
              icon={insight.icon}
              key={insight.label}
              label={insight.label}
              value={insight.value}
            />
          ))}
        </div>
      </section>

      <p className="text-xs text-muted-foreground">
        Booked value is calculated from service price snapshots and is not
        confirmed payment revenue. Reports use appointment dates in{" "}
        {businessTimezone}.
      </p>
    </div>
  );
}

export const AnalyticsDashboard = OverviewDashboard;
