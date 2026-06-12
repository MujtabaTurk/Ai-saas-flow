"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAvailability,
  createUnavailableDate,
  deleteAvailability,
  deleteUnavailableDate,
  fetchAvailability,
  fetchUnavailableDates,
  updateAvailability,
  updateAvailabilityStatus,
  updateUnavailableDate
} from "@/features/availability/api";
import { availabilityQueryKeys } from "@/features/availability/query-keys";

export function useAvailability(businessId) {
  return useQuery({
    queryKey: availabilityQueryKeys.weekly(businessId),
    queryFn: () => fetchAvailability(businessId)
  });
}

export function useCreateAvailability(businessId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values) => createAvailability({ businessId, values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: availabilityQueryKeys.weekly(businessId) })
  });
}

export function useUpdateAvailability(businessId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ availabilityId, values }) =>
      updateAvailability({ businessId, availabilityId, values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: availabilityQueryKeys.weekly(businessId) })
  });
}

export function useDeleteAvailability(businessId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (availabilityId) =>
      deleteAvailability({ businessId, availabilityId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: availabilityQueryKeys.weekly(businessId) })
  });
}

export function useUpdateAvailabilityStatus(businessId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ availabilityId, isActive }) =>
      updateAvailabilityStatus({ businessId, availabilityId, isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: availabilityQueryKeys.weekly(businessId) })
  });
}

export function useUnavailableDates(businessId) {
  return useQuery({
    queryKey: availabilityQueryKeys.unavailableDates(businessId),
    queryFn: () => fetchUnavailableDates(businessId)
  });
}

export function useCreateUnavailableDate(businessId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values) => createUnavailableDate({ businessId, values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: availabilityQueryKeys.unavailableDates(businessId) })
  });
}

export function useUpdateUnavailableDate(businessId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ unavailableDateId, values }) =>
      updateUnavailableDate({ businessId, unavailableDateId, values }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: availabilityQueryKeys.unavailableDates(businessId) })
  });
}

export function useDeleteUnavailableDate(businessId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (unavailableDateId) =>
      deleteUnavailableDate({ businessId, unavailableDateId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: availabilityQueryKeys.unavailableDates(businessId) })
  });
}
