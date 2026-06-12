"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelPublicBooking,
  createDashboardBooking,
  createPublicBooking,
  fetchBookingSettings,
  fetchBookings,
  fetchDashboardSlots,
  fetchPublicBooking,
  fetchPublicSlots,
  updateBookingSettings,
  updateBookingAssignment,
  updateBookingNotes,
  updateBookingStatus
} from "@/features/bookings/api";
import { bookingQueryKeys } from "@/features/bookings/query-keys";

export function useBookings(businessId, filters) {
  return useQuery({
    queryKey: bookingQueryKeys.list(businessId, filters),
    queryFn: () => fetchBookings(businessId, filters)
  });
}

export function useCreateDashboardBooking(businessId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values) =>
      createDashboardBooking({
        businessId,
        values
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: bookingQueryKeys.listRoot(businessId)
      })
  });
}

export function useUpdateBookingStatus(businessId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, values }) =>
      updateBookingStatus({
        businessId,
        bookingId,
        values
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: bookingQueryKeys.listRoot(businessId)
      })
  });
}

export function useUpdateBookingNotes(businessId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, internalNotes }) =>
      updateBookingNotes({
        businessId,
        bookingId,
        internalNotes
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: bookingQueryKeys.listRoot(businessId)
      })
  });
}

export function useUpdateBookingAssignment(businessId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, membershipId }) =>
      updateBookingAssignment({
        businessId,
        bookingId,
        membershipId
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: bookingQueryKeys.listRoot(businessId)
      });
      queryClient.invalidateQueries({
        queryKey: ["team", businessId || "current"]
      });
    }
  });
}

export function useBookingSettings(businessId) {
  return useQuery({
    queryKey: bookingQueryKeys.settings(businessId),
    queryFn: () => fetchBookingSettings(businessId)
  });
}

export function useUpdateBookingSettings(businessId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values) =>
      updateBookingSettings({
        businessId,
        values
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: bookingQueryKeys.settings(businessId)
      })
  });
}

export function useDashboardSlots(businessId, serviceId, date) {
  return useQuery({
    queryKey: bookingQueryKeys.dashboardSlots(
      businessId,
      serviceId,
      date
    ),
    queryFn: () => fetchDashboardSlots(businessId, serviceId, date),
    enabled: Boolean(businessId && serviceId && date)
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
