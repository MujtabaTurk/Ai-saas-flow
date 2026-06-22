"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelCustomerMembership,
  createMembershipPlan,
  createPublicMembershipCheckout,
  createPublicMembership,
  deleteMembershipPlan,
  fetchBusinessMemberships,
  fetchCustomerMemberships,
  fetchMembershipAnalytics,
  fetchMembershipPlans,
  reconcilePublicMembershipCheckout,
  renewCustomerMembership,
  updateMembershipPlan
} from "@/features/memberships/api";
import { membershipQueryKeys } from "@/features/memberships/query-keys";

export function useMembershipPlans(businessId) {
  return useQuery({
    queryKey: membershipQueryKeys.plans(businessId),
    queryFn: () => fetchMembershipPlans(businessId)
  });
}

export function useCreateMembershipPlan(businessId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values) => createMembershipPlan({ businessId, values }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membershipQueryKeys.plans(businessId) });
      queryClient.invalidateQueries({ queryKey: membershipQueryKeys.analytics(businessId) });
    }
  });
}

export function useUpdateMembershipPlan(businessId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, values }) =>
      updateMembershipPlan({ businessId, planId, values }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membershipQueryKeys.plans(businessId) });
      queryClient.invalidateQueries({ queryKey: membershipQueryKeys.analytics(businessId) });
    }
  });
}

export function useDeleteMembershipPlan(businessId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId) => deleteMembershipPlan({ businessId, planId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membershipQueryKeys.plans(businessId) });
      queryClient.invalidateQueries({ queryKey: membershipQueryKeys.analytics(businessId) });
    }
  });
}

export function useBusinessMemberships(businessId, filters) {
  return useQuery({
    queryKey: membershipQueryKeys.members(businessId, filters),
    queryFn: () => fetchBusinessMemberships(businessId, filters)
  });
}

export function useMembershipAnalytics(businessId) {
  return useQuery({
    queryKey: membershipQueryKeys.analytics(businessId),
    queryFn: () => fetchMembershipAnalytics(businessId)
  });
}

export function useCustomerMemberships() {
  return useQuery({
    queryKey: membershipQueryKeys.customer(),
    queryFn: fetchCustomerMemberships
  });
}

export function useRenewCustomerMembership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ membershipId, values }) =>
      renewCustomerMembership({ membershipId, values }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membershipQueryKeys.customer() });
    }
  });
}

export function useCancelCustomerMembership() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ membershipId, values }) =>
      cancelCustomerMembership({ membershipId, values }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membershipQueryKeys.customer() });
    }
  });
}

export function useCreatePublicMembership(businessSlug) {
  return useMutation({
    mutationFn: (values) => createPublicMembership({ businessSlug, values })
  });
}

export function useCreatePublicMembershipCheckout(businessSlug) {
  return useMutation({
    mutationFn: (values) =>
      createPublicMembershipCheckout({ businessSlug, values })
  });
}

export function useReconcilePublicMembershipCheckout(businessSlug) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId) =>
      reconcilePublicMembershipCheckout({ businessSlug, sessionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membershipQueryKeys.customer() });
    }
  });
}
