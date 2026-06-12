"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  applyAiGeneration,
  fetchAiWorkspace,
  generateAiContent,
  reviewAiGeneration
} from "@/features/ai/api";
import { aiQueryKeys } from "@/features/ai/query-keys";
import { serviceQueryKeys } from "@/features/services/query-keys";

function replaceGeneration(workspace, generation) {
  if (!workspace || !generation) {
    return workspace;
  }

  const exists = workspace.generations.some(
    (item) => item.id === generation.id
  );

  return {
    ...workspace,
    generations: exists
      ? workspace.generations.map((item) =>
          item.id === generation.id ? generation : item
        )
      : [generation, ...workspace.generations]
  };
}

export function useAiWorkspace(businessId) {
  return useQuery({
    queryKey: aiQueryKeys.workspace(businessId),
    queryFn: () => fetchAiWorkspace(businessId),
    enabled: Boolean(businessId)
  });
}

export function useGenerateAiContent(businessId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values) => generateAiContent({ businessId, values }),
    onSuccess: (result) => {
      queryClient.setQueryData(
        aiQueryKeys.workspace(businessId),
        (workspace) => ({
          ...replaceGeneration(workspace, result.generation),
          usage: result.usage
        })
      );
    }
  });
}

export function useReviewAiGeneration(businessId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ generationId, approvalStatus }) =>
      reviewAiGeneration({
        businessId,
        generationId,
        approvalStatus
      }),
    onSuccess: (result) => {
      queryClient.setQueryData(
        aiQueryKeys.workspace(businessId),
        (workspace) => replaceGeneration(workspace, result.generation)
      );
    }
  });
}

export function useApplyAiGeneration(businessId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (generationId) =>
      applyAiGeneration({ businessId, generationId }),
    onSuccess: (result) => {
      queryClient.setQueryData(
        aiQueryKeys.workspace(businessId),
        (workspace) => replaceGeneration(workspace, result.generation)
      );
      queryClient.invalidateQueries({
        queryKey: serviceQueryKeys.list(businessId)
      });
    }
  });
}
