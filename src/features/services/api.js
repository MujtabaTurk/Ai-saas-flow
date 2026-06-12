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

export async function fetchServices(businessId) {
  const response = await fetch(withBusinessId("/api/services", businessId));

  return parseResponse(response, "Could not load services.");
}

export async function createService({ businessId, values }) {
  const response = await fetch(withBusinessId("/api/services", businessId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(values)
  });
  return parseResponse(response, "Could not create service.");
}

export async function updateService({ businessId, serviceId, values }) {
  const response = await fetch(
    withBusinessId(`/api/services/${serviceId}`, businessId),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(values)
    }
  );

  return parseResponse(response, "Could not update service.");
}

export async function deleteService({ businessId, serviceId }) {
  const response = await fetch(
    withBusinessId(`/api/services/${serviceId}`, businessId),
    {
      method: "DELETE"
    }
  );

  return parseResponse(response, "Could not delete service.");
}

export async function updateServiceStatus({ businessId, serviceId, isActive }) {
  const response = await fetch(
    withBusinessId(`/api/services/${serviceId}/status`, businessId),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ isActive })
    }
  );

  return parseResponse(response, "Could not update service status.");
}
