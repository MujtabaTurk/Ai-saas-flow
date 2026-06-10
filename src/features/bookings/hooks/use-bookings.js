"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelPublicBooking,
  createPublicBooking,
  fetchBookingSettings,
  fetchBookings,
  fetchPublicBooking,
  fetchPublicSlots,
  updateBookingSettings,
  updateBookingStatus
} from "@/features/bookings/api";
import { bookingQueryKeys } from "@/features/bookings/query-keys";

export function useBookings(businessId, filters) {
  return useQuery({
    queryKey: bookingQueryKeys.list(businessId, filters),
    queryFn: () => fetchBookings(filters)
  });
}

export function useUpdateBookingStatus(businessId, filters) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, values }) => updateBookingStatus(bookingId, values),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: bookingQueryKeys.list(businessId, filters)
      })
  });
}

export function useBookingSettings(businessId) {
  return useQuery({
    queryKey: bookingQueryKeys.settings(businessId),
    queryFn: fetchBookingSettings
  });
}

export function useUpdateBookingSettings(businessId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBookingSettings,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: bookingQueryKeys.settings(businessId)
      })
  });
}

export function usePublicSlots(businessSlug, serviceId, date) {
  return useQuery({
    queryKey: bookingQueryKeys.publicSlots(businessSlug, serviceId, date),
    queryFn: () => fetchPublicSlots(businessSlug, serviceId, date),
    enabled: Boolean(businessSlug && serviceId && date)
  });
}

export function useCreatePublicBooking(businessSlug) {
  return useMutation({
    mutationFn: (values) => createPublicBooking(businessSlug, values)
  });
}

export function usePublicBooking(businessSlug, bookingNumber, token) {
  return useQuery({
    queryKey: bookingQueryKeys.publicBooking(businessSlug, bookingNumber, token),
    queryFn: () => fetchPublicBooking(businessSlug, bookingNumber, token),
    enabled: Boolean(businessSlug && bookingNumber && token)
  });
}

export function useCancelPublicBooking(businessSlug, bookingNumber, token) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason) =>
      cancelPublicBooking(businessSlug, bookingNumber, {
        token,
        reason
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: bookingQueryKeys.publicBooking(businessSlug, bookingNumber, token)
      })
  });
}

