"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBillingPortalSession,
  createCheckoutSession,
  fetchBillingState,
  reconcileCheckoutSession
} from "@/features/billing/api";

export const billingQueryKeys = {
  all: ["billing"],
  state: () => [...billingQueryKeys.all, "state"]
};

export function useBillingState() {
  return useQuery({
    queryKey: billingQueryKeys.state(),
    queryFn: fetchBillingState
  });
}

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: createCheckoutSession
  });
}

const PLAN_SENSITIVE_QUERY_ROOTS = [
  ["billing"],
  ["services"],
  ["bookings"],
  ["availability"],
  ["team"],
  ["analytics"],
  ["ai"]
];

export function useReconcileCheckoutSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reconcileCheckoutSession,
    onSuccess: async () => {
      await Promise.all(
        PLAN_SENSITIVE_QUERY_ROOTS.map((queryKey) =>
          queryClient.invalidateQueries({
            queryKey
          })
        )
      );
    }
  });
}

export function useCreateBillingPortalSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBillingPortalSession,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: billingQueryKeys.state()
      })
  });
}
