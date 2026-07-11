"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";
import {
  CalendarClock,
  CalendarDays,
  Check,
  ChevronRight,
  CreditCard,
  Plus,
  Sparkles,
  Star,
  Users,
  Wand2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { HorizontalScrollArea } from "@/components/ui/scroll-area";
import {
  MetricCardsSkeleton,
  Skeleton,
  TableSkeleton,
  useDelayedVisibility
} from "@/components/ui/skeleton";
import { useAnalytics } from "@/features/analytics/hooks/use-analytics";
import {
  useBookings,
  useBookingSettings
} from "@/features/bookings/hooks/use-bookings";
import { DashboardBookingForm } from "@/features/bookings/components/dashboard-booking-form";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { useReviews } from "@/features/reviews/hooks/use-reviews";
import { useServices } from "@/features/services/hooks/use-services";
import { useTeam } from "@/features/team/hooks/use-team";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

function formatMoney(cents, currency, language) {
  return new Intl.NumberFormat(language, {
    currency: currency || "usd",
    maximumFractionDigits: 0,
    style: "currency"
  }).format((cents || 0) / 100);
}

function formatTime(value, timezone, language) {
  return new Intl.DateTimeFormat(language, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone
  }).format(new Date(value));
}

function formatDate(value, timezone, language, t) {
  if (!value) {
    return t("overview.common.never");
  }

  return new Intl.DateTimeFormat(language, {
    dateStyle: "medium",
    timeZone: timezone
  }).format(new Date(value));
}

function getGreeting(t) {
  const hour = new Date().getHours();

  if (hour < 12) return t("overview.greeting.morning");
  if (hour < 18) return t("overview.greeting.afternoon");
  return t("overview.greeting.evening");
}

function getInitials(value, fallback) {
  return (
    String(value || fallback)
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("") || "C"
  );
}

function statusVariant(status) {
  if (status === "CONFIRMED" || status === "COMPLETED") return "success";
  if (status === "CANCELED" || status === "NO_SHOW") return "destructive";
  if (status === "PENDING") return "warning";
  return "outline";
}

function statusLabel(status, t) {
  return t(`overview.status.${status}`, status.replace("_", " "));
}

function completionPercent(items) {
  if (items.length === 0) {
    return 0;
  }

  return Math.round(
    (items.filter((item) => item.done).length / items.length) * 100
  );
}

