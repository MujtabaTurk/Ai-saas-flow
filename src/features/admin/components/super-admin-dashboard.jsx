import Link from "next/link";
import { AlertTriangle, Building2, CalendarDays, CreditCard, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatMoney(cents) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(cents / 100);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium"
  }).format(new Date(value));
}

function statusVariant(status) {
  if (status === "ACTIVE" || status === "TRIALING") {
    return "success";
  }

  if (status === "SUSPENDED" || status === "PAST_DUE" || status === "INCOMPLETE") {
    return "warning";
  }

  if (status === "CANCELED" || status === "UNPAID" || status === "ARCHIVED") {
    return "destructive";
  }

  return "outline";
}

function MetricCard({ label, value, helper, icon: Icon }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 pt-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold text-growth-sidebar">{value}</p>
          {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
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

function DistributionBar({ label, value, total }) {
  const percent = total === 0 ? 0 : Math.round((value / total) * 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-growth-sidebar">{label}</span>
        <span className="text-muted-foreground">
          {value} | {percent}%
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-growth-dashboard">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, children }) {
  return (
    <div>
      <p className="text-sm font-semibold text-primary">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-growth-sidebar">{title}</h2>
      {children ? <p className="mt-2 text-sm text-muted-foreground">{children}</p> : null}
    </div>
  );
}

export function SuperAdminDashboard({ metrics }) {
  const subscriptionTotal = Object.values(metrics.subscriptions.statusDistribution).reduce(
    (total, value) => total + value,
    0
  );
  const businessTotal = metrics.businesses.totalBusinesses;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          icon={CreditCard}
          label="Monthly Revenue"
          value={formatMoney(metrics.revenue.mrrCents)}
          helper="Based on active paid plan codes"
        />
        <MetricCard
          icon={Building2}
          label="Total Businesses"
          value={metrics.businesses.totalBusinesses}
          helper={`${metrics.businesses.newBusinesses} new in ${metrics.periodLabel.toLowerCase()}`}
        />
        <MetricCard
          icon={Building2}
          label="Active Businesses"
          value={metrics.businesses.activeBusinesses}
          helper="Businesses currently operating"
        />
        <MetricCard
          icon={CreditCard}
          label="Active Subscriptions"
          value={metrics.subscriptions.activeSubscriptions}
          helper="Active and trialing subscriptions"
        />
        <MetricCard
          icon={CalendarDays}
          label="Bookings"
          value={metrics.businesses.totalBookings}
          helper="All business bookings"
        />
        <MetricCard
          icon={Wrench}
          label="Services"
          value={metrics.businesses.totalServices}
          helper="All configured services"
        />
      </section>

      <section className="space-y-4">
        <SectionHeader eyebrow="Treasury" title="Platform Treasury Wallet">
          Collected funds and the platform&apos;s outstanding business liability.
        </SectionHeader>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Current Treasury Balance" value={formatMoney(metrics.treasury.currentTreasuryBalance)} />
          <MetricCard label="Total Collected" value={formatMoney(metrics.treasury.totalCollectedCredits)} />
          <MetricCard label="Pending Liability" value={formatMoney(metrics.treasury.totalPendingLiability)} />
          <MetricCard label="Available Liability" value={formatMoney(metrics.treasury.totalAvailableLiability)} />
          <MetricCard label="Total Paid Out" value={formatMoney(metrics.treasury.totalPaidOutCredits)} />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader eyebrow="Revenue" title="Revenue Metrics">
          Revenue is estimated from local subscription records. Stripe invoices remain the billing source of truth.
        </SectionHeader>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="New MRR" value={formatMoney(metrics.revenue.newMrrCents)} helper={metrics.periodLabel} />
          <MetricCard label="Churned MRR" value={formatMoney(metrics.revenue.churnedMrrCents)} helper={metrics.periodLabel} />
          <MetricCard label="Failed Payments" value={metrics.revenue.failedPaymentCount} helper="Past due, unpaid, or recent failed invoice" />
          <MetricCard label="Paid Accounts" value={metrics.revenue.activePaidCount} helper="Active Basic and Pro subscriptions" />
          <MetricCard label="Webhook Failures" value={metrics.risk.failedWebhookEvents} helper="Requires operational review" />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <MetricCard label="Active paid" value={metrics.subscriptions.activePaidCount} />
              <MetricCard label="Trialing" value={metrics.subscriptions.trialingCount} />
              <MetricCard label="Past due" value={metrics.subscriptions.pastDueCount} />
              <MetricCard label="Canceled" value={metrics.subscriptions.canceledCount} />
            </div>
            <div className="rounded-2xl bg-growth-dashboard p-4 text-sm text-muted-foreground">
              Trial conversion proxy:{" "}
              <span className="font-bold text-growth-sidebar">
                {metrics.subscriptions.trialConversionRate}%
              </span>{" "}
              of active paid plus trialing tenants.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(metrics.subscriptions.planDistribution).map(([planCode, count]) => (
              <DistributionBar
                key={planCode}
                label={planCode}
                total={subscriptionTotal}
                value={count}
              />
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Business Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DistributionBar
              label="Active"
              total={businessTotal}
              value={metrics.businesses.activeBusinesses}
            />
            <DistributionBar
              label="Suspended"
              total={businessTotal}
              value={metrics.businesses.suspendedBusinesses}
            />
            <DistributionBar
              label="Archived"
              total={businessTotal}
              value={metrics.businesses.archivedBusinesses}
            />
            <div className="grid gap-3 pt-2 text-sm md:grid-cols-2">
              <div className="rounded-2xl bg-growth-dashboard p-4">
                <p className="font-semibold text-growth-sidebar">Businesses with bookings</p>
                <p className="mt-1 text-muted-foreground">{metrics.businesses.businessesWithBookings}</p>
              </div>
              <div className="rounded-2xl bg-growth-dashboard p-4">
                <p className="font-semibold text-growth-sidebar">Average bookings</p>
                <p className="mt-1 text-muted-foreground">{metrics.businesses.averageBookingsPerBusiness}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent Businesses</CardTitle>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/businesses">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {metrics.businesses.recentBusinesses.length === 0 ? (
              <p className="rounded-2xl bg-growth-dashboard p-6 text-sm text-muted-foreground">
                No businesses have been created yet.
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-growth-border">
                <table className="w-full border-collapse text-start text-sm">
                  <thead className="bg-growth-mint/50 text-growth-sidebar">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Business</th>
                      <th className="px-4 py-3 font-semibold">Plan</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Usage</th>
                      <th className="px-4 py-3 font-semibold">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-growth-border bg-white">
                    {metrics.businesses.recentBusinesses.map((business) => {
                      const subscription = business.subscriptions[0];

                      return (
                        <tr className="hover:bg-growth-mint/20" key={business.id}>
                          <td className="px-4 py-4">
                            <div className="font-semibold text-growth-sidebar">{business.name}</div>
                            <div className="text-xs text-muted-foreground">/{business.slug}</div>
                          </td>
                          <td className="px-4 py-4">
                            <Badge variant={statusVariant(subscription?.status)}>
                              {subscription?.planCode || "NONE"}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <Badge variant={statusVariant(business.status)}>{business.status}</Badge>
                          </td>
                          <td className="px-4 py-4 text-muted-foreground">
                            {business._count.services} services | {business._count.bookings} bookings
                          </td>
                          <td className="px-4 py-4 text-muted-foreground">
                            {formatDate(business.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <AlertTriangle className="h-5 w-5" />
            Risk Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-4">
          <div>
            <p className="font-semibold text-amber-900">Suspended businesses</p>
            <p className="mt-1 text-amber-800">{metrics.risk.suspendedBusinesses}</p>
          </div>
          <div>
            <p className="font-semibold text-amber-900">Past due subscriptions</p>
            <p className="mt-1 text-amber-800">{metrics.risk.pastDueSubscriptions}</p>
          </div>
          <div>
            <p className="font-semibold text-amber-900">Failed payments</p>
            <p className="mt-1 text-amber-800">{metrics.risk.failedPayments}</p>
          </div>
          <div>
            <p className="font-semibold text-amber-900">Webhook failures</p>
            <p className="mt-1 text-amber-800">{metrics.risk.failedWebhookEvents}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
