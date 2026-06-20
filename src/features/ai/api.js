async function parseResponse(response, fallbackMessage) {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const error = new Error(payload?.error?.message || fallbackMessage);
    error.details = payload?.error?.details || null;
    error.status = response.status;
    throw error;
  }

  if (!payload?.data) {
    throw new Error(fallbackMessage);
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

function generationPath(generationId, suffix = "") {
  const normalizedId = String(generationId || "").trim();

  if (!normalizedId) {
    throw new Error("Choose a valid AI draft before continuing.");
  }

  return `/api/ai/generations/${encodeURIComponent(normalizedId)}${suffix}`;
}

export async function fetchAiWorkspace(businessId) {
  const response = await fetch(withBusinessId("/api/ai", businessId), {
    headers: {
      Accept: "application/json"
    }
  });

  return parseResponse(response, "Could not load the AI assistant.");
}

export async function generateAiContent({ businessId, values }) {
  const response = await fetch(
    withBusinessId("/api/ai/generate", businessId),
    {
      method: "POST",
      headers: {
        Accept: "application/json",
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
    withBusinessId(generationPath(generationId), businessId),
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
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
      generationPath(generationId, "/apply"),
      businessId
    ),
    {
      method: "POST",
      headers: {
        Accept: "application/json"
      }
    }
  );

  return parseResponse(response, "Could not apply the AI draft.");
}
