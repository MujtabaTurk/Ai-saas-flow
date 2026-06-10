async function parseResponse(response, fallbackMessage) {
  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload?.error?.message || fallbackMessage);
    error.details = payload?.error?.details || null;
    throw error;
  }

  return payload.data;
}

export async function fetchBookings(filters = {}) {
  const params = new URLSearchParams();

  if (filters.status && filters.status !== "ALL") {
    params.set("status", filters.status);
  }

  if (filters.search) {
    params.set("search", filters.search);
  }

  const response = await fetch(`/api/bookings?${params.toString()}`);
  return parseResponse(response, "Could not load bookings.");
}

export async function updateBookingStatus(bookingId, values) {
  const response = await fetch(`/api/bookings/${bookingId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values)
  });

  return parseResponse(response, "Could not update booking status.");
}

export async function fetchBookingSettings() {
  const response = await fetch("/api/booking-settings");
  return parseResponse(response, "Could not load booking settings.");
}

export async function updateBookingSettings(values) {
  const response = await fetch("/api/booking-settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values)
  });

  return parseResponse(response, "Could not update booking settings.");
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

export async function fetchPublicBooking(businessSlug, bookingNumber, token) {
  const params = new URLSearchParams({ token });
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

