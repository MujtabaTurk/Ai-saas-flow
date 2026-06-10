export function normalizeWebsiteUrl(value) {
  const website = String(value || "").trim();

  if (!website) {
    return null;
  }

  if (/^https?:\/\//i.test(website)) {
    return website;
  }

  return `https://${website}`;
}

