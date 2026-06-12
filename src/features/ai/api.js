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

export async function fetchAiWorkspace(businessId) {
  const response = await fetch(withBusinessId("/api/ai", businessId));

  return parseResponse(response, "Could not load the AI assistant.");
}

export async function generateAiContent({ businessId, values }) {
  const response = await fetch(
    withBusinessId("/api/ai/generate", businessId),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(values)
    }
  );

  return parseResponse(response, "Could not generate an AI draft.");
}

export async function reviewAiGeneration({
  businessId,
  generationId,
  approvalStatus
}) {
  const response = await fetch(
    withBusinessId(`/api/ai/generations/${generationId}`, businessId),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ approvalStatus })
    }
  );

  return parseResponse(response, "Could not review the AI draft.");
}

export async function applyAiGeneration({ businessId, generationId }) {
  const response = await fetch(
    withBusinessId(
      `/api/ai/generations/${generationId}/apply`,
      businessId
    ),
    {
      method: "POST"
    }
  );

  return parseResponse(response, "Could not apply the AI draft.");
}
