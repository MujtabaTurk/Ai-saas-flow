async function parseResponse(response, fallbackMessage) {
  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload?.error?.message || fallbackMessage);
    error.details = payload?.error?.details || null;
    throw error;
  }

  return payload.data;
}

function createRequestId() {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

export async function fetchBillingState() {
  const response = await fetch("/api/billing/subscription", {
    cache: "no-store"
  });

  return parseResponse(response, "Could not load billing details.");
}

export async function reconcileCheckoutSession(sessionId) {
  const requestId = createRequestId();
  const response = await fetch("/api/billing/reconcile", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "x-request-id": requestId
    },
    body: JSON.stringify({
      sessionId
    })
  });

  return parseResponse(response, "Could not synchronize the Stripe subscription.");
}

export async function createCheckoutSession(values) {
  const response = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-request-id": values.idempotencyKey
    },
    body: JSON.stringify(values)
  });

  return parseResponse(response, "Could not start checkout.");
}

export async function createBillingPortalSession() {
  const requestId = createRequestId();
  const response = await fetch("/api/billing/portal", {
    method: "POST",
    headers: {
      "x-request-id": requestId
    }
  });

  return parseResponse(response, "Could not open billing portal.");
}
