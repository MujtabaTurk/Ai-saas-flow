"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import {
  AdminPagination,
  AdminSelect,
  AdminSummaryCard,
  formatAdminDate,
  humanizeAdminValue
} from "@/features/admin/components/admin-shared";
import {
  useAdminUsers,
  useUpdateAdminUserRole
} from "@/features/admin/hooks/use-admin";

export function UserManagement() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [platformRole, setPlatformRole] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pendingRoles, setPendingRoles] = useState({});
  const [message, setMessage] = useState(null);
  const filters = useMemo(
    () => ({
      search: deferredSearch,
      platformRole,
      page,
      pageSize: 25
    }),
    [deferredSearch, page, platformRole]
  );
  const usersQuery = useAdminUsers(filters);
  const updateMutation = useUpdateAdminUserRole();
  const users = usersQuery.data?.users || [];
  const summary = usersQuery.data?.summary;
  const pagination = usersQuery.data?.pagination;

  async function applyRole(user) {
    const nextRole = pendingRoles[user.id] || user.platformRole;

    if (nextRole === user.platformRole || user.isCurrentUser) {
      return;
    }

    const reason = window.prompt(
      `Why should ${user.email || user.name || "this user"} become ${humanizeAdminValue(nextRole)}?`
    );

    if (reason === null) {
      return;
    }

    if (reason.trim().length < 3) {
      setMessage("Provide a short reason before changing a platform role.");
      return;
    }

    try {
      const result = await updateMutation.mutateAsync({
        userId: user.id,
        platformRole: nextRole,
        reason: reason.trim()
      });
      setMessage(result.message);
      setPendingRoles((current) => {
        const next = { ...current };
        delete next[user.id];
        return next;
      });
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (usersQuery.isLoading) {
    return (
      <LoadingState
        title="Loading users"
        description="Preparing platform identities..."
      />
    );
  }

  if (usersQuery.isError) {
    return (
      <ErrorState
        description={usersQuery.error.message}
        onAction={() => usersQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-5">
      {message ? (
        <div className="rounded-2xl border border-growth-border bg-growth-mint/30 px-4 py-3 text-sm text-growth-sidebar">
          {message}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-5">
        <AdminSummaryCard label="Total users" value={summary?.total ?? 0} />
        <AdminSummaryCard label="Standard users" value={summary?.users ?? 0} />
        <AdminSummaryCard label="Admins" value={summary?.admins ?? 0} />
        <AdminSummaryCard
          label="Super admins"
          value={summary?.superAdmins ?? 0}
        />
        <AdminSummaryCard label="Active sessions" value={summary?.activeUsers ?? 0} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User directory</CardTitle>
          <p className="text-sm text-muted-foreground">
            Platform roles are separate from business ownership. Your own role
            and the final super-admin account are protected.
          </p>
          <div className="grid gap-3 pt-3 md:grid-cols-[1fr_auto]">
            <Input
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search name or email..."
              value={search}
            />
            <AdminSelect
              onChange={(event) => {
                setPlatformRole(event.target.value);
                setPage(1);
              }}
              value={platformRole}
            >
              <option value="ALL">All roles</option>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super admin</option>
            </AdminSelect>
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <EmptyState
              title="No users found"
              description="No account matches the current filters."
            />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-growth-border">
              <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
                <thead className="bg-growth-mint/50 text-growth-sidebar">
                  <tr>
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Business context</th>
                    <th className="px-4 py-3 font-semibold">Activity</th>
                    <th className="px-4 py-3 font-semibold">Joined</th>
                    <th className="px-4 py-3 font-semibold">Platform role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-growth-border bg-white">
                  {users.map((user) => (
                    <tr className="hover:bg-growth-mint/20" key={user.id}>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-growth-sidebar">
                            {user.name || "Unnamed user"}
                          </p>
                          {user.isCurrentUser ? <Badge>You</Badge> : null}
                          {user.hasActiveSession ? (
                            <Badge variant="success">Active</Badge>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {user.email || "No email"}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {user.ownedBusinesses.length > 0 ? (
                          user.ownedBusinesses.map((business) => (
                            <p key={business.id}>
                              {business.name}{" "}
                              <span className="text-xs">({business.status})</span>
                            </p>
                          ))
                        ) : (
                          <p>No active business</p>
                        )}
                        <p className="mt-1 text-xs">
                          {user._count.customerProfiles} customer profiles
                        </p>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {user._count.createdBookings} bookings created
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {formatAdminDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <AdminSelect
                            className="min-w-40"
                            disabled={user.isCurrentUser}
                            onChange={(event) =>
                              setPendingRoles((current) => ({
                                ...current,
                                [user.id]: event.target.value
                              }))
                            }
                            value={
                              pendingRoles[user.id] || user.platformRole
                            }
                          >
                            <option value="USER">User</option>
                            <option value="ADMIN">Admin</option>
                            <option value="SUPER_ADMIN">Super admin</option>
                          </AdminSelect>
                          <Button
                            disabled={
                              user.isCurrentUser ||
                              updateMutation.isPending ||
                              (pendingRoles[user.id] || user.platformRole) ===
                                user.platformRole
                            }
                            onClick={() => applyRole(user)}
                            size="sm"
                          >
                            Save
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <AdminPagination
            isFetching={usersQuery.isFetching}
            itemCount={users.length}
            onPageChange={setPage}
            pagination={pagination}
          />
        </CardContent>
      </Card>
    </div>
  );
}
