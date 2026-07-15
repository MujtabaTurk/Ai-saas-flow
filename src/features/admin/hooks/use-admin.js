"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminActivity,
  fetchAdminBusinesses,
  fetchAdminPlans,
  fetchAdminSubscriptions,
  createAdminPlan,
  deleteAdminPlan,
  updateAdminPlan,
  updateAdminBusinessStatus
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

export function useAdminPlanMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: adminQueryKeys.plans() });
  return {
    create: useMutation({ mutationFn: createAdminPlan, onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ planId, input }) => updateAdminPlan(planId, input), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: deleteAdminPlan, onSuccess: invalidate })
  };
}

export function useAdminActivity(filters) {
  return useQuery({
    queryKey: adminQueryKeys.activity(filters),
    queryFn: () => fetchAdminActivity(filters)
  });
}
