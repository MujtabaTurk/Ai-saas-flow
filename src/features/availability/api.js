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

export async function fetchAvailability(businessId) {
  const response = await fetch(withBusinessId("/api/availability", businessId));
  return parseResponse(response, "Could not load weekly availability.");
}

export async function createAvailability({ businessId, values }) {
  const response = await fetch(withBusinessId("/api/availability", businessId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values)
  });

  return parseResponse(response, "Could not create working hours.");
}

export async function updateAvailability({ businessId, availabilityId, values }) {
  const response = await fetch(
    withBusinessId(`/api/availability/${availabilityId}`, businessId),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    }
  );

  return parseResponse(response, "Could not update working hours.");
}

export async function deleteAvailability({ businessId, availabilityId }) {
  const response = await fetch(
    withBusinessId(`/api/availability/${availabilityId}`, businessId),
    {
      method: "DELETE"
    }
  );

  return parseResponse(response, "Could not delete working hours.");
}

export async function updateAvailabilityStatus({
  businessId,
  availabilityId,
  isActive
}) {
  const response = await fetch(
    withBusinessId(`/api/availability/${availabilityId}/status`, businessId),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive })
    }
  );

  return parseResponse(response, "Could not update availability status.");
}

export async function fetchUnavailableDates(businessId) {
  const response = await fetch(
    withBusinessId("/api/unavailable-dates", businessId)
  );
  return parseResponse(response, "Could not load unavailable dates.");
}

export async function createUnavailableDate({ businessId, values }) {
  const response = await fetch(
    withBusinessId("/api/unavailable-dates", businessId),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    }
  );

  return parseResponse(response, "Could not create unavailable date.");
}

export async function updateUnavailableDate({
  businessId,
  unavailableDateId,
  values
}) {
  const response = await fetch(
    withBusinessId(`/api/unavailable-dates/${unavailableDateId}`, businessId),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    }
  );

  return parseResponse(response, "Could not update unavailable date.");
}

export async function deleteUnavailableDate({ businessId, unavailableDateId }) {
  const response = await fetch(
    withBusinessId(`/api/unavailable-dates/${unavailableDateId}`, businessId),
    {
      method: "DELETE"
    }
  );

  return parseResponse(response, "Could not delete unavailable date.");
}
