"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorDialog } from "@/components/ui/error-dialog";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import {
  CardListSkeleton,
  MetricCardsSkeleton,
  useDelayedVisibility
} from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {
  useModerateReview,
  useReviews
} from "@/features/reviews/hooks/use-reviews";
import { ReviewStars } from "./review-stars";

const STATUS_OPTIONS = ["ALL", "PENDING", "PUBLISHED", "HIDDEN"];

function SelectField({ children, ...props }) {
  return (
    <select
      className="h-11 rounded-2xl border border-input bg-white px-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      {...props}
    >
      {children}
    </select>
  );
}

function statusVariant(status) {
  if (status === "PUBLISHED") {
    return "success";
  }

  if (status === "PENDING") {
    return "warning";
  }

  return "outline";
}

function formatDate(value, timezone) {
  return new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function ReviewManagement({
  businessId,
  businessTimezone,
  isReadOnly = false
}) {
  const { showToast } = useToast();
  const [status, setStatus] = useState("ALL");
  const [rating, setRating] = useState("ALL");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState(null);
  const [moderationDialog, setModerationDialog] = useState(null);
  const filters = useMemo(
    () => ({
      status,
      rating,
      search: deferredSearch,
      page,
      pageSize: 25
    }),
    [deferredSearch, page, rating, status]
  );
  const reviewsQuery = useReviews(businessId, filters);
  const moderationMutation = useModerateReview(businessId);
  const showReviewsSkeleton = useDelayedVisibility(reviewsQuery.isLoading);
  const reviews = reviewsQuery.data?.reviews || [];
  const summary = reviewsQuery.data?.summary;
  const access = reviewsQuery.data?.access;
  const pagination = reviewsQuery.data?.pagination;
  const canModerate =
    !isReadOnly &&
    access?.canModerate === true &&
    !moderationMutation.isPending;

  function moderate(review, nextStatus) {
    setModerationDialog({
      nextStatus,
      reason: "",
      review,
      validationError: null
    });
  }

  async function submitModeration(event) {
    event.preventDefault();

    if (!moderationDialog) {
      return;
    }

    if (moderationDialog.reason.length > 500) {
      setModerationDialog((current) =>
        current
          ? {
              ...current,
              validationError: "Keep the moderation note under 500 characters."
            }
          : current
      );
      return;
    }

    try {
      const result = await moderationMutation.mutateAsync({
        reviewId: moderationDialog.review.id,
        status: moderationDialog.nextStatus,
        reason: moderationDialog.reason.trim() || null
      });
      setModerationDialog(null);
      showToast({ title: result.message, variant: "success" });
    } catch (error) {
      setModerationDialog(null);
      setActionError({
        description: "We could not update this review moderation status. Please try again.",
        details: error.message,
        title: "Review update failed"
      });
    }
  }

  if (reviewsQuery.isLoading) {
    if (!showReviewsSkeleton) {
      return <div className="min-h-96" role="status" aria-label="Loading reviews" />;
    }

    return (
      <div className="space-y-5" role="status" aria-label="Loading reviews">
        <MetricCardsSkeleton count={5} className="md:grid-cols-5 xl:grid-cols-5" />
        <Card>
          <CardHeader>
            <CardTitle>Review moderation</CardTitle>
            <div className="grid gap-3 pt-3 lg:grid-cols-[1fr_auto_auto]">
              <div className="h-11 rounded-2xl bg-growth-border/70" />
              <div className="h-11 rounded-2xl bg-growth-border/70" />
              <div className="h-11 rounded-2xl bg-growth-border/70" />
            </div>
          </CardHeader>
          <CardContent>
            <CardListSkeleton count={5} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (reviewsQuery.isError) {
    return (
      <ErrorState
        description={reviewsQuery.error.message}
        onAction={() => reviewsQuery.refetch()}
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

      <Modal
        description={
          moderationDialog?.nextStatus === "PUBLISHED"
            ? "Publish this review on the customer-facing page. You can add an internal publication note."
            : "Hide this review from the customer-facing page. You can add an internal moderation reason."
        }
        isDismissDisabled={moderationMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setModerationDialog(null);
          }
        }}
        open={Boolean(moderationDialog)}
        title={
          moderationDialog?.nextStatus === "PUBLISHED"
            ? "Publish review"
            : "Hide review"
        }
      >
        <form className="space-y-4" onSubmit={submitModeration}>
          <div className="space-y-2">
            <Label htmlFor="review-moderation-note">
              {moderationDialog?.nextStatus === "PUBLISHED"
                ? "Publication note"
                : "Moderation reason"}
            </Label>
            <Textarea
              id="review-moderation-note"
              placeholder="Optional note"
              rows={5}
              value={moderationDialog?.reason || ""}
              onChange={(event) =>
                setModerationDialog((current) =>
                  current
                    ? {
                        ...current,
                        reason: event.target.value,
                        validationError: null
                      }
                    : current
                )
              }
            />
            <div className="flex justify-between gap-3 text-xs">
              <span className="text-red-600">
                {moderationDialog?.validationError}
              </span>
              <span className="text-muted-foreground">
                {(moderationDialog?.reason || "").length}/500
              </span>
            </div>
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              disabled={moderationMutation.isPending}
              type="button"
              variant="outline"
              onClick={() => setModerationDialog(null)}
            >
              Cancel
            </Button>
            <Button
              disabled={moderationMutation.isPending}
              isLoading={moderationMutation.isPending}
              loadingLabel="Saving..."
              type="submit"
              variant={
                moderationDialog?.nextStatus === "HIDDEN"
                  ? "destructive"
                  : "default"
              }
            >
              {moderationDialog?.nextStatus === "PUBLISHED"
                ? "Publish review"
                : "Hide review"}
            </Button>
          </div>
        </form>
      </Modal>
      {isReadOnly || access?.isReadOnly ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This business is suspended. Reviews remain visible but moderation is
          read-only.
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Total
            </p>
            <p className="mt-2 text-2xl font-bold text-growth-sidebar">
              {summary?.total ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Pending
            </p>
            <p className="mt-2 text-2xl font-bold text-amber-700">
              {summary?.pending ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Published
            </p>
            <p className="mt-2 text-2xl font-bold text-growth-sidebar">
              {summary?.published ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Hidden
            </p>
            <p className="mt-2 text-2xl font-bold text-growth-sidebar">
              {summary?.hidden ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Public rating
            </p>
            <p className="mt-2 text-2xl font-bold text-growth-sidebar">
              {summary?.averagePublishedRating ?? "No rating"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Review moderation</CardTitle>
          <p className="text-sm text-muted-foreground">
            Customer reviews remain private until explicitly published.
          </p>
          <div className="grid gap-3 pt-3 lg:grid-cols-[1fr_auto_auto]">
            <Input
              placeholder="Search customer, service, title, or review..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
            <SelectField
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL" ? "All statuses" : option}
                </option>
              ))}
            </SelectField>
            <SelectField
              value={rating}
              onChange={(event) => {
                setRating(event.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All ratings</option>
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} stars
                </option>
              ))}
            </SelectField>
          </div>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <EmptyState
              title="No reviews found"
              description="Completed-booking reviews will appear here for moderation."
            />
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <article
                  className="rounded-2xl border border-growth-border bg-white p-5"
                  key={review.id}
                >
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <ReviewStars rating={review.rating} />
                        <Badge variant={statusVariant(review.status)}>
                          {review.status}
                        </Badge>
                        <Badge variant="outline">
                          {review.serviceNameSnapshot}
                        </Badge>
                      </div>
                      <div>
                        <h3 className="font-bold text-growth-sidebar">
                          {review.title || "Customer review"}
                        </h3>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                          {review.comment}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>{review.customerNameSnapshot}</span>
                        <span>{review.customer.email}</span>
                        <span>
                          Submitted{" "}
                          {formatDate(review.createdAt, businessTimezone)}
                        </span>
                        <Link
                          className="font-semibold text-primary hover:underline"
                          href={`/dashboard/customers/${review.customerId}`}
                        >
                          View customer
                        </Link>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {review.status !== "PUBLISHED" ? (
                        <Button
                          disabled={!canModerate}
                          size="sm"
                          onClick={() => moderate(review, "PUBLISHED")}
                        >
                          Publish
                        </Button>
                      ) : null}
                      {review.status !== "HIDDEN" ? (
                        <Button
                          disabled={!canModerate}
                          size="sm"
                          variant="outline"
                          onClick={() => moderate(review, "HIDDEN")}
                        >
                          Hide
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {pagination && pagination.totalItems > 0 ? (
            <div className="mt-5 flex flex-col justify-between gap-3 border-t border-growth-border pt-4 sm:flex-row sm:items-center">
              <p className="text-sm text-muted-foreground">
                Showing {reviews.length} of {pagination.totalItems}. Page{" "}
                {pagination.page} of {pagination.totalPages}.
              </p>
              <div className="flex gap-2">
                <Button
                  disabled={
                    !pagination.hasPreviousPage || reviewsQuery.isFetching
                  }
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setPage((currentPage) => Math.max(currentPage - 1, 1))
                  }
                >
                  Previous
                </Button>
                <Button
                  disabled={
                    !pagination.hasNextPage || reviewsQuery.isFetching
                  }
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
