async function parseResponse(response, fallbackMessage) {
  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload?.error?.message || fallbackMessage);
    error.details = payload?.error?.details || null;
    throw error;
  }

  return payload.data;
}

export async function fetchAnalytics(businessId, days = 30) {
  const params = new URLSearchParams({
    days: String(days)
  });

  if (businessId) {
    params.set("businessId", businessId);
  }

  const response = await fetch(`/api/analytics?${params.toString()}`);

  return parseResponse(response, "Could not load business analytics.");
}
