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

export async function fetchBookings(businessId, filters = {}) {
  const params = new URLSearchParams();

  if (filters.status && filters.status !== "ALL") {
    params.set("status", filters.status);
  }

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.page) {
    params.set("page", String(filters.page));
  }

  if (filters.pageSize) {
    params.set("pageSize", String(filters.pageSize));
  }

  const query = params.toString();
  const response = await fetch(
    withBusinessId(`/api/bookings${query ? `?${query}` : ""}`, businessId)
  );
  return parseResponse(response, "Could not load bookings.");
}

export async function createDashboardBooking({ businessId, values }) {
  const response = await fetch(withBusinessId("/api/bookings", businessId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values)
  });

  return parseResponse(response, "Could not create booking.");
}

export async function updateBookingStatus({
  businessId,
  bookingId,
  values
}) {
  const response = await fetch(
    withBusinessId(`/api/bookings/${bookingId}/status`, businessId),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    }
  );

  return parseResponse(response, "Could not update booking status.");
}

export async function updateBookingPayment({ businessId, bookingId, values }) {
  const response = await fetch(withBusinessId(`/api/bookings/${bookingId}/payment`, businessId), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values)
  });
  return parseResponse(response, "Could not update booking payment.");
}

export async function updateBookingNotes({
  businessId,
  bookingId,
  internalNotes
}) {
  const response = await fetch(
    withBusinessId(`/api/bookings/${bookingId}`, businessId),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ internalNotes })
    }
  );

  return parseResponse(response, "Could not update internal notes.");
}

export async function updateBookingAssignment({
  businessId,
  bookingId,
  membershipId
}) {
  const response = await fetch(
    withBusinessId(`/api/bookings/${bookingId}/assignment`, businessId),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ membershipId })
    }
  );

  return parseResponse(response, "Could not update the booking assignment.");
}

export async function fetchBookingSettings(businessId) {
  const response = await fetch(
    withBusinessId("/api/booking-settings", businessId)
  );
  return parseResponse(response, "Could not load booking settings.");
}

export async function updateBookingSettings({ businessId, values }) {
  const response = await fetch(
    withBusinessId("/api/booking-settings", businessId),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    }
  );

  return parseResponse(response, "Could not update booking settings.");
}

export async function fetchDashboardSlots(businessId, serviceId, date) {
  const params = new URLSearchParams({ serviceId, date });
  const response = await fetch(
    withBusinessId(`/api/availability/slots?${params.toString()}`, businessId)
  );

  return parseResponse(response, "Could not load available times.");
}

export async function fetchPublicSlots(businessSlug, serviceId, date) {
  const params = new URLSearchParams({ serviceId, date });
  const response = await fetch(`/api/public/businesses/${businessSlug}/slots?${params.toString()}`);

  return parseResponse(response, "Could not load available times.");
}

export async function createPublicBooking(businessSlug, values) {
  const response = await fetch(`/api/public/businesses/${businessSlug}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values)
  });

  return parseResponse(response, "Could not create booking.");
}

export async function fetchPublicBooking(businessSlug, bookingNumber, token, sessionId = "") {
  const params = new URLSearchParams({ token });
  if (sessionId) params.set("session_id", sessionId);
  const response = await fetch(
    `/api/public/businesses/${businessSlug}/bookings/${bookingNumber}?${params.toString()}`
  );

  return parseResponse(response, "Could not load booking.");
}

export async function cancelPublicBooking(businessSlug, bookingNumber, values) {
  const response = await fetch(
    `/api/public/businesses/${businessSlug}/bookings/${bookingNumber}/cancel`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    }
  );

  return parseResponse(response, "Could not cancel booking.");
}
