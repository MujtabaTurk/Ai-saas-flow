"use client";

import { Bell, CheckCheck, Mail, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import {
  useMarkAllNotificationsRead,
  useNotifications,
  useRetryEmailNotification,
  useUpdateNotificationReadState
} from "@/features/notifications/hooks/use-notifications";

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

function formatDateTime(value, timezone) {
  if (!value) {
    return "Not attempted";
  }

  return new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function statusVariant(status) {
  if (status === "SENT") {
    return "success";
  }

  if (status === "PENDING" || status === "SKIPPED") {
    return "warning";
  }

  if (status === "FAILED") {
    return "destructive";
  }

  return "outline";
}

function label(value) {
  return value.toLowerCase().replaceAll("_", " ");
}

export function NotificationManagement({ businessId, businessTimezone }) {
  const [channel, setChannel] = useState("ALL");
  const [audience, setAudience] = useState("ALL");
  const [deliveryStatus, setDeliveryStatus] = useState("ALL");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const filters = useMemo(
    () => ({
      channel,
      audience,
      deliveryStatus,
      unreadOnly,
      page,
      pageSize: 25
    }),
    [audience, channel, deliveryStatus, page, unreadOnly]
  );
  const notificationsQuery = useNotifications(businessId, filters);
  const readMutation = useUpdateNotificationReadState(businessId);
  const readAllMutation = useMarkAllNotificationsRead(businessId);
  const retryMutation = useRetryEmailNotification(businessId);
  const notifications = notificationsQuery.data?.notifications || [];
  const summary = notificationsQuery.data?.summary;
  const pagination = notificationsQuery.data?.pagination;
  const email = notificationsQuery.data?.email;
  const mutationError =
    readMutation.error || readAllMutation.error || retryMutation.error;

  function resetPage(action) {
    action();
    setPage(1);
  }

  if (notificationsQuery.isLoading) {
    return (
      <LoadingState
        title="Loading notifications"
        description="Collecting booking and billing activity..."
      />
    );
  }

  if (notificationsQuery.isError) {
    return (
      <ErrorState
        description={notificationsQuery.error.message}
        onAction={() => notificationsQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-5">
      {email && !email.configured ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Email delivery is not configured. Add `RESEND_API_KEY` and
          `NOTIFICATION_EMAIL_FROM`; email records remain retryable in the
          meantime.
        </div>
      ) : null}

      {mutationError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {mutationError.message}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Total events
            </p>
            <p className="mt-2 text-2xl font-bold text-growth-sidebar">
              {summary?.total ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Unread alerts
            </p>
            <p className="mt-2 text-2xl font-bold text-growth-sidebar">
              {summary?.unread ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Failed emails
            </p>
            <p className="mt-2 text-2xl font-bold text-red-700">
              {summary?.emailFailed ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Pending emails
            </p>
            <p className="mt-2 text-2xl font-bold text-amber-700">
              {summary?.emailPending ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <CardTitle>Notification center</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Track in-app activity and transactional email delivery.
              </p>
            </div>
            <Button
              disabled={
                !summary?.unread ||
                readAllMutation.isPending ||
                notificationsQuery.isFetching
              }
              onClick={() => readAllMutation.mutate()}
              variant="outline"
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          </div>

          <div className="grid gap-3 pt-3 md:grid-cols-2 xl:grid-cols-4">
            <SelectField
              value={channel}
              onChange={(event) =>
                resetPage(() => setChannel(event.target.value))
              }
            >
              <option value="ALL">All channels</option>
              <option value="IN_APP">In-app</option>
              <option value="EMAIL">Email</option>
            </SelectField>
            <SelectField
              value={audience}
              onChange={(event) =>
                resetPage(() => setAudience(event.target.value))
              }
            >
              <option value="ALL">All audiences</option>
              <option value="BUSINESS">Business</option>
              <option value="CUSTOMER">Customer</option>
            </SelectField>
            <SelectField
              value={deliveryStatus}
              onChange={(event) =>
                resetPage(() => setDeliveryStatus(event.target.value))
              }
            >
              <option value="ALL">All delivery states</option>
              <option value="SENT">Sent</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="SKIPPED">Skipped</option>
            </SelectField>
            <label className="flex h-11 items-center gap-3 rounded-2xl border border-input bg-white px-4 text-sm shadow-sm">
              <input
                checked={unreadOnly}
                className="h-4 w-4 accent-emerald-500"
                onChange={(event) =>
                  resetPage(() => setUnreadOnly(event.target.checked))
                }
                type="checkbox"
              />
              Unread business alerts
            </label>
          </div>
        </CardHeader>

        <CardContent>
          {notifications.length === 0 ? (
            <EmptyState
              title="No notifications found"
              description="Booking and billing events will appear here as the platform processes them."
            />
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const isUnread =
                  notification.channel === "IN_APP" &&
                  notification.audience === "BUSINESS" &&
                  !notification.readAt;
                const canRetry =
                  notification.channel === "EMAIL" &&
                  ["FAILED", "SKIPPED"].includes(
                    notification.deliveryStatus
                  );

                return (
                  <article
                    className={`rounded-2xl border p-4 ${
                      isUnread
                        ? "border-primary bg-growth-mint/20"
                        : "border-growth-border bg-white"
                    }`}
                    key={notification.id}
                  >
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      <div className="flex min-w-0 gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-growth-mint text-growth-sidebar">
                          {notification.channel === "EMAIL" ? (
                            <Mail className="h-5 w-5" />
                          ) : (
                            <Bell className="h-5 w-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-growth-sidebar">
                              {notification.title}
                            </h3>
                            {isUnread ? <Badge>Unread</Badge> : null}
                            <Badge variant="outline">
                              {label(notification.channel)}
                            </Badge>
                            <Badge variant="outline">
                              {label(notification.audience)}
                            </Badge>
                            <Badge
                              variant={statusVariant(
                                notification.deliveryStatus
                              )}
                            >
                              {label(notification.deliveryStatus)}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>
                              Created{" "}
                              {formatDateTime(
                                notification.createdAt,
                                businessTimezone
                              )}
                            </span>
                            {notification.recipientEmail ? (
                              <span>To {notification.recipientEmail}</span>
                            ) : null}
                            {notification.attempts ? (
                              <span>
                                {notification.attempts} delivery attempt
                                {notification.attempts === 1 ? "" : "s"}
                              </span>
                            ) : null}
                          </div>
                          {notification.lastError ? (
                            <p className="mt-2 text-xs text-red-700">
                              {notification.lastError}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        {notification.actionUrl ? (
                          <Button asChild size="sm" variant="outline">
                            <a href={notification.actionUrl}>Open</a>
                          </Button>
                        ) : null}
                        {notification.channel === "IN_APP" &&
                        notification.audience === "BUSINESS" ? (
                          <Button
                            disabled={readMutation.isPending}
                            onClick={() =>
                              readMutation.mutate({
                                notificationId: notification.id,
                                isRead: isUnread
                              })
                            }
                            size="sm"
                            variant="ghost"
                          >
                            Mark {isUnread ? "read" : "unread"}
                          </Button>
                        ) : null}
                        {canRetry ? (
                          <Button
                            disabled={retryMutation.isPending}
                            onClick={() =>
                              retryMutation.mutate(notification.id)
                            }
                            size="sm"
                            variant="outline"
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Retry
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {pagination && pagination.totalItems > 0 ? (
            <div className="mt-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-sm text-muted-foreground">
                Showing {notifications.length} of {pagination.totalItems}. Page{" "}
                {pagination.page} of {pagination.totalPages}.
              </p>
              <div className="flex gap-2">
                <Button
                  disabled={
                    !pagination.hasPreviousPage ||
                    notificationsQuery.isFetching
                  }
                  onClick={() =>
                    setPage((currentPage) => Math.max(currentPage - 1, 1))
                  }
                  size="sm"
                  variant="outline"
                >
                  Previous
                </Button>
                <Button
                  disabled={
                    !pagination.hasNextPage || notificationsQuery.isFetching
                  }
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                  size="sm"
                  variant="outline"
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
