"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarClock,
  CreditCard,
  ListChecks,
  Search,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { ErrorDialog } from "@/components/ui/error-dialog";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import {
  TableSkeleton,
  useDelayedVisibility
} from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  getIntervalLabel,
  getMembershipStatusVariant,
  MEMBERSHIP_STATUSES
} from "@/features/memberships/lifecycle";
import { MembershipPlanForm } from "@/features/memberships/components/membership-plan-form";
import {
  useBusinessMemberships,
  useCreateMembershipPlan,
  useDeleteMembershipPlan,
  useMembershipAnalytics,
  useMembershipPlans,
  useUpdateMembershipPlan
} from "@/features/memberships/hooks/use-memberships";
import { formatLocalizedDateTime, formatLocalizedMoney } from "@/i18n/format";

const tabs = [
  { id: "plans", label: "Plans", icon: ListChecks },
  { id: "members", label: "Members", icon: Users },
  { id: "analytics", label: "Analytics", icon: BarChart3 }
];

const statusOptions = ["ALL", ...Object.values(MEMBERSHIP_STATUSES)];

function formatDate(value, timezone = "UTC", language = "en") {
  if (!value) {
    return "Not set";
  }

  return formatLocalizedDateTime(value, timezone, language, {
    dateStyle: "medium"
  });
}

function formatPlanPrice(plan, language = "en") {
  const price = formatLocalizedMoney(plan.priceCents, plan.currency, language);
  return `${price}/${getIntervalLabel(plan.billingInterval)}`;
}

