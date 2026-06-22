function withBusinessId(path, businessId) {
  if (!businessId) {
    return path;
  }

  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}businessId=${encodeURIComponent(businessId)}`;
}

async function parseResponse(response, fallbackMessage) {
  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload?.error?.message || fallbackMessage);
    error.details = payload?.error?.details || null;
    throw error;
  }

  return payload.data;
}

export async function fetchMembershipPlans(businessId) {
  const response = await fetch(withBusinessId("/api/membership-plans", businessId));

  return parseResponse(response, "Could not load membership plans.");
}

export async function createMembershipPlan({ businessId, values }) {
  const response = await fetch(withBusinessId("/api/membership-plans", businessId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(values)
  });

  return parseResponse(response, "Could not create membership plan.");
}

export async function updateMembershipPlan({ businessId, planId, values }) {
  const response = await fetch(
    withBusinessId(`/api/membership-plans/${planId}`, businessId),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(values)
    }
  );

  return parseResponse(response, "Could not update membership plan.");
}

export async function deleteMembershipPlan({ businessId, planId }) {
  const response = await fetch(
    withBusinessId(`/api/membership-plans/${planId}`, businessId),
    {
      method: "DELETE"
    }
  );

  return parseResponse(response, "Could not delete membership plan.");
}

export async function fetchBusinessMemberships(businessId, filters = {}) {
  const params = new URLSearchParams();

  if (filters.status && filters.status !== "ALL") {
    params.set("status", filters.status);
  }

  if (filters.search) {
    params.set("search", filters.search);
  }

  const query = params.toString();
  const response = await fetch(
    withBusinessId(`/api/memberships${query ? `?${query}` : ""}`, businessId)
  );

  return parseResponse(response, "Could not load members.");
}

export async function fetchMembershipAnalytics(businessId) {
  const response = await fetch(
    withBusinessId("/api/memberships/analytics", businessId)
  );

  return parseResponse(response, "Could not load membership analytics.");
}

export async function fetchCustomerMemberships() {
  const response = await fetch("/api/customer/memberships");

  return parseResponse(response, "Could not load memberships.");
}

export async function renewCustomerMembership({ membershipId, values }) {
  const response = await fetch(`/api/customer/memberships/${membershipId}/renew`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(values)
  });

  return parseResponse(response, "Could not renew membership.");
}

export async function cancelCustomerMembership({ membershipId, values }) {
  const response = await fetch(`/api/customer/memberships/${membershipId}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(values)
  });

  return parseResponse(response, "Could not cancel membership.");
}

export async function createPublicMembership({ businessSlug, values }) {
  const response = await fetch(`/api/public/businesses/${businessSlug}/memberships`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(values)
  });

  return parseResponse(response, "Could not activate membership.");
}

export async function createPublicMembershipCheckout({ businessSlug, values }) {
  const response = await fetch(
    `/api/public/businesses/${businessSlug}/memberships/checkout`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(values)
    }
  );

  return parseResponse(response, "Could not start Stripe Checkout.");
}

export async function reconcilePublicMembershipCheckout({
  businessSlug,
  sessionId
}) {
  const response = await fetch(
    `/api/public/businesses/${businessSlug}/memberships/reconcile`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sessionId })
    }
  );

  return parseResponse(response, "Could not activate membership.");
}