function MetricCard({ accent = "bg-[#e5eeff]", icon: Icon, label, value, trend }) {
  return (
    <div className="sf-dashboard-panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={cn("flex size-8 items-center justify-center rounded-lg", accent)}>
          <Icon className="size-4 text-[#3525cd]" aria-hidden="true" />
        </div>
        {trend ? (
          <span className="rounded bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
            {trend}
          </span>
        ) : null}
      </div>
      <p className="mt-4 text-sm font-semibold text-[#464555]">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-normal text-[#0b1c30]">
        {value}
      </p>
    </div>
  );
}

function SectionCard({ action, children, className, title }) {
  return (
    <section className={cn("sf-dashboard-panel overflow-hidden", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-growth-border px-6 py-5">
        <h2 className="text-xl font-semibold leading-7 text-[#0b1c30]">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ScheduleList({ bookings, isLoading, timezone }) {
  const { i18n, t } = useTranslation("dashboard");

  if (isLoading) {
    return (
      <div className="space-y-4 p-6" role="status" aria-label={t("overview.schedule.loading")}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="grid grid-cols-[72px_1fr_96px] gap-4" key={index}>
            <Skeleton className="h-5 w-16" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        {t("overview.schedule.empty")}
      </div>
    );
  }

  return (
    <div className="divide-y divide-growth-border">
      {bookings.map((booking) => (
        <div
          className="grid gap-4 px-6 py-4 sm:grid-cols-[80px_1fr_auto]"
          key={booking.id}
        >
          <div>
            <p className="text-sm font-bold text-[#0b1c30]">
              {formatTime(booking.startsAt, timezone, i18n.language)}
            </p>
            <p className="text-xs text-[#464555]">
              {t("overview.common.shortMinutes", { count: booking.serviceDurationMinSnapshot })}
            </p>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#0b1c30]">
              {booking.serviceNameSnapshot}
            </p>
            <p className="truncate text-xs text-[#464555]">
              {booking.customerName}
            </p>
          </div>
          <Badge variant={statusVariant(booking.status)}>
            {statusLabel(booking.status, t)}
          </Badge>
        </div>
      ))}
    </div>
  );
}

function SetupChecklist({ items }) {
  const { t } = useTranslation("dashboard");
  const progress = completionPercent(items);

  return (
    <SectionCard
      title={t("overview.setup.title")}
      action={<span className="text-sm font-bold text-[#3525cd]">{progress}%</span>}
    >
      <div className="px-6 pb-5">
        <div className="h-1 overflow-hidden rounded-full bg-[#e5eeff]">
          <div className="h-full rounded-full bg-[#3525cd]" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="space-y-3 px-6 pb-6">
        {items.map((item) => (
          <Link
            className="flex items-center justify-between gap-3 text-sm text-[#0b1c30]"
            href={item.href}
            key={item.label}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-full border",
                  item.done
                    ? "border-[#3525cd] bg-[#3525cd] text-white"
                    : "border-[#586377] text-transparent"
                )}
              >
                <Check className="size-3" aria-hidden="true" />
              </span>
              <span className={cn(item.done && "text-[#6b7280] line-through")}>
                {item.label}
              </span>
            </span>
            {!item.done ? <ChevronRight className="size-4 shrink-0 text-[#464555]" aria-hidden="true" /> : null}
          </Link>
        ))}
      </div>
      <div className="border-t border-growth-border bg-growth-dashboard px-6 py-4 text-xs text-[#586377]">
        {t("overview.setup.description")}
      </div>
    </SectionCard>
  );
}

function MiniBarChart({ points }) {
  const { i18n, t } = useTranslation("dashboard");
  const recentPoints = points.slice(-7);
  const max = Math.max(...recentPoints.map((point) => point.bookings), 1);

  return (
    <div className="flex h-36 items-end gap-3">
      {recentPoints.map((point) => {
        const height = Math.max(Math.round((point.bookings / max) * 100), point.bookings ? 14 : 6);
        const label = new Intl.DateTimeFormat(i18n.language, {
          weekday: "short",
          timeZone: "UTC"
        }).format(new Date(`${point.startDate}T00:00:00Z`));

        return (
          <div className="flex flex-1 flex-col items-center gap-2" key={point.startDate}>
            <div
              className={cn(
                "w-full max-w-9 rounded-t bg-[#cfcaf3]",
                point === recentPoints.at(-1) && "bg-[#3525cd]"
              )}
              style={{ height: `${height}%` }}
              title={t("overview.chart.bookingsTooltip", { count: point.bookings })}
            />
            <span className="text-[10px] text-[#464555]">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function ProgressLine({ label, used, limit }) {
  const { t } = useTranslation("dashboard");
  const hasLimit = Number.isFinite(limit) && limit > 0;
  const percent = hasLimit ? Math.min(Math.round((used / limit) * 100), 100) : 100;

  return (
    <div>
      <div className="flex justify-between gap-3 text-xs">
        <span className="font-semibold text-[#0b1c30]">{label}</span>
        <span className="font-bold text-[#0b1c30]">
          {hasLimit
            ? t("overview.usage.usedOfLimit", { limit, used })
            : t("overview.usage.usedUnlimited", { used })}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e5eeff]">
        <div className="h-full rounded-full bg-[#3525cd]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function RecentCustomers({ customers, isLoading, timezone }) {
  const { i18n, t } = useTranslation("dashboard");

  if (isLoading) {
    return <TableSkeleton columns={4} rows={4} minWidth="620px" />;
  }

  if (customers.length === 0) {
    return <div className="p-6 text-sm text-muted-foreground">{t("overview.customers.empty")}</div>;
  }

  return (
    <HorizontalScrollArea className="sf-dashboard-table-wrap rounded-none border-0">
      <table className="sf-dashboard-table min-w-[620px]">
        <thead>
          <tr>
            <th>{t("overview.customers.table.customer")}</th>
            <th>{t("overview.customers.table.lastBooking")}</th>
            <th>{t("overview.customers.table.status")}</th>
            <th aria-label={t("overview.customers.table.actions")} />
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => {
            const status = customer.marketingOptIn
              ? t("overview.customers.status.vip")
              : customer.bookingCount > 0
                ? t("overview.customers.status.regular")
                : t("overview.customers.status.new");

            return (
              <tr key={customer.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-full bg-[#d5e0f8] text-xs font-bold text-[#586377]">
                      {getInitials(customer.name, t("overview.customers.fallbackName"))}
                    </span>
                    <div>
                      <p className="font-semibold text-[#0b1c30]">{customer.name}</p>
                      <p className="text-xs text-[#464555]">{customer.email}</p>
                    </div>
                  </div>
                </td>
                <td className="text-[#464555]">
                  {formatDate(customer.lastBooking?.startsAt, timezone, i18n.language, t)}
                </td>
                <td>
                  <Badge variant={customer.marketingOptIn ? "default" : "outline"}>
                    {status}
                  </Badge>
                </td>
                <td className="text-end">
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/dashboard/customers/${customer.id}`}>{t("overview.customers.view")}</Link>
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </HorizontalScrollArea>
  );
}

function RecentReviews({ averageRating, isLoading, reviews }) {
  const { t } = useTranslation("dashboard");
  const rating = averageRating ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-5 p-6" role="status" aria-label={t("overview.reviews.loading")}>
        {Array.from({ length: 2 }).map((_, index) => (
          <div className="space-y-3" key={index}>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <SectionCard
      title={t("overview.reviews.title")}
      action={
        <div className="flex items-center gap-2 text-lg font-bold text-[#0b1c30]">
          {rating ? rating.toFixed(1) : "0.0"}
          <span className="flex text-amber-500">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                className={cn("size-3", index < Math.round(rating) && "fill-current")}
                key={index}
                aria-hidden="true"
              />
            ))}
          </span>
        </div>
      }
    >
      {reviews.length === 0 ? (
        <div className="p-6 text-sm text-muted-foreground">{t("overview.reviews.empty")}</div>
      ) : (
        <div className="divide-y divide-growth-border">
          {reviews.map((review) => (
            <div className="space-y-2 px-6 py-5" key={review.id}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-[#0b1c30]">
                  {review.customerNameSnapshot}
                </p>
                <span className="flex text-amber-500">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      className={cn("size-3", index < review.rating && "fill-current")}
                      key={index}
                      aria-hidden="true"
                    />
                  ))}
                </span>
              </div>
              <p className="line-clamp-2 text-sm italic leading-5 text-[#464555]">
                {`"${review.comment || review.title || t("overview.reviews.noText")}"`}
              </p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export function OverviewDashboard({
  businessCurrency,
  businessId,
  businessName,
  businessTimezone,
  businessRole,
  currentPlan,
  initialDays
}) {
  const { i18n, t } = useTranslation("dashboard");
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const analyticsQuery = useAnalytics(businessId, initialDays || 30);
  const bookingsQuery = useBookings(businessId, {
    page: 1,
    pageSize: 5,
    status: "ALL"
  });
  const customersQuery = useCustomers(businessId, {
    marketing: "ALL",
    page: 1,
    pageSize: 4,
    sort: "CREATED_DESC"
  });
  const reviewsQuery = useReviews(businessId, {
    page: 1,
    pageSize: 2,
    status: "PUBLISHED"
  });
  const servicesQuery = useServices(businessId);
  const settingsQuery = useBookingSettings(businessId);
  const teamQuery = useTeam(businessId);
  const showAnalyticsSkeleton = useDelayedVisibility(analyticsQuery.isLoading);
  const showBookingsSkeleton = useDelayedVisibility(bookingsQuery.isLoading);

  const analytics = analyticsQuery.data?.analytics;
  const overview = analytics?.overview;
  const bookings = bookingsQuery.data?.bookings || [];
  const todayBookings = bookings.filter(
    (booking) =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: businessTimezone
      }).format(new Date(booking.startsAt)) === bookingsQuery.data?.summary?.localToday
  );
  const customers = customersQuery.data?.customers || [];
  const reviews = reviewsQuery.data?.reviews || [];
  const services = servicesQuery.data?.services || [];
  const activeServices = services.filter((service) => service.isActive);
  const canCreateBooking =
    businessRole !== "STAFF" &&
    bookingsQuery.data?.summary?.access?.canCreate === true &&
    activeServices.length > 0;
  const displayName =
    session?.user?.name ||
    session?.user?.email?.replace(/@.*/, "") ||
    businessName;
  const setupItems = useMemo(
    () => [
      {
        done: Boolean(settingsQuery.data?.settings),
        href: "/dashboard/bookings#booking-rules",
        label: t("overview.setup.items.businessHours")
      },
      {
        done: services.length > 0,
        href: "/dashboard/services",
        label: t("overview.setup.items.firstService")
      },
      {
        done: (teamQuery.data?.usage?.activeMemberships || 0) > 1,
        href: "/dashboard/team",
        label: t("overview.setup.items.inviteTeam")
      },
      {
        done: currentPlan && !currentPlan.toLowerCase().startsWith("no active"),
        href: "/dashboard/billing",
        label: t("overview.setup.items.connectPayments")
      },
      {
        done: bookingsQuery.data?.summary?.access?.subscriptionEntitled === true,
        href: "/dashboard/settings",
        label: t("overview.setup.items.publishPage")
      }
    ],
    [
      bookingsQuery.data?.summary?.access?.subscriptionEntitled,
      currentPlan,
      services.length,
      settingsQuery.data?.settings,
      teamQuery.data?.usage?.activeMemberships,
      t
    ]
  );

  return (
    <div className="space-y-8">
      <Modal
        description={t("overview.createBookingModal.description")}
        onOpenChange={setBookingDialogOpen}
        open={bookingDialogOpen}
        size="xl"
        title={t("overview.createBookingModal.title")}
      >
        <DashboardBookingForm
          bookingWindowDays={settingsQuery.data?.settings?.bookingWindowDays || 30}
          businessId={businessId}
          services={services}
          timezone={businessTimezone}
          onCancel={() => setBookingDialogOpen(false)}
          onSuccess={(result) => {
            showToast({ title: result.message, variant: "success" });
            setBookingDialogOpen(false);
          }}
        />
      </Modal>

      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-[#0b1c30]">
            {t("overview.heading", { greeting: getGreeting(t), name: displayName })}
          </h1>
          <p className="mt-2 text-sm text-[#464555]">
            {t("overview.subheading", { business: businessName })}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/dashboard/services">{t("overview.actions.addService")}</Link>
          </Button>
          <Button disabled={!canCreateBooking} onClick={() => setBookingDialogOpen(true)}>
            <Plus className="me-2 size-4" aria-hidden="true" />
            {t("overview.actions.createBooking")}
          </Button>
        </div>
      </section>

      {analyticsQuery.isLoading && showAnalyticsSkeleton ? (
        <MetricCardsSkeleton count={4} />
      ) : (
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            accent="bg-[#e5eeff]"
            icon={CalendarDays}
            label={t("overview.metrics.todayBookings")}
            value={bookingsQuery.data?.summary?.today ?? 0}
          />
          <MetricCard
            accent="bg-red-50"
            icon={CalendarClock}
            label={t("overview.metrics.pendingBookings")}
            value={bookingsQuery.data?.summary?.statusCounts?.PENDING ?? 0}
            trend={t("overview.metrics.attention")}
          />
          <MetricCard
            accent="bg-[#e5eeff]"
            icon={CreditCard}
            label={t("overview.metrics.revenueThisMonth")}
            value={formatMoney(overview?.value?.bookedValueCents, businessCurrency, i18n.language)}
            trend={
              overview?.value?.changePercent
                ? `${overview.value.changePercent > 0 ? "+" : ""}${overview.value.changePercent}%`
                : undefined
            }
          />
          <MetricCard
            accent="bg-[#e5eeff]"
            icon={Users}
            label={t("overview.metrics.newCustomers")}
            value={overview?.customers?.newCustomerProfiles ?? customersQuery.data?.summary?.newThisMonth ?? 0}
            trend={
              overview?.customers?.changePercent
                ? `${overview.customers.changePercent > 0 ? "+" : ""}${overview.customers.changePercent}%`
                : undefined
            }
          />
        </section>
      )}

      <section className="grid gap-5 xl:grid-cols-[2fr_0.92fr]">
        <SectionCard
          title={t("overview.schedule.title")}
          action={
            <Button asChild size="sm" variant="ghost">
              <Link href="/dashboard/bookings">{t("overview.schedule.viewCalendar")}</Link>
            </Button>
          }
        >
          <ScheduleList
            bookings={todayBookings.length > 0 ? todayBookings : bookings.slice(0, 4)}
            isLoading={bookingsQuery.isLoading && showBookingsSkeleton}
            timezone={businessTimezone}
          />
        </SectionCard>
        <SetupChecklist items={setupItems} />
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <div className="sf-dashboard-panel p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <h2 className="text-sm font-bold leading-5 text-[#0b1c30]">
              {t("overview.performance.title")}
            </h2>
            <span className="text-xs text-[#464555]">
              {t("overview.performance.period", { count: initialDays || 30 })}
            </span>
          </div>
          {analyticsQuery.isLoading && showAnalyticsSkeleton ? (
            <Skeleton className="h-36 w-full" />
          ) : analytics?.trend?.points ? (
            <MiniBarChart points={analytics.trend.points} />
          ) : null}
        </div>

        <div className="sf-dashboard-panel p-6">
          <h2 className="mb-5 text-sm font-bold leading-5 text-[#0b1c30]">
            {t("overview.usage.title")}
          </h2>
          <div className="space-y-5">
            <ProgressLine
              label={t("overview.usage.services")}
              limit={servicesQuery.data?.summary?.serviceLimit}
              used={services.length}
            />
            <ProgressLine
              label={t("overview.usage.teamMembers")}
              limit={teamQuery.data?.usage?.limit}
              used={teamQuery.data?.usage?.used || 0}
            />
            <ProgressLine
              label={t("overview.usage.bookings")}
              limit={bookingsQuery.data?.summary?.plan?.limit}
              used={bookingsQuery.data?.summary?.plan?.used || 0}
            />
          </div>
          <Button asChild className="mt-5 w-full" size="sm" variant="ghost">
            <Link href="/dashboard/billing">{t("overview.usage.upgradePlan")}</Link>
          </Button>
        </div>

        <div className="sf-dashboard-panel p-6">
          <div className="mb-5 flex items-center gap-2">
            <Wand2 className="size-4 text-[#3525cd]" aria-hidden="true" />
            <h2 className="text-sm font-bold leading-5 text-[#0b1c30]">
              {t("overview.ai.title")}
            </h2>
          </div>
          <ul className="space-y-3 text-xs text-[#464555]">
            {["descriptions", "reminders", "cancellations"].map((item) => (
              <li className="flex gap-2" key={item}>
                <Sparkles className="mt-0.5 size-3 shrink-0 text-[#3525cd]" aria-hidden="true" />
                {t(`overview.ai.items.${item}`)}
              </li>
            ))}
          </ul>
          <Button asChild className="mt-5 w-full bg-[#0b1c30] hover:bg-[#132a45]">
            <Link href="/dashboard/ai">{t("overview.ai.open")}</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
        <SectionCard title={t("overview.customers.title")}>
          <RecentCustomers
            customers={customers}
            isLoading={customersQuery.isLoading}
            timezone={businessTimezone}
          />
        </SectionCard>
        <RecentReviews
          averageRating={overview?.reviews?.averageRating}
          isLoading={reviewsQuery.isLoading}
          reviews={reviews}
        />
      </section>
    </div>
  );
}
