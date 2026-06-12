"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCustomer,
  deleteCustomer,
  fetchCustomer,
  fetchCustomers,
  updateCustomer
} from "@/features/customers/api";
import { customerQueryKeys } from "@/features/customers/query-keys";

export function useCustomers(businessId, filters) {
  return useQuery({
    queryKey: customerQueryKeys.list(businessId, filters),
    queryFn: () => fetchCustomers(businessId, filters)
  });
}

export function useCreateCustomer(businessId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values) =>
      createCustomer({
        businessId,
        values
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: customerQueryKeys.listRoot(businessId)
      })
  });
}

export function useCustomer(businessId, customerId, page = 1) {
  return useQuery({
    queryKey: customerQueryKeys.detail(businessId, customerId, page),
    queryFn: () =>
      fetchCustomer({
        businessId,
        customerId,
        page
      }),
    enabled: Boolean(businessId && customerId)
  });
}

export function useUpdateCustomer(businessId, customerId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values) =>
      updateCustomer({
        businessId,
        customerId,
        values
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: customerQueryKeys.listRoot(businessId)
      });
      queryClient.invalidateQueries({
        queryKey: customerQueryKeys.detailRoot(businessId, customerId)
      });
    }
  });
}

export function useDeleteCustomer(businessId, customerId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      deleteCustomer({
        businessId,
        customerId
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: customerQueryKeys.listRoot(businessId)
      });
      queryClient.removeQueries({
        queryKey: customerQueryKeys.detailRoot(businessId, customerId)
      });
    }
  });
}