function Metric({ icon: Icon, label, value, helper }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-growth-mint text-growth-forest">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function BusinessMembershipDashboard({
  businessCurrency = "usd",
  businessId,
  businessTimezone = "UTC",
  isReadOnly = false,
  language = "en"
}) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("plans");
  const [mode, setMode] = useState("list");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState(null);

  const planQuery = useMembershipPlans(businessId);
  const memberQuery = useBusinessMemberships(businessId, { status, search });
  const analyticsQuery = useMembershipAnalytics(businessId);
  const createMutation = useCreateMembershipPlan(businessId);
  const updateMutation = useUpdateMembershipPlan(businessId);
  const deleteMutation = useDeleteMembershipPlan(businessId);
  const showPlanSkeleton = useDelayedVisibility(planQuery.isLoading);
  const showMemberSkeleton = useDelayedVisibility(memberQuery.isLoading);

  const plans = useMemo(() => planQuery.data?.plans || [], [planQuery.data?.plans]);
  const memberships = memberQuery.data?.memberships || [];
  const analytics = analyticsQuery.data?.analytics;

  async function handleCreate(values, helpers) {
    const result = await createMutation.mutateAsync(values);
    showToast({ title: result.message, variant: "success" });
    helpers.resetForm();
    setMode("list");
  }

  async function handleUpdate(values) {
    const result = await updateMutation.mutateAsync({
      planId: selectedPlan.id,
      values
    });
    showToast({ title: result.message, variant: "success" });
    setSelectedPlan(null);
    setMode("list");
  }

  async function handleDelete() {
    if (!planToDelete) {
      return;
    }

    try {
      const result = await deleteMutation.mutateAsync(planToDelete.id);
      showToast({ title: result.message, variant: "success" });
      setPlanToDelete(null);
    } catch (error) {
      setPlanToDelete(null);
      setActionError({
        title: "Plan update failed",
        description: "We could not delete or deactivate this plan.",
        details: error.message
      });
    }
  }

  function closePlanForm() {
    setMode("list");
    setSelectedPlan(null);
  }

  return (
    <div className="space-y-5">
      <ErrorDialog
        description={actionError?.description}
        details={actionError?.details}
        open={Boolean(actionError)}
        title={actionError?.title}
        onOpenChange={(open) => {
          if (!open) {
            setActionError(null);
          }
        }}
      />

      <ConfirmationDialog
        confirmLabel={planToDelete?.memberCount > 0 ? "Deactivate plan" : "Delete plan"}
        description={
          planToDelete
            ? `${planToDelete.name} will ${planToDelete.memberCount > 0 ? "be deactivated because it has membership history" : "be permanently deleted"}.`
            : ""
        }
        isLoading={deleteMutation.isPending}
        loadingLabel="Updating..."
        open={Boolean(planToDelete)}
        title="Update plan?"
        onConfirm={handleDelete}
        onOpenChange={(open) => {
          if (!open) {
            setPlanToDelete(null);
          }
        }}
      />

      <Modal
        description="Configure pricing, billing interval, access duration, and public availability."
        isDismissDisabled={createMutation.isPending || updateMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            closePlanForm();
          }
        }}
        open={mode === "create" || (mode === "edit" && Boolean(selectedPlan))}
        size="lg"
        title={mode === "edit" ? "Edit membership plan" : "Create membership plan"}
      >
        <MembershipPlanForm
          businessCurrency={businessCurrency}
          mode={mode === "edit" ? "edit" : "create"}
          plan={mode === "edit" ? selectedPlan : null}
          onCancel={closePlanForm}
          onSubmit={mode === "edit" ? handleUpdate : handleCreate}
        />
      </Modal>

      {isReadOnly ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This business is suspended. Memberships are available in read-only mode.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          helper={`${analytics?.expiringSoon || 0} expiring soon`}
          icon={Users}
          label="Active members"
          value={analytics?.activeMembers ?? "-"}
        />
        <Metric
          helper={`${plans.filter((plan) => plan.isActive).length} active`}
          icon={ListChecks}
          label="Plans"
          value={plans.length}
        />
        <Metric
          helper="Successful membership payments"
          icon={CreditCard}
          label="Revenue"
          value={
            analytics
              ? formatLocalizedMoney(
                  analytics.revenueTotalCents,
                  analytics.currency || businessCurrency,
                  language
                )
              : "-"
          }
        />
        <Metric
          helper={`${analytics?.expiredMembers || 0} expired`}
          icon={CalendarClock}
          label="Total members"
          value={analytics?.totalMembers ?? "-"}
        />
      </div>

      <TabsPrimitive.Root
        className="space-y-5"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <TabsPrimitive.List className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsPrimitive.Trigger asChild key={tab.id} value={tab.id}>
                  <Button
                    size="sm"
                    type="button"
                    variant={activeTab === tab.id ? "default" : "outline"}
                  >
                    <Icon className="mr-2 size-4" aria-hidden="true" />
                    {tab.label}
                  </Button>
                </TabsPrimitive.Trigger>
              );
            })}
          </TabsPrimitive.List>
          <Button disabled={isReadOnly} onClick={() => setMode("create")}>
            Create plan
          </Button>
        </div>

        <TabsPrimitive.Content value="plans">
          <Card>
          <CardHeader>
            <CardTitle>Membership Plans</CardTitle>
          </CardHeader>
          <CardContent>
            {planQuery.isLoading ? (
              showPlanSkeleton ? (
                <TableSkeleton columns={6} rows={4} minWidth="840px" />
              ) : (
                <div className="min-h-56" role="status" aria-label="Loading plans" />
              )
            ) : plans.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-growth-border bg-growth-dashboard p-8 text-center">
                <h3 className="text-lg font-bold text-growth-sidebar">No membership plans</h3>
                <Button
                  className="mt-5"
                  disabled={isReadOnly}
                  onClick={() => setMode("create")}
                >
                  Create first plan
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-growth-border">
                <table className="w-full min-w-[840px] border-collapse text-left text-sm">
                  <thead className="bg-growth-mint/50 text-growth-sidebar">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Plan</th>
                      <th className="px-4 py-3 font-semibold">Price</th>
                      <th className="px-4 py-3 font-semibold">Duration</th>
                      <th className="px-4 py-3 font-semibold">Members</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-growth-border bg-white">
                    {plans.map((plan) => (
                      <tr key={plan.id} className="hover:bg-growth-mint/20">
                        <td className="px-4 py-4">
                          <div className="font-semibold text-growth-sidebar">{plan.name}</div>
                          <div className="text-xs text-muted-foreground">/{plan.slug}</div>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {formatPlanPrice(plan, language)}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {plan.durationDays} days
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {plan.memberCount}
                          {plan.maxActiveMembers ? `/${plan.maxActiveMembers}` : ""}
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={plan.isActive ? "success" : "outline"}>
                            {plan.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              disabled={isReadOnly}
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPlan(plan);
                                setMode("edit");
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              disabled={isReadOnly || deleteMutation.isPending}
                              size="sm"
                              variant="destructive"
                              onClick={() => setPlanToDelete(plan)}
                            >
                              {plan.memberCount > 0 ? "Deactivate" : "Delete"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
          </Card>
        </TabsPrimitive.Content>

        <TabsPrimitive.Content value="members">
          <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle>Members List</CardTitle>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    className="pl-9"
                    placeholder="Search members"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                <Select
                  className="h-11 rounded-2xl border border-input bg-white px-4 text-sm"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === "ALL" ? "All statuses" : option.toLowerCase()}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {memberQuery.isLoading ? (
              showMemberSkeleton ? (
                <TableSkeleton columns={6} rows={6} minWidth="900px" />
              ) : (
                <div className="min-h-56" role="status" aria-label="Loading members" />
              )
            ) : memberships.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-growth-border bg-growth-dashboard p-8 text-center">
                <h3 className="text-lg font-bold text-growth-sidebar">No members found</h3>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-growth-border">
                <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                  <thead className="bg-growth-mint/50 text-growth-sidebar">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Member</th>
                      <th className="px-4 py-3 font-semibold">Plan</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Started</th>
                      <th className="px-4 py-3 font-semibold">Expires</th>
                      <th className="px-4 py-3 font-semibold">Renewals</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-growth-border bg-white">
                    {memberships.map((membership) => (
                      <tr key={membership.id} className="hover:bg-growth-mint/20">
                        <td className="px-4 py-4">
                          <div className="font-semibold text-growth-sidebar">
                            {membership.customer.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {membership.customer.email}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {membership.planNameSnapshot}
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={getMembershipStatusVariant(membership.effectiveStatus)}>
                            {membership.effectiveStatus.toLowerCase()}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {formatDate(membership.startsAt, businessTimezone, language)}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {formatDate(membership.endsAt, businessTimezone, language)}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground">
                          {membership.renewalCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
          </Card>
        </TabsPrimitive.Content>

        <TabsPrimitive.Content value="analytics">
          <Card>
          <CardHeader>
            <CardTitle>Membership Analytics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {analyticsQuery.isLoading ? (
              <div className="min-h-40" role="status" aria-label="Loading analytics" />
            ) : analytics ? (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-growth-border bg-white p-4">
                    <p className="text-sm text-muted-foreground">This month</p>
                    <p className="mt-2 text-2xl font-bold">
                      {formatLocalizedMoney(
                        analytics.revenueThisMonthCents,
                        analytics.currency || businessCurrency,
                        language
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-growth-border bg-white p-4">
                    <p className="text-sm text-muted-foreground">Past due</p>
                    <p className="mt-2 text-2xl font-bold">{analytics.pastDueMembers}</p>
                  </div>
                  <div className="rounded-2xl border border-growth-border bg-white p-4">
                    <p className="text-sm text-muted-foreground">Canceled</p>
                    <p className="mt-2 text-2xl font-bold">{analytics.canceledMembers}</p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-growth-border">
                  <table className="w-full min-w-[700px] border-collapse text-left text-sm">
                    <thead className="bg-growth-mint/50 text-growth-sidebar">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Plan</th>
                        <th className="px-4 py-3 font-semibold">Members</th>
                        <th className="px-4 py-3 font-semibold">Payments</th>
                        <th className="px-4 py-3 font-semibold">Revenue</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-growth-border bg-white">
                      {analytics.plans.map((plan) => (
                        <tr key={plan.id}>
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
                            {formatLocalizedMoney(
                              plan.revenueCents,
                              analytics.currency || businessCurrency,
                              language
                            )}
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
              </>
            ) : null}
          </CardContent>
          </Card>
        </TabsPrimitive.Content>
      </TabsPrimitive.Root>
    </div>
  );
}
