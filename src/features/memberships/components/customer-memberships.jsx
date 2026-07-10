"use client";

import Link from "next/link";
import { CalendarClock, CreditCard, History, RefreshCcw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { ActionErrorDialog } from "@/components/ui/action-error-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useToast } from "@/components/ui/toast";
import {
  getIntervalLabel,
  getMembershipStatusVariant
} from "@/features/memberships/lifecycle";
import {
  useCancelCustomerMembership,
  useCustomerMemberships,
  useRenewCustomerMembership
} from "@/features/memberships/hooks/use-memberships";
import { formatLocalizedDateTime, formatLocalizedMoney } from "@/i18n/format";

function createIdempotencyKey(prefix) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}

function formatDate(value, timezone = "UTC", language = "en") {
  return formatLocalizedDateTime(value, timezone, language, {
    dateStyle: "medium"
  });
}

function MembershipCard({
  language,
  membership,
  onCancel,
  onRenew,
  renewing
}) {
  const timezone = membership.business?.timezone || "UTC";
  const price = formatLocalizedMoney(
    membership.planPriceCentsSnapshot,
    membership.planCurrencySnapshot,
    language
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{membership.planNameSnapshot}</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              {membership.business.name}
            </p>
          </div>
          <Badge variant={getMembershipStatusVariant(membership.effectiveStatus)}>
            {membership.effectiveStatus.toLowerCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
          <div className="rounded-2xl border border-growth-border bg-white p-3">
            <p className="font-semibold text-growth-sidebar">Price</p>
            <p className="mt-1">{price}/{getIntervalLabel(membership.planIntervalSnapshot)}</p>
          </div>
          <div className="rounded-2xl border border-growth-border bg-white p-3">
            <p className="font-semibold text-growth-sidebar">Started</p>
            <p className="mt-1">{formatDate(membership.startsAt, timezone, language)}</p>
          </div>
          <div className="rounded-2xl border border-growth-border bg-white p-3">
            <p className="font-semibold text-growth-sidebar">Expires</p>
            <p className="mt-1">{formatDate(membership.endsAt, timezone, language)}</p>
          </div>
        </div>

        {Array.isArray(membership.plan?.features) && membership.plan.features.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {membership.plan.features.slice(0, 5).map((feature) => (
              <Badge key={feature} variant="outline">{feature}</Badge>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {membership.canRenew ? (
            <Button
              isLoading={renewing}
              loadingLabel="Renewing..."
              size="sm"
              onClick={() => onRenew(membership)}
            >
              <RefreshCcw className="me-2 size-4" aria-hidden="true" />
              Renew
            </Button>
          ) : null}
          {membership.canCancel ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCancel(membership)}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyPanel({ title, actionHref = "/businesses" }) {
  return (
    <div className="rounded-2xl border border-dashed border-growth-border bg-white/70 p-6 text-sm text-muted-foreground">
      <p className="font-semibold text-growth-sidebar">{title}</p>
      <Button asChild className="mt-4" size="sm" variant="outline">
        <Link href={actionHref}>Browse businesses</Link>
      </Button>
    </div>
  );
}

export function CustomerMemberships({
  initialData,
  language = "en"
}) {
  const { showToast } = useToast();
  const [membershipToCancel, setMembershipToCancel] = useState(null);
  const [actionError, setActionError] = useState(null);
  const membershipQuery = useCustomerMemberships();
  const renewMutation = useRenewCustomerMembership();
  const cancelMutation = useCancelCustomerMembership();
  const data = membershipQuery.data || initialData;
  const activeMemberships = data?.activeMemberships || [];
  const membershipHistory = data?.membershipHistory || [];
  const summary = data?.summary || { active: 0, total: 0, expiringSoon: 0 };

  async function handleRenew(membership) {
    try {
      const result = await renewMutation.mutateAsync({
        membershipId: membership.id,
        values: {
          paymentProvider: "MANUAL",
          idempotencyKey: createIdempotencyKey("renew")
        }
      });
      showToast({ title: result.message || "Membership renewed.", variant: "success" });
    } catch (error) {
      setActionError({
        title: "Renewal failed",
        description: "We could not renew this membership.",
        details: error.message
      });
    }
  }

  async function handleCancel() {
    if (!membershipToCancel) {
      return;
    }

    try {
      const result = await cancelMutation.mutateAsync({
        membershipId: membershipToCancel.id,
        values: {
          reason: "Canceled by customer"
        }
      });
      showToast({ title: result.message, variant: "success" });
      setMembershipToCancel(null);
    } catch (error) {
      setMembershipToCancel(null);
      setActionError({
        title: "Cancellation failed",
        description: "We could not cancel this membership.",
        details: error.message
      });
    }
  }

  return (
    <div className="space-y-6">
      <ActionErrorDialog
        error={actionError}
        onClear={() => setActionError(null)}
      />

      <ConfirmationDialog
        confirmLabel="Cancel membership"
        description={
          membershipToCancel
            ? `${membershipToCancel.planNameSnapshot} at ${membershipToCancel.business.name} will be canceled.`
            : ""
        }
        isLoading={cancelMutation.isPending}
        loadingLabel="Canceling..."
        open={Boolean(membershipToCancel)}
        title="Cancel membership?"
        onConfirm={handleCancel}
        onOpenChange={(open) => {
          if (!open) {
            setMembershipToCancel(null);
          }
        }}
      />

      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">Customer memberships</p>
          <h1 className="text-3xl font-bold tracking-tight">Memberships</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            View active plans, renewal history, and membership status across businesses.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/businesses">Browse businesses</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <ShieldCheck className="size-8 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{summary.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <History className="size-8 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{summary.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <CalendarClock className="size-8 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm text-muted-foreground">Expiring soon</p>
              <p className="text-2xl font-bold">{summary.expiringSoon}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {membershipQuery.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {membershipQuery.error.message}
        </div>
      ) : null}

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <CreditCard className="size-5 text-primary" aria-hidden="true" />
          Active Memberships
        </h2>
        {activeMemberships.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {activeMemberships.map((membership) => (
              <MembershipCard
                key={membership.id}
                language={language}
                membership={membership}
                renewing={renewMutation.isPending}
                onCancel={setMembershipToCancel}
                onRenew={handleRenew}
              />
            ))}
          </div>
        ) : (
          <EmptyPanel title="No active memberships" />
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Membership History</h2>
        {membershipHistory.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {membershipHistory.map((membership) => (
              <MembershipCard
                key={membership.id}
                language={language}
                membership={membership}
                renewing={renewMutation.isPending}
                onCancel={setMembershipToCancel}
                onRenew={handleRenew}
              />
            ))}
          </div>
        ) : (
          <EmptyPanel title="No membership history" />
        )}
      </section>
    </div>
  );
}
