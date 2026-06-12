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

export async function fetchCustomers(businessId, filters = {}) {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.marketing && filters.marketing !== "ALL") {
    params.set("marketing", filters.marketing);
  }

  if (filters.sort) {
    params.set("sort", filters.sort);
  }

  if (filters.page) {
    params.set("page", String(filters.page));
  }

  if (filters.pageSize) {
    params.set("pageSize", String(filters.pageSize));
  }

  const query = params.toString();
  const response = await fetch(
    withBusinessId(`/api/customers${query ? `?${query}` : ""}`, businessId)
  );

  return parseResponse(response, "Could not load customers.");
}

export async function createCustomer({ businessId, values }) {
  const response = await fetch(withBusinessId("/api/customers", businessId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(values)
  });

  return parseResponse(response, "Could not create customer.");
}

export async function fetchCustomer({
  businessId,
  customerId,
  page = 1,
  pageSize = 10
}) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize)
  });
  const response = await fetch(
    withBusinessId(
      `/api/customers/${customerId}?${params.toString()}`,
      businessId
    )
  );

  return parseResponse(response, "Could not load customer.");
}

export async function updateCustomer({
  businessId,
  customerId,
  values
}) {
  const response = await fetch(
    withBusinessId(`/api/customers/${customerId}`, businessId),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(values)
    }
  );

  return parseResponse(response, "Could not update customer.");
}

export async function deleteCustomer({ businessId, customerId }) {
  const response = await fetch(
    withBusinessId(`/api/customers/${customerId}`, businessId),
    {
      method: "DELETE"
    }
  );

  return parseResponse(response, "Could not delete customer.");
}
