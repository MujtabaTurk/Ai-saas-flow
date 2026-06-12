"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAnalytics } from "@/features/analytics/api";
import { analyticsQueryKeys } from "@/features/analytics/query-keys";

export function useAnalytics(businessId, days) {
  return useQuery({
    queryKey: analyticsQueryKeys.report(businessId, days),
    queryFn: () => fetchAnalytics(businessId, days),
    enabled: Boolean(businessId),
    staleTime: 5 * 60 * 1000
  });
}
