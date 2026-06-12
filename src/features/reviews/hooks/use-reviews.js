"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchPublicBookingReview,
  fetchReviews,
  moderateReview,
  submitPublicBookingReview
} from "@/features/reviews/api";
import { reviewQueryKeys } from "@/features/reviews/query-keys";

export function useReviews(businessId, filters) {
  return useQuery({
    queryKey: reviewQueryKeys.list(businessId, filters),
    queryFn: () => fetchReviews(businessId, filters),
    enabled: Boolean(businessId)
  });
}

export function useModerateReview(businessId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, status, reason }) =>
      moderateReview({
        businessId,
        reviewId,
        status,
        reason
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: reviewQueryKeys.listRoot(businessId)
      })
  });
}

export function usePublicBookingReview(
  businessSlug,
  bookingNumber,
  token
) {
  return useQuery({
    queryKey: reviewQueryKeys.publicBooking(
      businessSlug,
      bookingNumber,
      token
    ),
    queryFn: () =>
      fetchPublicBookingReview(businessSlug, bookingNumber, token),
    enabled: Boolean(businessSlug && bookingNumber && token),
    retry: false
  });
}

export function useSubmitPublicBookingReview(
  businessSlug,
  bookingNumber,
  token
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values) =>
      submitPublicBookingReview({
        businessSlug,
        bookingNumber,
        values: {
          ...values,
          token
        }
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: reviewQueryKeys.publicBooking(
          businessSlug,
          bookingNumber,
          token
        )
      })
  });
}
