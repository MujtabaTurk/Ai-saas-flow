export async function fetchServices() {
  const response = await fetch("/api/services");
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error?.message || "Could not load services.");
  }

  return payload.data;
}

export async function createService(values) {
  const response = await fetch("/api/services", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(values)
  });
  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload?.error?.message || "Could not create service.");
    error.details = payload?.error?.details || null;
    throw error;
  }

  return payload.data;
}

export async function updateService(serviceId, values) {
  const response = await fetch(`/api/services/${serviceId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(values)
  });
  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload?.error?.message || "Could not update service.");
    error.details = payload?.error?.details || null;
    throw error;
  }

  return payload.data;
}

export async function deleteService(serviceId) {
  const response = await fetch(`/api/services/${serviceId}`, {
    method: "DELETE"
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error?.message || "Could not delete service.");
  }

  return payload.data;
}

export async function updateServiceStatus(serviceId, isActive) {
  const response = await fetch(`/api/services/${serviceId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ isActive })
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error?.message || "Could not update service status.");
  }

  return payload.data;
}

