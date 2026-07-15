"use client";

import { useEffect, useRef, useState } from "react";
import { CreditCard, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CardListSkeleton,
  MetricCardsSkeleton,
  Skeleton,
  useDelayedVisibility
} from "@/components/ui/skeleton";
import {
  getSubscriptionStatusVariant,
  STRIPE_MANAGED_SUBSCRIPTION_STATUSES
} from "@/features/billing/status";
import {
  useBillingState,
  useCreateBillingPortalSession,
  useCreateCheckoutSession,
  useReconcileCheckoutSession
} from "@/features/billing/hooks/use-billing";

function formatDate(value) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium"
  }).format(new Date(value));
}

function formatLimit(limit) {
  return limit === null || limit === undefined ? "Unlimited" : limit;
}

function createIdempotencyKey() {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

function usageText(count, limit) {
  if (limit === null || limit === undefined) {
    return `${count} used / unlimited`;
  }

  return `${count} used / ${limit} allowed`;
}

export function BillingManagement({ checkoutSessionId, checkoutStatus }) {
  const [operationError, setOperationError] = useState(null);
  const reconciliationStarted = useRef(false);
  const billingQuery = useBillingState();
  const checkoutMutation = useCreateCheckoutSession();
  const portalMutation = useCreateBillingPortalSession();
  const reconciliationMutation = useReconcileCheckoutSession();
  const showBillingSkeleton = useDelayedVisibility(billingQuery.isLoading);
  const reconcileCheckout = reconciliationMutation.mutateAsync;
  const data = billingQuery.data;
  const subscription = data?.subscription;
  const currentPlanCode = subscription?.planCode || "TRIAL";
  const hasStripeManagedSubscription = Boolean(
    subscription?.stripeSubscriptionId &&
      STRIPE_MANAGED_SUBSCRIPTION_STATUSES.includes(subscription.status)
  );
  const refetchBilling = billingQuery.refetch;

  useEffect(() => {
    if (checkoutStatus !== "success") {
      return undefined;
    }

    let attempts = 0;
    let canceled = false;

    async function synchronizeCheckout() {
      if (checkoutSessionId && !reconciliationStarted.current) {
        reconciliationStarted.current = true;

        try {
          await reconcileCheckout(checkoutSessionId);
        } catch (error) {
          if (!canceled) {
            setOperationError(error.message);
          }
        }
      }

      if (!canceled) {
        refetchBilling();
      }
    }

    synchronizeCheckout();
    const intervalId = window.setInterval(() => {
      attempts += 1;
      refetchBilling();

      if (attempts >= 15) {
        window.clearInterval(intervalId);
      }
    }, 2000);

    return () => {
      canceled = true;
      window.clearInterval(intervalId);
    };
  }, [
    checkoutSessionId,
    checkoutStatus,
    reconcileCheckout,
    refetchBilling
  ]);

  async function startCheckout(planCode) {
    setOperationError(null);

    try {
      const result = await checkoutMutation.mutateAsync({
        planCode,
        idempotencyKey: createIdempotencyKey()
      });

      if (result.url) {
        window.location.assign(result.url);
      }
    } catch (error) {
      setOperationError(error.message);
    }
  }

  async function openPortal() {
    setOperationError(null);

    try {
      const result = await portalMutation.mutateAsync();

      if (result.url) {
        window.location.assign(result.url);
      }
    } catch (error) {
      setOperationError(error.message);
    }
  }

  if (billingQuery.isLoading) {
    if (!showBillingSkeleton) {
      return <div className="min-h-96" role="status" aria-label="Loading billing workspace" />;
    }

    return (
      <div className="space-y-6" role="status" aria-label="Loading billing workspace">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-44" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-8 w-32" />
              <MetricCardsSkeleton count={2} className="md:grid-cols-2 xl:grid-cols-2" />
              <Skeleton className="h-11 w-40 rounded-2xl" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <CardListSkeleton count={2} />
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-11 w-full rounded-2xl" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (billingQuery.error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {billingQuery.error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {checkoutStatus === "success" ? (
        <div className="rounded-2xl border border-growth-border bg-growth-mint/40 px-4 py-3 text-sm text-growth-sidebar">
          {reconciliationMutation.isPending
            ? "Checkout finished. Synchronizing your subscription..."
            : reconciliationMutation.isSuccess
              ? "Checkout finished. Your subscription is synchronized."
              : "Checkout finished. Your subscription has been submitted for synchronization."}
        </div>
      ) : null}

      {checkoutStatus === "canceled" ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Checkout was canceled. Your current subscription was not changed.
        </div>
      ) : null}

      {operationError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {operationError}
        </div>
      ) : null}

      {!subscription ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          This business has no subscription record. Billing actions are unavailable until the account is repaired.
        </div>
      ) : null}

      {subscription && !data.entitlement.isEntitled ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your subscription is not currently entitled to premium features. Open the billing portal or choose a paid plan to restore access.
        </div>
      ) : null}

      {!data.billingConfigured ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Stripe billing is not fully configured. Missing:{" "}
          <span className="font-semibold">{data.missingConfiguration.join(", ")}</span>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Current subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-bold text-growth-sidebar">
                {subscription?.planName || currentPlanCode}
              </span>
              {subscription?.status ? (
                <Badge variant={getSubscriptionStatusVariant(subscription.status)}>
                  {subscription.status.replace("_", " ")}
                </Badge>
              ) : (
                <Badge>Trial</Badge>
              )}
              {subscription?.cancelAtPeriodEnd ? (
                <Badge variant="warning">Cancels at period end</Badge>
              ) : null}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl bg-growth-dashboard p-4">
                <p className="font-semibold text-growth-sidebar">Current period</p>
                <p className="mt-1">
                  {formatDate(subscription?.currentPeriodStart)} -{" "}
                  {formatDate(subscription?.currentPeriodEnd)}
                </p>
              </div>
              <div className="rounded-2xl bg-growth-dashboard p-4">
                <p className="font-semibold text-growth-sidebar">Trial ends</p>
                <p className="mt-1">{formatDate(subscription?.trialEndsAt)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                disabled={!data.business.hasStripeCustomer}
                isLoading={portalMutation.isPending}
                loadingLabel="Opening..."
                onClick={openPortal}
              >
                <CreditCard className="me-2 h-4 w-4" />
                Manage billing
              </Button>
              <p className="text-xs text-muted-foreground">
                Payment methods, invoices, cancellation, and plan changes are handled in Stripe.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-2xl border border-growth-border bg-white p-4">
              <p className="font-semibold text-growth-sidebar">Services</p>
              <p className="mt-1 text-muted-foreground">
                {usageText(
                  data.usage.services,
                  data.plans.find((plan) => plan.code === currentPlanCode)?.limits.services
                )}
              </p>
            </div>
            <div className="rounded-2xl border border-growth-border bg-white p-4">
              <p className="font-semibold text-growth-sidebar">Bookings</p>
              <p className="mt-1 text-muted-foreground">
                {usageText(
                  data.usage.bookings,
                  data.plans.find((plan) => plan.code === currentPlanCode)?.limits.bookings
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {data.plans.map((plan) => {
          const isCurrentPlan = currentPlanCode === plan.code;
          const isTrial = plan.code === "TRIAL";
          const shouldUsePortal =
            !isTrial && !isCurrentPlan && hasStripeManagedSubscription;
          const actionDisabled =
            isTrial ||
            isCurrentPlan ||
            !subscription ||
            (shouldUsePortal
              ? !data.business.hasStripeCustomer || portalMutation.isPending
              : !plan.stripeConfigured ||
                !plan.checkoutConfigured ||
                checkoutMutation.isPending);

          return (
            <Card
              className={plan.highlighted ? "border-primary shadow-md" : ""}
              key={plan.code}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.highlighted ? <Badge variant="success">Popular</Badge> : null}
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-2 text-sm">
                  <p>
                    <span className="font-semibold text-growth-sidebar">Services:</span>{" "}
                    {formatLimit(plan.limits.services)}
                  </p>
                  <p>
                    <span className="font-semibold text-growth-sidebar">Bookings:</span>{" "}
                    {formatLimit(plan.limits.bookings)}
                  </p>
                  <p>
                    <span className="font-semibold text-growth-sidebar">Team:</span>{" "}
                    {formatLimit(plan.limits.teamMembers)}
                  </p>
                  <p>
                    <span className="font-semibold text-growth-sidebar">AI credits:</span>{" "}
                    {formatLimit(plan.limits.aiCredits)}
                  </p>
                </div>

                <ul className="space-y-2 text-sm text-muted-foreground">
                  {plan.features.map((feature) => (
                    <li key={feature}>- {feature}</li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  disabled={actionDisabled}
                  isLoading={
                    (!shouldUsePortal && checkoutMutation.isPending) ||
                    (shouldUsePortal && portalMutation.isPending)
                  }
                  loadingLabel={
                    shouldUsePortal ? "Opening portal..." : "Starting checkout..."
                  }
                  variant={plan.highlighted ? "default" : "outline"}
                  onClick={() =>
                    shouldUsePortal ? openPortal() : startCheckout(plan.code)
                  }
                >
                  {isCurrentPlan
                    ? "Current plan"
                    : shouldUsePortal
                      ? "Manage in billing portal"
                      : plan.cta}
                  {!isTrial && !isCurrentPlan ? (
                    <ExternalLink className="ms-2 h-4 w-4" />
                  ) : null}
                </Button>

                {!plan.stripeConfigured && !isTrial ? (
                  <p className="text-xs text-amber-700">
                    This plan needs a Stripe Price ID before checkout can start.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
