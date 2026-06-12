async function parseResponse(response, fallbackMessage) {
  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload?.error?.message || fallbackMessage);
    error.details = payload?.error?.details || null;
    throw error;
  }

  return payload.data;
}

function withBusinessId(path, businessId) {
  if (!businessId) {
    return path;
  }

  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}businessId=${encodeURIComponent(businessId)}`;
}

export async function fetchTeam(businessId) {
  const response = await fetch(withBusinessId("/api/team", businessId));
  return parseResponse(response, "Could not load the team.");
}

export async function inviteTeamMember({ businessId, values }) {
  const response = await fetch(
    withBusinessId("/api/team/invitations", businessId),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(values)
    }
  );
  return parseResponse(response, "Could not send the invitation.");
}

export async function revokeTeamInvitation({ businessId, invitationId }) {
  const response = await fetch(
    withBusinessId(`/api/team/invitations/${invitationId}`, businessId),
    {
      method: "DELETE"
    }
  );
  return parseResponse(response, "Could not revoke the invitation.");
}

export async function updateTeamMemberRole({
  businessId,
  membershipId,
  role
}) {
  const response = await fetch(
    withBusinessId(`/api/team/members/${membershipId}`, businessId),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ role })
    }
  );
  return parseResponse(response, "Could not update the member role.");
}

export async function removeTeamMember({ businessId, membershipId }) {
  const response = await fetch(
    withBusinessId(`/api/team/members/${membershipId}`, businessId),
    {
      method: "DELETE"
    }
  );
  return parseResponse(response, "Could not remove the team member.");
}

export async function updateTeamMemberServices({
  businessId,
  membershipId,
  serviceIds
}) {
  const response = await fetch(
    withBusinessId(
      `/api/team/members/${membershipId}/services`,
      businessId
    ),
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ serviceIds })
    }
  );
  return parseResponse(response, "Could not update service assignments.");
}

export async function updateTeamMemberAvailability({
  businessId,
  membershipId,
  availability
}) {
  const response = await fetch(
    withBusinessId(
      `/api/team/members/${membershipId}/availability`,
      businessId
    ),
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ availability })
    }
  );
  return parseResponse(response, "Could not update working hours.");
}

export async function fetchTeamInvitation(token) {
  const params = new URLSearchParams({ token });
  const response = await fetch(
    `/api/team/invitations/accept?${params.toString()}`
  );
  return parseResponse(response, "Could not load the invitation.");
}

export async function acceptTeamInvitation(token) {
  const response = await fetch("/api/team/invitations/accept", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ token })
  });
  return parseResponse(response, "Could not accept the invitation.");
}
