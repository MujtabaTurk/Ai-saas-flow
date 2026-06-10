"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBillingPortalSession,
  createCheckoutSession,
  fetchBillingState
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

