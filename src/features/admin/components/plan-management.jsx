"use client";

import { useState } from "react";
import { Check, Edit3, Plus, Power, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Modal, ModalError, ModalFooter } from "@/components/ui/modal";
import { Skeleton, useDelayedVisibility } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAdminPlanMutations, useAdminPlans } from "@/features/admin/hooks/use-admin";

const emptyPlan = { code: "", name: "", monthlyPriceCents: 0, yearlyPriceCents: "", description: "", features: [], trialDays: 0, limits: {}, aiFeatures: {}, prioritySupport: false, status: "ACTIVE" };
const money = (cents) => new Intl.NumberFormat("en", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format((cents || 0) / 100);
const limit = (value) => value === null || value === undefined ? "Unlimited" : value;

function PlanForm({ plan, onSubmit, onCancel, mutation }) {
  const [form, setForm] = useState({ ...emptyPlan, ...plan, features: Array.isArray(plan?.features) ? plan.features : [] });
  const [error, setError] = useState("");
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  async function submit(event) {
    event.preventDefault(); setError("");
    try { await onSubmit({ ...form, features: String(form.featuresText ?? form.features.join(", ")).split(",").map((item) => item.trim()).filter(Boolean), limits: { ...form.limits, teamMembers: form.teamMembers === "" ? null : Number(form.teamMembers), services: form.services === "" ? null : Number(form.services), bookings: form.bookings === "" ? null : Number(form.bookings), locations: form.locations === "" ? null : Number(form.locations) }, aiFeatures: { ...form.aiFeatures, enabled: Boolean(form.aiEnabled) } }); }
    catch (submitError) { setError(submitError.message); }
  }
  return <form className="space-y-4" onSubmit={submit}>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="space-y-1 text-sm font-medium">Plan name<Input required value={form.name} onChange={(e) => set("name", e.target.value)} /></label>
      <label className="space-y-1 text-sm font-medium">Code<Input required disabled={Boolean(plan?.id)} value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} /></label>
      <label className="space-y-1 text-sm font-medium">Monthly price (cents)<Input min="0" type="number" value={form.monthlyPriceCents} onChange={(e) => set("monthlyPriceCents", e.target.value)} /></label>
      <label className="space-y-1 text-sm font-medium">Yearly price (cents)<Input min="0" type="number" value={form.yearlyPriceCents ?? ""} onChange={(e) => set("yearlyPriceCents", e.target.value)} /></label>
    </div>
    <label className="block space-y-1 text-sm font-medium">Description<Textarea value={form.description || ""} onChange={(e) => set("description", e.target.value)} /></label>
    <label className="block space-y-1 text-sm font-medium">Features (comma separated)<Input value={form.featuresText ?? form.features.join(", ")} onChange={(e) => set("featuresText", e.target.value)} /></label>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[["trialDays", "Trial days"], ["teamMembers", "Max team members"], ["services", "Max services"], ["locations", "Max locations"], ["bookings", "Max bookings"]].map(([key, label]) => <label className="space-y-1 text-sm font-medium" key={key}>{label}<Input min="0" type="number" value={form[key] ?? form.limits?.[key.replace("teamMembers", "teamMembers")] ?? ""} onChange={(e) => set(key, e.target.value)} /></label>)}
    </div>
    <label className="flex items-center gap-2 text-sm"><input checked={Boolean(form.prioritySupport)} type="checkbox" onChange={(e) => set("prioritySupport", e.target.checked)} /> Priority support</label>
    <ModalError>{error}</ModalError>
    <ModalFooter><Button variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit" isLoading={mutation.isPending} loadingLabel="Saving...">Save plan</Button></ModalFooter>
  </form>;
}

