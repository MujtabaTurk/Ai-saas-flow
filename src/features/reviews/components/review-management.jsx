"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
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
  const [status, setStatus] = useState("ALL");
  const [rating, setRating] = useState("ALL");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState(null);
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
  const reviews = reviewsQuery.data?.reviews || [];
  const summary = reviewsQuery.data?.summary;
  const access = reviewsQuery.data?.access;
  const pagination = reviewsQuery.data?.pagination;
  const canModerate =
    !isReadOnly &&
    access?.canModerate === true &&
    !moderationMutation.isPending;

  async function moderate(review, nextStatus) {
    const reason = window.prompt(
      nextStatus === "PUBLISHED"
        ? "Optional publication note:"
        : "Optional reason for hiding this review:",
      ""
    );

    if (reason === null) {
      return;
    }

    try {
      const result = await moderationMutation.mutateAsync({
        reviewId: review.id,
        status: nextStatus,
        reason: reason || null
      });
      setMessage(result.message);
    } catch {
      setMessage(null);
    }
  }

  if (reviewsQuery.isLoading) {
    return (
      <LoadingState
        title="Loading reviews"
        description="Collecting customer feedback and moderation status..."
      />
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
      {message ? (
        <div className="rounded-2xl border border-growth-border bg-growth-mint/40 px-4 py-3 text-sm text-growth-sidebar">
          {message}
        </div>
      ) : null}
      {moderationMutation.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {moderationMutation.error.message}
        </div>
      ) : null}
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
