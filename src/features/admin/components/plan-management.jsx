"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useAdminPlans } from "@/features/admin/hooks/use-admin";

function formatMoney(cents) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(cents / 100);
}

function formatLimit(limit) {
  return limit === null || limit === undefined ? "Unlimited" : limit;
}

export function PlanManagement() {
  const plansQuery = useAdminPlans();

  if (plansQuery.isLoading) {
    return (
      <LoadingState
        title="Loading plans"
        description="Reading pricing and entitlement configuration..."
      />
    );
  }

  if (plansQuery.isError) {
    return (
      <ErrorState
        description={plansQuery.error.message}
        onAction={() => plansQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-growth-border bg-growth-mint/30 px-4 py-3 text-sm text-growth-sidebar">
        Plan prices and limits are application configuration. Paid plan
        checkout also requires its Stripe Price ID environment variable.
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {plansQuery.data.plans.map((plan) => (
          <Card
            className={plan.highlighted ? "border-primary shadow-md" : ""}
            key={plan.code}
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{plan.name}</CardTitle>
                <Badge
                  variant={plan.stripeConfigured ? "success" : "warning"}
                >
                  {plan.stripeConfigured
                    ? "Billing configured"
                    : "Price ID missing"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {plan.description}
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-3xl font-bold text-growth-sidebar">
                  {formatMoney(plan.monthlyPriceCents)}
                </p>
                <p className="text-sm text-muted-foreground">per month</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-growth-dashboard p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Tenants
                  </p>
                  <p className="mt-1 text-xl font-bold text-growth-sidebar">
                    {plan.tenantCount}
                  </p>
                </div>
                <div className="rounded-2xl bg-growth-dashboard p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Est. MRR
                  </p>
                  <p className="mt-1 text-xl font-bold text-growth-sidebar">
                    {formatMoney(plan.estimatedMrrCents)}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <p>
                  <strong className="text-growth-sidebar">Services:</strong>{" "}
                  {formatLimit(plan.limits.services)}
                </p>
                <p>
                  <strong className="text-growth-sidebar">Bookings:</strong>{" "}
                  {formatLimit(plan.limits.bookings)}
                </p>
                <p>
                  <strong className="text-growth-sidebar">Team members:</strong>{" "}
                  {formatLimit(plan.limits.teamMembers)}
                </p>
                <p>
                  <strong className="text-growth-sidebar">Analytics:</strong>{" "}
                  {plan.limits.analytics}
                </p>
                <p>
                  <strong className="text-growth-sidebar">AI credits:</strong>{" "}
                  {formatLimit(plan.limits.aiCredits)}
                </p>
              </div>

              <ul className="space-y-2 text-sm text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature}>- {feature}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
