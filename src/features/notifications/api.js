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

export async function fetchNotifications(businessId, filters = {}) {
  const params = new URLSearchParams();

  if (filters.channel && filters.channel !== "ALL") {
    params.set("channel", filters.channel);
  }

  if (filters.audience && filters.audience !== "ALL") {
    params.set("audience", filters.audience);
  }

  if (filters.deliveryStatus && filters.deliveryStatus !== "ALL") {
    params.set("deliveryStatus", filters.deliveryStatus);
  }

  if (filters.unreadOnly) {
    params.set("unreadOnly", "true");
  }

  if (filters.page) {
    params.set("page", String(filters.page));
  }

  if (filters.pageSize) {
    params.set("pageSize", String(filters.pageSize));
  }

  const query = params.toString();
  const response = await fetch(
    withBusinessId(
      `/api/notifications${query ? `?${query}` : ""}`,
      businessId
    )
  );

  return parseResponse(response, "Could not load notifications.");
}

export async function updateNotificationReadState({
  businessId,
  notificationId,
  isRead
}) {
  const response = await fetch(
    withBusinessId(`/api/notifications/${notificationId}`, businessId),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ isRead })
    }
  );

  return parseResponse(response, "Could not update the notification.");
}

export async function markAllNotificationsRead(businessId) {
  const response = await fetch(
    withBusinessId("/api/notifications/read-all", businessId),
    {
      method: "POST"
    }
  );

  return parseResponse(response, "Could not mark notifications as read.");
}

export async function retryEmailNotification({
  businessId,
  notificationId
}) {
  const response = await fetch(
    withBusinessId(
      `/api/notifications/${notificationId}/retry`,
      businessId
    ),
    {
      method: "POST"
    }
  );

  return parseResponse(response, "Could not retry email delivery.");
}
