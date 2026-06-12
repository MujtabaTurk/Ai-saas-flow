"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import {
  AdminPagination,
  formatAdminDate,
  humanizeAdminValue
} from "@/features/admin/components/admin-shared";
import { useAdminActivity } from "@/features/admin/hooks/use-admin";

export function ActivityManagement() {
  const [page, setPage] = useState(1);
  const filters = useMemo(
    () => ({
      page,
      pageSize: 25
    }),
    [page]
  );
  const activityQuery = useAdminActivity(filters);
  const activity = activityQuery.data?.activity || [];
  const pagination = activityQuery.data?.pagination;

  if (activityQuery.isLoading) {
    return (
      <LoadingState
        title="Loading activity"
        description="Reading sensitive operator actions..."
      />
    );
  }

  if (activityQuery.isError) {
    return (
      <ErrorState
        description={activityQuery.error.message}
        onAction={() => activityQuery.refetch()}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Administrative audit trail</CardTitle>
        <p className="text-sm text-muted-foreground">
          Tenant restrictions and platform-role changes are immutable operator
          records.
        </p>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <EmptyState
            title="No administrative activity yet"
            description="Sensitive operator actions will appear here."
          />
        ) : (
          <div className="space-y-3">
            {activity.map((entry) => (
              <article
                className="rounded-2xl border border-growth-border bg-white p-4"
                key={entry.id}
              >
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-growth-sidebar">
                        {humanizeAdminValue(entry.action)}
                      </p>
                      <Badge variant="outline">{entry.targetType}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Actor: {entry.actor.email || entry.actor.name || entry.actor.id}
                    </p>
                    {entry.business ? (
                      <p className="text-sm text-muted-foreground">
                        Business: {entry.business.name} /{entry.business.slug}
                      </p>
                    ) : null}
                    {entry.reason ? (
                      <p className="mt-2 text-sm text-growth-sidebar">
                        Reason: {entry.reason}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatAdminDate(entry.createdAt, true)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}

        <AdminPagination
          isFetching={activityQuery.isFetching}
          itemCount={activity.length}
          onPageChange={setPage}
          pagination={pagination}
        />
      </CardContent>
    </Card>
  );
}
