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
    queryFn: fetchServices
  });
}

export function useCreateService(businessId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: serviceQueryKeys.list(businessId) })
  });
}

export function useUpdateService(businessId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serviceId, values }) => updateService(serviceId, values),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: serviceQueryKeys.list(businessId) });
      queryClient.invalidateQueries({ queryKey: serviceQueryKeys.detail(variables.serviceId) });
    }
  });
}

export function useDeleteService(businessId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: serviceQueryKeys.list(businessId) })
  });
}

export function useUpdateServiceStatus(businessId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serviceId, isActive }) => updateServiceStatus(serviceId, isActive),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: serviceQueryKeys.list(businessId) });
      queryClient.invalidateQueries({ queryKey: serviceQueryKeys.detail(variables.serviceId) });
    }
  });
}

