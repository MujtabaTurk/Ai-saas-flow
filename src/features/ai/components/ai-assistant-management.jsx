"use client";

import { useMemo, useState } from "react";
import { useFormik } from "formik";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorDialog } from "@/components/ui/error-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { Label } from "@/components/ui/label";
import {
  MetricCardsSkeleton,
  Skeleton,
  TableSkeleton,
  useDelayedVisibility
} from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {
  AI_GENERATION_TYPE_OPTIONS,
  AI_GENERATION_TYPES,
  AI_TARGET_LANGUAGES,
  AI_TONES
} from "@/features/ai/constants";
import {
  useAiWorkspace,
  useApplyAiGeneration,
  useGenerateAiContent,
  useReviewAiGeneration
} from "@/features/ai/hooks/use-ai-assistant";
import { aiGenerationSchema } from "@/features/ai/validation/ai-schema";

function SelectField({ className = "", ...props }) {
  return (
    <select
      className={`h-11 w-full rounded-2xl border border-input bg-white px-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
      {...props}
    />
  );
}

function formatDate(value, timezone) {
  return new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatPeriodDate(value) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium"
  }).format(new Date(value));
}

function formatCost(value) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 4,
    maximumFractionDigits: 6
  }).format(value);
}

function generationLabel(type) {
  return (
    AI_GENERATION_TYPE_OPTIONS.find((option) => option.value === type)
      ?.label || type
  );
}

function statusVariant(status) {
  if (status === "COMPLETED") {
    return "success";
  }

  if (status === "FAILED") {
    return "destructive";
  }

  return "warning";
}

function approvalVariant(status) {
  if (status === "APPROVED") {
    return "success";
  }

  if (status === "REJECTED") {
    return "destructive";
  }

  return "outline";
}

function fieldError(formik, name) {
  return formik.touched[name] && formik.errors[name]
    ? formik.errors[name]
    : null;
}

export function AiAssistantManagement({
  businessId,
  businessTimezone,
  isReadOnly = false
}) {
  const { showToast } = useToast();
  const [selectedGenerationId, setSelectedGenerationId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const workspaceQuery = useAiWorkspace(businessId);
  const generateMutation = useGenerateAiContent(businessId);
  const reviewMutation = useReviewAiGeneration(businessId);
  const applyMutation = useApplyAiGeneration(businessId);
  const showAiSkeleton = useDelayedVisibility(workspaceQuery.isLoading);
  const workspace = workspaceQuery.data;
  const services = useMemo(
    () => workspace?.services || [],
    [workspace?.services]
  );
  const generations = useMemo(
    () => workspace?.generations || [],
    [workspace?.generations]
  );
  const usage = workspace?.usage;
  const access = workspace?.access;
  const provider = workspace?.provider;
  const providerEnvironmentVariables =
    provider?.requiredEnvironmentVariables?.length > 0
      ? provider.requiredEnvironmentVariables
      : ["GEMINI_API_KEY", "GEMINI_MODEL"];
  const activeGeneration = useMemo(() => {
    const preferredId =
      selectedGenerationId ||
      generateMutation.data?.generation?.id ||
      generations[0]?.id;

    return (
      generations.find((generation) => generation.id === preferredId) ||
      generateMutation.data?.generation ||
      null
    );
  }, [generateMutation.data, generations, selectedGenerationId]);
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      type: AI_GENERATION_TYPES.SERVICE_DESCRIPTION,
      prompt:
        "Write a clear description that explains the customer benefit and what to expect.",
      serviceId: services[0]?.id || "",
      targetLanguage: "de",
      tone: "PROFESSIONAL"
    },
    validationSchema: aiGenerationSchema,
    onSubmit: async (values, helpers) => {
      try {
        const result = await generateMutation.mutateAsync({
          ...values,
          serviceId:
            values.type === AI_GENERATION_TYPES.SERVICE_DESCRIPTION
              ? values.serviceId || null
              : null,
          targetLanguage:
            values.type === AI_GENERATION_TYPES.TRANSLATION
              ? values.targetLanguage
              : null
        });
        setSelectedGenerationId(result.generation.id);
        showToast({ title: result.message, variant: "success" });
      } catch (error) {
        helpers.setErrors(error.details || {});
        setActionError({
          description: "We could not generate this AI draft. Check the request, credits, and provider configuration before trying again.",
          details: error.message,
          title: "AI generation failed"
        });
      }
    }
  });
  const effectiveReadOnly = isReadOnly || access?.isReadOnly;
  const canGenerate =
    access?.canGenerate === true && !generateMutation.isPending;

  async function handleReview(approvalStatus, event) {
    event?.preventDefault();

    if (!activeGeneration) {
      return;
    }

    try {
      const result = await reviewMutation.mutateAsync({
        generationId: activeGeneration.id,
        approvalStatus
      });
      showToast({ title: result.message, variant: "success" });
    } catch (error) {
      setActionError({
        description: "We could not update the review decision for this draft. Please try again.",
        details: error.message,
        title: "Draft review failed"
      });
    }
  }

  async function handleCopy(event) {
    event?.preventDefault();

    if (
      !activeGeneration?.output ||
      activeGeneration.approvalStatus !== "APPROVED"
    ) {
      return;
    }

    try {
      await navigator.clipboard.writeText(activeGeneration.output);
      showToast({
        title: "Approved draft copied to the clipboard.",
        variant: "success"
      });
    } catch {
      showToast({
        title: "The browser could not copy this draft.",
        variant: "error"
      });
    }
  }

  function openApplyDialog(event) {
    event?.preventDefault();

    if (!activeGeneration || applyMutation.isPending) {
      return;
    }

    setApplyDialogOpen(true);
  }

  async function handleApply(event) {
    event?.preventDefault();

    if (!activeGeneration) {
      return;
    }

    try {
      const result = await applyMutation.mutateAsync(activeGeneration.id);
      setApplyDialogOpen(false);
      showToast({ title: result.message, variant: "success" });
    } catch (error) {
      setApplyDialogOpen(false);
      setActionError({
        description: "We could not apply this approved draft to the service. Please try again.",
        details: error.message,
        title: "Apply draft failed"
      });
    }
  }

  if (workspaceQuery.isLoading) {
    if (!showAiSkeleton) {
      return <div className="min-h-96" role="status" aria-label="Loading AI assistant" />;
    }

    return (
      <div className="space-y-5" role="status" aria-label="Loading AI assistant">
        <MetricCardsSkeleton count={4} />
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div className="space-y-2" key={index}>
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className={index === 4 ? "h-32 rounded-2xl" : "h-11 rounded-2xl"} />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
              <Skeleton className="h-48 rounded-2xl" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-28 rounded-xl" />
                <Skeleton className="h-9 w-20 rounded-xl" />
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <TableSkeleton columns={6} rows={5} minWidth="900px" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (workspaceQuery.isError) {
    return (
      <ErrorState
        description={workspaceQuery.error.message}
        onAction={() => workspaceQuery.refetch()}
      />
    );
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
        confirmLabel="Apply draft"
        description={
          activeGeneration?.service
            ? `This replaces the current description for "${activeGeneration.service.name}" with the approved AI draft.`
            : "This replaces the current service description with the approved AI draft."
        }
        isLoading={applyMutation.isPending}
        loadingLabel="Applying..."
        open={applyDialogOpen}
        title="Apply approved draft?"
        variant="default"
        onConfirm={handleApply}
        onOpenChange={setApplyDialogOpen}
      />
      {effectiveReadOnly ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This business is suspended. AI history remains visible, but new
          generations and review actions are disabled.
        </div>
      ) : null}
      {!provider?.configured ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          AI generation is not configured. Configure{" "}
          {providerEnvironmentVariables.map((name, index) => (
            <span key={name}>
              {index > 0
                ? index === providerEnvironmentVariables.length - 1
                  ? " and "
                  : ", "
                : null}
              <code>{name}</code>
            </span>
          ))}{" "}
          for {provider?.displayName || "the AI provider"}. The model defaults
          to <code>{provider?.model}</code>.
        </div>
      ) : null}
      {usage?.limit === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          The {usage.planCode || "current"} plan does not include AI credits.
          Upgrade to Basic or Pro to generate drafts.
        </div>
      ) : usage?.remaining === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This plan has used all AI credits for the current billing period.
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Plan
            </p>
            <p className="mt-2 text-2xl font-bold text-growth-sidebar">
              {usage?.planCode || "None"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Credits used
            </p>
            <p className="mt-2 text-2xl font-bold text-growth-sidebar">
              {usage?.used ?? 0}
              <span className="text-sm font-medium text-muted-foreground">
                /{usage?.limit ?? 0}
              </span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Credits remaining
            </p>
            <p className="mt-2 text-2xl font-bold text-growth-sidebar">
              {usage?.remaining ?? 0}
            </p>
            {usage?.reserved ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {usage.reserved} currently reserved
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Token usage
            </p>
            <p className="mt-2 text-2xl font-bold text-growth-sidebar">
              {(usage?.totalTokens || 0).toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {usage?.estimatedCostUsd === null
                ? "Add cost rates to estimate spend"
                : `Estimated ${formatCost(usage.estimatedCostUsd)}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {usage?.periodStart && usage?.periodEnd ? (
        <p className="text-xs text-muted-foreground">
          Credit period: {formatPeriodDate(usage.periodStart)} to{" "}
          {formatPeriodDate(usage.periodEnd)}. One completed generation uses one
          credit; failed requests release their reservation.
        </p>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Create an AI draft</CardTitle>
            <p className="text-sm text-muted-foreground">
              AI output is a private draft. Review it before copying or applying
              it, and do not include sensitive customer information.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={formik.handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="type">Task</Label>
                <SelectField
                  id="type"
                  name="type"
                  value={formik.values.type}
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                >
                  {AI_GENERATION_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectField>
                <p className="text-xs text-muted-foreground">
                  {
                    AI_GENERATION_TYPE_OPTIONS.find(
                      (option) => option.value === formik.values.type
                    )?.description
                  }
                </p>
              </div>

              {formik.values.type ===
              AI_GENERATION_TYPES.SERVICE_DESCRIPTION ? (
                <div className="space-y-2">
                  <Label htmlFor="serviceId">Service</Label>
                  <SelectField
                    id="serviceId"
                    name="serviceId"
                    value={formik.values.serviceId}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                  >
                    <option value="">Choose a service</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                        {service.isActive ? "" : " (inactive)"}
                      </option>
                    ))}
                  </SelectField>
                  {fieldError(formik, "serviceId") ? (
                    <p className="text-xs text-red-600">
                      {fieldError(formik, "serviceId")}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {formik.values.type === AI_GENERATION_TYPES.TRANSLATION ? (
                <div className="space-y-2">
                  <Label htmlFor="targetLanguage">Target language</Label>
                  <SelectField
                    id="targetLanguage"
                    name="targetLanguage"
                    value={formik.values.targetLanguage}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                  >
                    {AI_TARGET_LANGUAGES.map((language) => (
                      <option key={language.value} value={language.value}>
                        {language.label}
                      </option>
                    ))}
                  </SelectField>
                  {fieldError(formik, "targetLanguage") ? (
                    <p className="text-xs text-red-600">
                      {fieldError(formik, "targetLanguage")}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="tone">Tone</Label>
                <SelectField
                  id="tone"
                  name="tone"
                  value={formik.values.tone}
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                >
                  {AI_TONES.map((tone) => (
                    <option key={tone} value={tone}>
                      {tone.charAt(0) + tone.slice(1).toLowerCase()}
                    </option>
                  ))}
                </SelectField>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt">Instructions or source text</Label>
                <Textarea
                  id="prompt"
                  name="prompt"
                  rows={8}
                  value={formik.values.prompt}
                  onBlur={formik.handleBlur}
                  onChange={formik.handleChange}
                  placeholder="Describe what the draft should communicate..."
                />
                <div className="flex justify-between gap-3 text-xs">
                  <span className="text-red-600">
                    {fieldError(formik, "prompt")}
                  </span>
                  <span className="text-muted-foreground">
                    {formik.values.prompt.length}/3000
                  </span>
                </div>
              </div>

              <Button
                className="w-full"
                disabled={!canGenerate}
                isLoading={generateMutation.isPending}
                loadingLabel="Generating draft..."
                type="submit"
              >
                Generate draft (1 credit)
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Draft review</CardTitle>
            <p className="text-sm text-muted-foreground">
              Approval is required before copy and apply actions become
              available.
            </p>
          </CardHeader>
          <CardContent>
            {!activeGeneration ? (
              <EmptyState
                title="No draft selected"
                description="Generate a draft or select one from history."
              />
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={statusVariant(activeGeneration.status)}>
                    {activeGeneration.status}
                  </Badge>
                  {activeGeneration.status === "COMPLETED" ? (
                    <Badge
                      variant={approvalVariant(
                        activeGeneration.approvalStatus
                      )}
                    >
                      {activeGeneration.approvalStatus}
                    </Badge>
                  ) : null}
                  <Badge variant="outline">
                    {generationLabel(activeGeneration.type)}
                  </Badge>
                  {activeGeneration.appliedAt ? (
                    <Badge variant="success">APPLIED</Badge>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-growth-border bg-growth-dashboard p-4">
                  {activeGeneration.output ? (
                    <p className="whitespace-pre-wrap text-sm leading-7 text-growth-sidebar">
                      {activeGeneration.output}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {activeGeneration.errorMessage ||
                        "This draft is still being generated."}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{activeGeneration.model || "Model pending"}</span>
                  <span>
                    {activeGeneration.totalTokens.toLocaleString()} tokens
                  </span>
                  <span>
                    {formatDate(
                      activeGeneration.createdAt,
                      businessTimezone
                    )}
                  </span>
                  {activeGeneration.service ? (
                    <span>{activeGeneration.service.name}</span>
                  ) : null}
                </div>

                {activeGeneration.status === "COMPLETED" ? (
                  <div className="flex flex-wrap gap-2">
                    {activeGeneration.approvalStatus !== "APPROVED" ? (
                      <Button
                        disabled={
                          effectiveReadOnly || reviewMutation.isPending
                        }
                        isLoading={reviewMutation.isPending}
                        loadingLabel="Saving..."
                        size="sm"
                        type="button"
                        onClick={(event) =>
                          handleReview("APPROVED", event)
                        }
                      >
                        Approve draft
                      </Button>
                    ) : null}
                    {activeGeneration.approvalStatus !== "REJECTED" &&
                    !activeGeneration.appliedAt ? (
                      <Button
                        disabled={
                          effectiveReadOnly || reviewMutation.isPending
                        }
                        isLoading={reviewMutation.isPending}
                        loadingLabel="Saving..."
                        size="sm"
                        type="button"
                        variant="outline"
                        onClick={(event) =>
                          handleReview("REJECTED", event)
                        }
                      >
                        Reject
                      </Button>
                    ) : null}
                    <Button
                      disabled={
                        activeGeneration.approvalStatus !== "APPROVED"
                      }
                      size="sm"
                      type="button"
                      variant="outline"
                      onClick={handleCopy}
                    >
                      Copy approved draft
                    </Button>
                    {activeGeneration.type ===
                      AI_GENERATION_TYPES.SERVICE_DESCRIPTION &&
                    activeGeneration.approvalStatus === "APPROVED" &&
                    !activeGeneration.appliedAt ? (
                      <Button
                        disabled={
                          effectiveReadOnly || applyMutation.isPending
                        }
                        isLoading={applyMutation.isPending}
                        loadingLabel="Applying..."
                        size="sm"
                        type="button"
                        onClick={openApplyDialog}
                      >
                        Apply to service
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generation history</CardTitle>
          <p className="text-sm text-muted-foreground">
            The latest 50 tenant-scoped requests, outputs, usage, and approval
            decisions are retained for review.
          </p>
        </CardHeader>
        <CardContent>
          {generations.length === 0 ? (
            <EmptyState
              title="No AI history"
              description="Your first generated draft will appear here."
            />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-growth-border">
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead className="bg-growth-mint/50 text-growth-sidebar">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Task</th>
                    <th className="px-4 py-3 font-semibold">Requested by</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Usage</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-growth-border bg-white">
                  {generations.map((generation) => (
                    <tr
                      className="hover:bg-growth-mint/20"
                      key={generation.id}
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold text-growth-sidebar">
                          {generationLabel(generation.type)}
                        </p>
                        <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
                          {generation.prompt}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {generation.createdBy.name ||
                          generation.createdBy.email}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={statusVariant(generation.status)}>
                            {generation.status}
                          </Badge>
                          {generation.status === "COMPLETED" ? (
                            <Badge
                              variant={approvalVariant(
                                generation.approvalStatus
                              )}
                            >
                              {generation.approvalStatus}
                            </Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {generation.totalTokens.toLocaleString()} tokens
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {formatDate(
                          generation.createdAt,
                          businessTimezone
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button
                          size="sm"
                          type="button"
                          variant="outline"
                          onClick={() =>
                            setSelectedGenerationId(generation.id)
                          }
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