export function PlanManagement() {
  const plansQuery = useAdminPlans(); const mutations = useAdminPlanMutations(); const showSkeleton = useDelayedVisibility(plansQuery.isLoading);
  const [editing, setEditing] = useState(null); const [confirm, setConfirm] = useState(null); const [actionError, setActionError] = useState("");
  if (plansQuery.isLoading) return showSkeleton ? <div className="grid gap-5 lg:grid-cols-3">{[1, 2, 3].map((item) => <Card key={item}><CardHeader><Skeleton className="h-6 w-28" /></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>)}</div> : <div className="min-h-80" />;
  if (plansQuery.isError) return <ErrorState description={plansQuery.error.message} onAction={() => plansQuery.refetch()} />;
  const save = async (input) => { if (editing.id) await mutations.update.mutateAsync({ planId: editing.id, input }); else await mutations.create.mutateAsync(input); setEditing(null); };
  const changeStatus = async (plan, status) => { setActionError(""); try { await mutations.update.mutateAsync({ planId: plan.id, input: { status } }); } catch (error) { setActionError(error.message); } };
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="rounded-2xl border border-growth-border bg-growth-mint/30 px-4 py-3 text-sm text-growth-sidebar">Manage SaaS plan pricing, entitlements, and lifecycle status.</div><Button onClick={() => setEditing(emptyPlan)}><Plus className="me-2 h-4 w-4" /> Add Plan</Button></div>
    <div className="grid gap-5 lg:grid-cols-3">{plansQuery.data.plans.map((plan) => <Card key={plan.id} className={plan.status === "ARCHIVED" ? "opacity-70" : ""}>
      <CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>{plan.name}</CardTitle><Badge variant={plan.status === "ACTIVE" ? "success" : plan.status === "ARCHIVED" ? "warning" : "outline"}>{plan.status}</Badge></div><p className="text-sm text-muted-foreground">{plan.description}</p></CardHeader>
      <CardContent className="space-y-5"><div><p className="text-3xl font-bold text-growth-sidebar">{money(plan.monthlyPriceCents)}</p><p className="text-sm text-muted-foreground">per month</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-growth-dashboard p-4"><p className="text-xs font-semibold uppercase text-muted-foreground">Tenants</p><p className="mt-1 text-xl font-bold">{plan.tenantCount}</p></div><div className="rounded-2xl bg-growth-dashboard p-4"><p className="text-xs font-semibold uppercase text-muted-foreground">Est. MRR</p><p className="mt-1 text-xl font-bold">{money(plan.tenantCount * plan.monthlyPriceCents)}</p></div></div><div className="space-y-2 text-sm"><p><strong>Services:</strong> {limit(plan.limits.services)}</p><p><strong>Bookings:</strong> {limit(plan.limits.bookings)}</p><p><strong>Team members:</strong> {limit(plan.limits.teamMembers)}</p><p><strong>Locations:</strong> {limit(plan.limits.locations)}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setEditing(plan)}><Edit3 className="me-1 h-4 w-4" /> Edit</Button>{plan.status === "ACTIVE" ? <Button size="sm" variant="ghost" onClick={() => changeStatus(plan, "INACTIVE")}><Power className="me-1 h-4 w-4" /> Deactivate</Button> : plan.status !== "ARCHIVED" ? <Button size="sm" variant="ghost" onClick={() => changeStatus(plan, "ACTIVE")}><Check className="me-1 h-4 w-4" /> Activate</Button> : null}<Button size="sm" variant="ghost" onClick={() => setConfirm(plan)}><Trash2 className="me-1 h-4 w-4" /> Delete</Button></div></CardContent>
    </Card>)}</div>
    <Modal open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)} size="lg" title={editing?.id ? "Edit plan" : "Add plan"} description="Changes apply to new purchases and future entitlement checks."><PlanForm key={editing?.id || "new"} plan={editing || emptyPlan} mutation={editing?.id ? mutations.update : mutations.create} onSubmit={save} onCancel={() => setEditing(null)} /></Modal>
    <ConfirmationDialog open={Boolean(confirm)} error={actionError} onOpenChange={(open) => { if (!open) { setConfirm(null); setActionError(""); } }} title={`Delete ${confirm?.name || "plan"}?`} description="Plans with existing subscribers are archived automatically so current subscribers remain unaffected." confirmLabel="Delete plan" onConfirm={async () => { setActionError(""); try { await mutations.remove.mutateAsync(confirm.id); setConfirm(null); } catch (error) { setActionError(error.message); } }} isLoading={mutations.remove.isPending} />
  </div>;
}
