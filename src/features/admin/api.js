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

export async function fetchAdminSubscriptions(filters) {
  const response = await fetch(
    `/api/admin/subscriptions${buildQuery(filters)}`
  );
  return parseResponse(response, "Could not load subscriptions.");
}

export async function fetchAdminPlans() {
  const response = await fetch("/api/admin/plans", { cache: "no-store" });
  return parseResponse(response, "Could not load plan configuration.");
}

async function mutateAdminPlan(url, method, body) {
  const response = await fetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  return parseResponse(response, "Could not update plan configuration.");
}

export function createAdminPlan(input) {
  return mutateAdminPlan("/api/admin/plans", "POST", input);
}

export function updateAdminPlan(planId, input) {
  return mutateAdminPlan(`/api/admin/plans/${planId}`, "PATCH", input);
}

export function deleteAdminPlan(planId) {
  return mutateAdminPlan(`/api/admin/plans/${planId}`, "DELETE");
}

export async function fetchAdminActivity(filters) {
  const response = await fetch(`/api/admin/activity${buildQuery(filters)}`);
  return parseResponse(response, "Could not load platform activity.");
}
