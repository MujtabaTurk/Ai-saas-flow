import { normalizeLanguageCode } from "@/i18n/settings";

const INTL_LOCALES = {
  en: "en-US",
  de: "de-DE",
  ar: "ar",
  es: "es-ES",
  ur: "ur-PK"
};

export function getIntlLocale(language) {
  return INTL_LOCALES[normalizeLanguageCode(language)] || INTL_LOCALES.en;
}

export function formatLocalizedMoney(
  cents,
  currency,
  language,
  options = {}
) {
  return new Intl.NumberFormat(getIntlLocale(language), {
    style: "currency",
    currency: currency || "usd",
    ...options
  }).format((cents || 0) / 100);
}

export function formatLocalizedDateTime(
  value,
  timezone,
  language,
  options = {}
) {
  return new Intl.DateTimeFormat(getIntlLocale(language), {
    timeZone: timezone,
    ...options
  }).format(new Date(value));
}
