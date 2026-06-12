"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminActivity,
  fetchAdminBusinesses,
  fetchAdminPlans,
  fetchAdminSubscriptions,
  fetchAdminUsers,
  updateAdminBusinessStatus,
  updateAdminUserRole
} from "@/features/admin/api";
import { adminQueryKeys } from "@/features/admin/query-keys";

export function useAdminBusinesses(filters) {
  return useQuery({
    queryKey: adminQueryKeys.businesses(filters),
    queryFn: () => fetchAdminBusinesses(filters)
  });
}

export function useUpdateAdminBusinessStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAdminBusinessStatus,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.businessesRoot()
      })
  });
}

export function useAdminUsers(filters) {
  return useQuery({
    queryKey: adminQueryKeys.users(filters),
    queryFn: () => fetchAdminUsers(filters)
  });
}

export function useUpdateAdminUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAdminUserRole,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: adminQueryKeys.usersRoot()
      })
  });
}

export function useAdminSubscriptions(filters) {
  return useQuery({
    queryKey: adminQueryKeys.subscriptions(filters),
    queryFn: () => fetchAdminSubscriptions(filters)
  });
}

export function useAdminPlans() {
  return useQuery({
    queryKey: adminQueryKeys.plans(),
    queryFn: fetchAdminPlans
  });
}

export function useAdminActivity(filters) {
  return useQuery({
    queryKey: adminQueryKeys.activity(filters),
    queryFn: () => fetchAdminActivity(filters)
  });
}
