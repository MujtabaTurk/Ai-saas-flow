export const defaultLanguage = "en";

export const supportedLanguages = [
  { code: "en", name: "English", nativeName: "English", dir: "ltr" },
  { code: "de", name: "German", nativeName: "Deutsch", dir: "ltr" },
  { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl" },
  { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr" },
  { code: "ur", name: "Urdu", nativeName: "اردو", dir: "rtl" }
];

export const namespaces = [
  "common",
  "auth",
  "dashboard",
  "bookings",
  "services",
  "billing",
  "admin"
];

export const languageStorageKey = "serviceflow_language";

export function normalizeLanguageCode(language) {
  const baseLanguage = language?.split("-")[0];

  return supportedLanguages.some((item) => item.code === baseLanguage)
    ? baseLanguage
    : defaultLanguage;
}

export function getLanguageDirection(language) {
  const normalizedLanguage = normalizeLanguageCode(language);

  return (
    supportedLanguages.find((item) => item.code === normalizedLanguage)?.dir ||
    "ltr"
  );
}

