async function parseResponse(response, fallbackMessage) {
  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload?.error?.message || fallbackMessage);
    error.details = payload?.error?.details || null;
    throw error;
  }

  return payload.data;
}

function buildQuery(filters = {}) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      value !== "ALL"
    ) {
      params.set(key, String(value));
    }
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function fetchAdminBusinesses(filters) {
  const response = await fetch(
    `/api/admin/businesses${buildQuery(filters)}`
  );
  return parseResponse(response, "Could not load businesses.");
}

export async function updateAdminBusinessStatus({
  businessId,
  status,
  reason
}) {
  const response = await fetch(`/api/admin/businesses/${businessId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status, reason })
  });

  return parseResponse(response, "Could not update the business.");
}

export async function fetchAdminUsers(filters) {
  const response = await fetch(`/api/admin/users${buildQuery(filters)}`);
  return parseResponse(response, "Could not load users.");
}

export async function updateAdminUserRole({
  userId,
  platformRole,
  reason
}) {
  const response = await fetch(`/api/admin/users/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ platformRole, reason })
  });

  return parseResponse(response, "Could not update the platform role.");
}

export async function fetchAdminSubscriptions(filters) {
  const response = await fetch(
    `/api/admin/subscriptions${buildQuery(filters)}`
  );
  return parseResponse(response, "Could not load subscriptions.");
}

export async function fetchAdminPlans() {
  const response = await fetch("/api/admin/plans");
  return parseResponse(response, "Could not load plan configuration.");
}

export async function fetchAdminActivity(filters) {
  const response = await fetch(`/api/admin/activity${buildQuery(filters)}`);
  return parseResponse(response, "Could not load platform activity.");
}
