"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptTeamInvitation,
  fetchTeam,
  fetchTeamInvitation,
  inviteTeamMember,
  removeTeamMember,
  revokeTeamInvitation,
  updateTeamMemberAvailability,
  updateTeamMemberRole,
  updateTeamMemberServices
} from "@/features/team/api";
import { teamQueryKeys } from "@/features/team/query-keys";

function useTeamMutation(businessId, mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: teamQueryKeys.detail(businessId)
      });
      queryClient.invalidateQueries({
        queryKey: ["bookings"]
      });
    }
  });
}

export function useTeam(businessId) {
  return useQuery({
    queryKey: teamQueryKeys.detail(businessId),
    queryFn: () => fetchTeam(businessId),
    enabled: Boolean(businessId)
  });
}

export function useInviteTeamMember(businessId) {
  return useTeamMutation(businessId, (values) =>
    inviteTeamMember({ businessId, values })
  );
}

export function useRevokeTeamInvitation(businessId) {
  return useTeamMutation(businessId, (invitationId) =>
    revokeTeamInvitation({ businessId, invitationId })
  );
}

export function useUpdateTeamMemberRole(businessId) {
  return useTeamMutation(businessId, ({ membershipId, role }) =>
    updateTeamMemberRole({ businessId, membershipId, role })
  );
}

export function useRemoveTeamMember(businessId) {
  return useTeamMutation(businessId, (membershipId) =>
    removeTeamMember({ businessId, membershipId })
  );
}

export function useUpdateTeamMemberServices(businessId) {
  return useTeamMutation(businessId, ({ membershipId, serviceIds }) =>
    updateTeamMemberServices({ businessId, membershipId, serviceIds })
  );
}

export function useUpdateTeamMemberAvailability(businessId) {
  return useTeamMutation(businessId, ({ membershipId, availability }) =>
    updateTeamMemberAvailability({
      businessId,
      membershipId,
      availability
    })
  );
}

export function useTeamInvitation(token) {
  return useQuery({
    queryKey: teamQueryKeys.invitation(token),
    queryFn: () => fetchTeamInvitation(token),
    enabled: Boolean(token),
    retry: false
  });
}

export function useAcceptTeamInvitation() {
  return useMutation({
    mutationFn: acceptTeamInvitation
  });
}
