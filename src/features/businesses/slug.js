export const RESERVED_BUSINESS_SLUGS = new Set([
  "_next",
  "admin",
  "api",
  "billing",
  "bookings",
  "businesses",
  "customer",
  "dashboard",
  "favicon",
  "forgot-password",
  "health",
  "login",
  "onboarding",
  "register",
  "reset-password",
  "robots",
  "services",
  "settings",
  "sitemap"
]);

export function normalizeBusinessSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export function createSlugFromName(name) {
  return normalizeBusinessSlug(name);
}

export function isValidBusinessSlug(slug) {
  return /^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])?$/.test(slug);
}

export function isReservedBusinessSlug(slug) {
  return RESERVED_BUSINESS_SLUGS.has(normalizeBusinessSlug(slug));
}
