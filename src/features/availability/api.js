async function parseResponse(response, fallbackMessage) {
  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload?.error?.message || fallbackMessage);
    error.details = payload?.error?.details || null;
    throw error;
  }

  return payload.data;
}

export async function fetchAvailability() {
  const response = await fetch("/api/availability");
  return parseResponse(response, "Could not load weekly availability.");
}

export async function createAvailability(values) {
  const response = await fetch("/api/availability", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values)
  });

  return parseResponse(response, "Could not create working hours.");
}

export async function updateAvailability(availabilityId, values) {
  const response = await fetch(`/api/availability/${availabilityId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values)
  });

  return parseResponse(response, "Could not update working hours.");
}

export async function deleteAvailability(availabilityId) {
  const response = await fetch(`/api/availability/${availabilityId}`, {
    method: "DELETE"
  });

  return parseResponse(response, "Could not delete working hours.");
}

export async function updateAvailabilityStatus(availabilityId, isActive) {
  const response = await fetch(`/api/availability/${availabilityId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isActive })
  });

  return parseResponse(response, "Could not update availability status.");
}

export async function fetchUnavailableDates() {
  const response = await fetch("/api/unavailable-dates");
  return parseResponse(response, "Could not load unavailable dates.");
}

export async function createUnavailableDate(values) {
  const response = await fetch("/api/unavailable-dates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values)
  });

  return parseResponse(response, "Could not create unavailable date.");
}

export async function updateUnavailableDate(unavailableDateId, values) {
  const response = await fetch(`/api/unavailable-dates/${unavailableDateId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values)
  });

  return parseResponse(response, "Could not update unavailable date.");
}

export async function deleteUnavailableDate(unavailableDateId) {
  const response = await fetch(`/api/unavailable-dates/${unavailableDateId}`, {
    method: "DELETE"
  });

  return parseResponse(response, "Could not delete unavailable date.");
}

