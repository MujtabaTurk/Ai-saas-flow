function maskEmail(email) {
  const [localPart, domain] = String(email || "").split("@");

  if (!localPart || !domain) {
    return null;
  }

  const visiblePrefix = localPart.slice(0, Math.min(2, localPart.length));

  return `${visiblePrefix}${"*".repeat(Math.max(localPart.length - visiblePrefix.length, 1))}@${domain}`;
}

function maskEmailsInText(value) {
  if (typeof value !== "string") {
    return value;
  }

  return value.replace(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
    (email) => maskEmail(email) || email
  );
}

function sanitizeDetails(details) {
  if (!details || typeof details !== "object") {
    return details || null;
  }

  return Object.fromEntries(
    Object.entries(details).map(([key, value]) => [
      key,
      typeof value === "string" ? maskEmailsInText(value) : value
    ])
  );
}

function serializeError(error) {
  return {
    name: error?.name || "Error",
    message: maskEmailsInText(error?.message || "Email delivery failed."),
    status: error?.status || null,
    details: sanitizeDetails(error?.details),
    cause: error?.cause
      ? {
          name: error.cause?.name || "Error",
          message: maskEmailsInText(error.cause?.message || null)
        }
      : null
  };
}

export function logEmailDeliveryFailure({
  event,
  recipient,
  error,
  metadata = null
}) {
  console.error(
    JSON.stringify({
      level: "error",
      event,
      provider: "resend",
      recipient: maskEmail(recipient),
      error: serializeError(error),
      metadata,
      occurredAt: new Date().toISOString()
    })
  );
}
