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
    queryFn: fetchAvailability
  });
}

export function useCreateAvailability(businessId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAvailability,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: availabilityQueryKeys.weekly(businessId) })
  });
}

export function useUpdateAvailability(businessId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ availabilityId, values }) => updateAvailability(availabilityId, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: availabilityQueryKeys.weekly(businessId) })
  });
}

export function useDeleteAvailability(businessId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAvailability,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: availabilityQueryKeys.weekly(businessId) })
  });
}

export function useUpdateAvailabilityStatus(businessId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ availabilityId, isActive }) => updateAvailabilityStatus(availabilityId, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: availabilityQueryKeys.weekly(businessId) })
  });
}

export function useUnavailableDates(businessId) {
  return useQuery({
    queryKey: availabilityQueryKeys.unavailableDates(businessId),
    queryFn: fetchUnavailableDates
  });
}

export function useCreateUnavailableDate(businessId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUnavailableDate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: availabilityQueryKeys.unavailableDates(businessId) })
  });
}

export function useUpdateUnavailableDate(businessId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ unavailableDateId, values }) => updateUnavailableDate(unavailableDateId, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: availabilityQueryKeys.unavailableDates(businessId) })
  });
}

export function useDeleteUnavailableDate(businessId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUnavailableDate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: availabilityQueryKeys.unavailableDates(businessId) })
  });
}
