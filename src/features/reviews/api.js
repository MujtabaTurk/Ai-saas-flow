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

export async function fetchReviews(businessId, filters = {}) {
  const params = new URLSearchParams();

  if (filters.status && filters.status !== "ALL") {
    params.set("status", filters.status);
  }

  if (filters.rating && filters.rating !== "ALL") {
    params.set("rating", filters.rating);
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
    withBusinessId(`/api/reviews${query ? `?${query}` : ""}`, businessId)
  );

  return parseResponse(response, "Could not load reviews.");
}

export async function moderateReview({
  businessId,
  reviewId,
  status,
  reason
}) {
  const response = await fetch(
    withBusinessId(`/api/reviews/${reviewId}`, businessId),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status, reason })
    }
  );

  return parseResponse(response, "Could not moderate the review.");
}

export async function fetchPublicBookingReview(
  businessSlug,
  bookingNumber,
  token
) {
  const params = new URLSearchParams({ token });
  const response = await fetch(
    `/api/public/businesses/${businessSlug}/bookings/${bookingNumber}/review?${params.toString()}`
  );

  return parseResponse(response, "Could not load review status.");
}

export async function submitPublicBookingReview({
  businessSlug,
  bookingNumber,
  values
}) {
  const response = await fetch(
    `/api/public/businesses/${businessSlug}/bookings/${bookingNumber}/review`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(values)
    }
  );

  return parseResponse(response, "Could not submit the review.");
}
