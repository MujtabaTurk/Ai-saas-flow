async function parseResponse(response, fallbackMessage) {
  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload?.error?.message || fallbackMessage);
    error.details = payload?.error?.details || null;
    throw error;
  }

  return payload.data;
}

export async function fetchBillingState() {
  const response = await fetch("/api/billing/subscription");

  return parseResponse(response, "Could not load billing details.");
}

export async function createCheckoutSession(values) {
  const response = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values)
  });

  return parseResponse(response, "Could not start checkout.");
}

export async function createBillingPortalSession() {
  const response = await fetch("/api/billing/portal", {
    method: "POST"
  });

  return parseResponse(response, "Could not open billing portal.");
}

