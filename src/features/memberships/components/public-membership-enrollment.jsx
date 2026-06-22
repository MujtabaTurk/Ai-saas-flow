"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, CreditCard, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/features/auth/components/field-error";
import { getIntervalLabel } from "@/features/memberships/lifecycle";
import {
  useCreatePublicMembershipCheckout,
  useReconcilePublicMembershipCheckout
} from "@/features/memberships/hooks/use-memberships";
import { publicMembershipEnrollmentSchema } from "@/features/memberships/validation/membership-schema";
import { formatLocalizedDateTime, formatLocalizedMoney } from "@/i18n/format";

function createIdempotencyKey() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatPlanPrice(plan, language = "en") {
  return `${formatLocalizedMoney(plan.priceCents, plan.currency, language)}/${getIntervalLabel(plan.billingInterval)}`;
}

export function PublicMembershipEnrollment({
  business,
  language = "en",
  plans
}) {
  const [step, setStep] = useState("plan");
  const [selectedPlanId, setSelectedPlanId] = useState(plans[0]?.id || "");
  const [confirmation, setConfirmation] = useState(null);
  const [checkoutStatus, setCheckoutStatus] = useState(null);
  const [reconciledSessionId, setReconciledSessionId] = useState(null);
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);
  const searchParams = useSearchParams();
  const checkoutMutation = useCreatePublicMembershipCheckout(business.slug);
  const reconcileMutation = useReconcilePublicMembershipCheckout(business.slug);
  const successSessionId =
    searchParams.get("membership") === "success"
      ? searchParams.get("session_id")
      : null;
  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId),
    [plans, selectedPlanId]
  );

  useEffect(() => {
    let isMounted = true;

    async function reconcileCheckout() {
      if (!successSessionId || reconciledSessionId === successSessionId) {
        return;
      }

      setCheckoutStatus("Activating membership...");
      setReconciledSessionId(successSessionId);

      try {
        const result = await reconcileMutation.mutateAsync(successSessionId);

        if (!isMounted) {
          return;
        }

        setConfirmation(result);
        setStep("activated");
        setCheckoutStatus(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setCheckoutStatus(error.message);
      }
    }

    void reconcileCheckout();

    return () => {
      isMounted = false;
    };
  }, [reconcileMutation, reconciledSessionId, successSessionId]);

  const formik = useFormik({
    initialValues: {
      planId: selectedPlanId,
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      paymentProvider: "STRIPE",
      idempotencyKey
    },
    enableReinitialize: true,
    validationSchema: publicMembershipEnrollmentSchema,
    onSubmit: async (values, helpers) => {
      helpers.setStatus(null);
      setCheckoutStatus(null);

      try {
        const idempotencyKey =
          values.idempotencyKey ||
          createIdempotencyKey();
        const result = await checkoutMutation.mutateAsync({
          ...values,
          planId: selectedPlanId,
          paymentProvider: "STRIPE",
          idempotencyKey
        });

        if (result.checkout?.url) {
          window.location.assign(result.checkout.url);
          return;
        }

        if (result.membership) {
          setConfirmation(result);
          setStep("activated");
        }
      } catch (error) {
        helpers.setStatus(error.message);
        helpers.setErrors(error.details || {});
      }
    }
  });
  const formNotice = checkoutStatus || formik.status;
  const formNoticeIsLoading =
    checkoutStatus === "Activating membership..." && !formik.status;

  if (confirmation) {
    const membership = confirmation.membership;

    return (
      <Card>
        <CardHeader>
          <Badge variant="success">Membership activated</Badge>
          <CardTitle>{membership.planNameSnapshot}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Active until{" "}
            {formatLocalizedDateTime(
              membership.endsAt,
              business.timezone,
              language,
              {
                dateStyle: "full"
              }
            )}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="sm">
              <Link href="/customer/memberships">Customer dashboard</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/${business.slug}`}>Back to business</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form className="space-y-6" onSubmit={formik.handleSubmit}>
      {formNotice ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            formNoticeIsLoading
              ? "border-growth-border bg-growth-dashboard text-muted-foreground"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {formNotice}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={step === "plan" ? "success" : "outline"}>
              Select Plan
            </Badge>
            <Badge variant={step === "payment" ? "success" : "outline"}>
              Payment
            </Badge>
            <Badge variant="outline">Activation</Badge>
          </div>
          <CardTitle>Membership Plans</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {plans.map((plan) => (
            <button
              className={`rounded-2xl border p-4 text-start transition ${
                selectedPlanId === plan.id
                  ? "border-primary bg-growth-mint/30"
                  : "border-growth-border bg-white hover:bg-growth-dashboard"
              }`}
              key={plan.id}
              type="button"
              onClick={() => {
                const nextIdempotencyKey = createIdempotencyKey();

                setIdempotencyKey(nextIdempotencyKey);
                setSelectedPlanId(plan.id);
                formik.setFieldValue("planId", plan.id);
                formik.setFieldValue("idempotencyKey", nextIdempotencyKey);
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-growth-sidebar">{plan.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.durationDays} days
                  </p>
                </div>
                <p className="font-bold text-primary">
                  {formatPlanPrice(plan, language)}
                </p>
              </div>
              {Array.isArray(plan.features) && plan.features.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {plan.features.slice(0, 4).map((feature) => (
                    <Badge key={feature} variant="outline">{feature}</Badge>
                  ))}
                </div>
              ) : null}
            </button>
          ))}
          <div className="md:col-span-2">
            <Button
              disabled={!selectedPlan}
              type="button"
              onClick={() => setStep("payment")}
            >
              Continue to payment
            </Button>
          </div>
        </CardContent>
      </Card>

      {step === "payment" ? (
        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="membership-customerName">Name</Label>
              <Input
                id="membership-customerName"
                name="customerName"
                value={formik.values.customerName}
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
              />
              <FieldError>{formik.touched.customerName && formik.errors.customerName}</FieldError>
            </div>
            <div className="space-y-2">
              <Label htmlFor="membership-customerEmail">Email</Label>
              <Input
                id="membership-customerEmail"
                name="customerEmail"
                type="email"
                value={formik.values.customerEmail}
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
              />
              <FieldError>{formik.touched.customerEmail && formik.errors.customerEmail}</FieldError>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="membership-customerPhone">Phone</Label>
              <Input
                id="membership-customerPhone"
                name="customerPhone"
                value={formik.values.customerPhone}
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
              />
              <FieldError>{formik.touched.customerPhone && formik.errors.customerPhone}</FieldError>
            </div>

            <div className="rounded-2xl border border-growth-border bg-growth-dashboard p-4 md:col-span-2">
              <div className="flex items-start gap-3">
                <CreditCard className="mt-1 size-5 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-growth-sidebar">
                    {selectedPlan ? formatPlanPrice(selectedPlan, language) : ""}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Stripe will confirm the payment, then activate the membership.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 md:col-span-2 sm:flex-row sm:justify-end">
              <Button
                disabled={formik.isSubmitting}
                type="button"
                variant="outline"
                onClick={() => setStep("plan")}
              >
                Back
              </Button>
              <Button
                disabled={!selectedPlan}
                isLoading={formik.isSubmitting || checkoutMutation.isPending}
                loadingLabel="Opening Stripe..."
                type="submit"
              >
                <CheckCircle2 className="mr-2 size-4" aria-hidden="true" />
                Pay with Stripe
              </Button>
            </div>
            <div className="md:col-span-2">
              <FieldError>
                {formik.submitCount > 0 && formik.errors.idempotencyKey}
              </FieldError>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-2xl border border-growth-border bg-white p-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-3">
            <UserRound className="size-5 text-primary" aria-hidden="true" />
            <span>Select a plan to continue.</span>
          </div>
        </div>
      )}
    </form>
  );
}
