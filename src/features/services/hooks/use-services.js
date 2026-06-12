"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createService,
  deleteService,
  fetchServices,
  updateService,
  updateServiceStatus
} from "@/features/services/api";
import { serviceQueryKeys } from "@/features/services/query-keys";

export function useServices(businessId) {
  return useQuery({
    queryKey: serviceQueryKeys.list(businessId),
    queryFn: () => fetchServices(businessId)
  });
}

export function useCreateService(businessId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values) => createService({ businessId, values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: serviceQueryKeys.list(businessId) })
  });
}

export function useUpdateService(businessId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serviceId, values }) =>
      updateService({ businessId, serviceId, values }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: serviceQueryKeys.list(businessId) });
      queryClient.invalidateQueries({ queryKey: serviceQueryKeys.detail(variables.serviceId) });
    }
  });
}

export function useDeleteService(businessId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serviceId) => deleteService({ businessId, serviceId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: serviceQueryKeys.list(businessId) })
  });
}

export function useUpdateServiceStatus(businessId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serviceId, isActive }) =>
      updateServiceStatus({ businessId, serviceId, isActive }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: serviceQueryKeys.list(businessId) });
      queryClient.invalidateQueries({ queryKey: serviceQueryKeys.detail(variables.serviceId) });
    }
  });
}
