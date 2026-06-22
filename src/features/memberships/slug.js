export function normalizeMembershipSlug(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function createMembershipSlugFromName(name = "") {
  return normalizeMembershipSlug(name);
}
