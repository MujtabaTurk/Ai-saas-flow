"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotifications,
  markAllNotificationsRead,
  retryEmailNotification,
  updateNotificationReadState
} from "@/features/notifications/api";
import { notificationQueryKeys } from "@/features/notifications/query-keys";

export function useNotifications(businessId, filters) {
  return useQuery({
    queryKey: notificationQueryKeys.list(businessId, filters),
    queryFn: () => fetchNotifications(businessId, filters)
  });
}

function useInvalidateNotifications(businessId) {
  const queryClient = useQueryClient();

  return () =>
    queryClient.invalidateQueries({
      queryKey: notificationQueryKeys.listRoot(businessId)
    });
}

export function useUpdateNotificationReadState(businessId) {
  const invalidateNotifications = useInvalidateNotifications(businessId);

  return useMutation({
    mutationFn: ({ notificationId, isRead }) =>
      updateNotificationReadState({
        businessId,
        notificationId,
        isRead
      }),
    onSuccess: invalidateNotifications
  });
}

export function useMarkAllNotificationsRead(businessId) {
  const invalidateNotifications = useInvalidateNotifications(businessId);

  return useMutation({
    mutationFn: () => markAllNotificationsRead(businessId),
    onSuccess: invalidateNotifications
  });
}

export function useRetryEmailNotification(businessId) {
  const invalidateNotifications = useInvalidateNotifications(businessId);

  return useMutation({
    mutationFn: (notificationId) =>
      retryEmailNotification({
        businessId,
        notificationId
      }),
    onSuccess: invalidateNotifications
  });
}
