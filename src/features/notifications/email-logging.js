function maskEmail(email) {
  const [localPart, domain] = String(email || "").split("@");

  if (!localPart || !domain) {
    return null;
  }

  const visiblePrefix = localPart.slice(0, Math.min(2, localPart.length));

  return `${visiblePrefix}${"*".repeat(Math.max(localPart.length - visiblePrefix.length, 1))}@${domain}`;
}

function serializeError(error) {
  return {
    name: error?.name || "Error",
    message: error?.message || "Email delivery failed.",
    status: error?.status || null
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
