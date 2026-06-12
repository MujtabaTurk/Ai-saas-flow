import { PLAN_LIMITS } from "@/features/businesses/plan-limits";

export function getTeamMemberLimit(planCode) {
  return PLAN_LIMITS[planCode]?.teamMembers ?? 1;
}

export function getTeamSeatUsage({ activeMemberships, pendingInvitations }) {
  return 1 + activeMemberships + pendingInvitations;
}

export function hasTeamSeatCapacity({
  planCode,
  activeMemberships,
  pendingInvitations
}) {
  const limit = getTeamMemberLimit(planCode);
  return (
    limit === null ||
    getTeamSeatUsage({ activeMemberships, pendingInvitations }) < limit
  );
}
