export function getSafeCallbackUrl(value, fallback = null) {
  if (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
  ) {
    return value;
  }

  return fallback;
}

export function buildAuthUrl(
  path,
  {
    callbackUrl,
    email,
    error,
    invitationToken
  } = {}
) {
  const params = new URLSearchParams();

  if (callbackUrl) {
    params.set("callbackUrl", callbackUrl);
  }

  if (email) {
    params.set("email", email);
  }

  if (error) {
    params.set("error", error);
  }

  if (invitationToken) {
    params.set("invitationToken", invitationToken);
  }

  const query = params.toString();

  return query ? `${path}?${query}` : path;
}

export function buildPostLoginUrl({ callbackUrl } = {}) {
  return buildAuthUrl("/auth/continue", {
    callbackUrl: getSafeCallbackUrl(callbackUrl)
  });
}
