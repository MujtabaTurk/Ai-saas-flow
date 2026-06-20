async function parseResponse(response, fallbackMessage) {
  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload?.error?.message || fallbackMessage);
    error.details = payload?.error?.details || null;
    throw error;
  }

  return payload.data;
}

export async function fetchCustomerBookingDetails(bookingId) {
  const response = await fetch(`/api/customer/bookings/${bookingId}`);

  return parseResponse(response, "Could not load booking details.");
}

export async function cancelCustomerPortalBooking(bookingId, values) {
  const response = await fetch(`/api/customer/bookings/${bookingId}/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(values)
  });

  return parseResponse(response, "Could not cancel booking.");
}

export async function fetchCustomerBookingSlots(bookingId, date) {
  const params = new URLSearchParams({ date });
  const response = await fetch(
    `/api/customer/bookings/${bookingId}/slots?${params.toString()}`
  );

  return parseResponse(response, "Could not load available times.");
}

export async function rescheduleCustomerPortalBooking(bookingId, values) {
  const response = await fetch(
    `/api/customer/bookings/${bookingId}/reschedule`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(values)
    }
  );

  return parseResponse(response, "Could not reschedule booking.");
}

export async function submitCustomerPortalReview(bookingId, values) {
  const response = await fetch(`/api/customer/bookings/${bookingId}/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(values)
  });

  return parseResponse(response, "Could not submit review.");
}

export function getCustomerBookingConfirmationUrl(bookingId) {
  return `/api/customer/bookings/${bookingId}/confirmation`;
}
