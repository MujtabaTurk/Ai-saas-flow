import enAdmin from "@/locales/en/admin.json";
import enAuth from "@/locales/en/auth.json";
import enBilling from "@/locales/en/billing.json";
import enBookings from "@/locales/en/bookings.json";
import enCommon from "@/locales/en/common.json";
import enDashboard from "@/locales/en/dashboard.json";
import enServices from "@/locales/en/services.json";
import enPublic from "@/locales/en/public.json";
import enLegacy from "@/locales/en/legacy.json";
import deAdmin from "@/locales/de/admin.json";
import deAuth from "@/locales/de/auth.json";
import deBilling from "@/locales/de/billing.json";
import deBookings from "@/locales/de/bookings.json";
import deCommon from "@/locales/de/common.json";
import deDashboard from "@/locales/de/dashboard.json";
import deServices from "@/locales/de/services.json";
import dePublic from "@/locales/de/public.json";
import deLegacy from "@/locales/de/legacy.json";
import arAdmin from "@/locales/ar/admin.json";
import arAuth from "@/locales/ar/auth.json";
import arBilling from "@/locales/ar/billing.json";
import arBookings from "@/locales/ar/bookings.json";
import arCommon from "@/locales/ar/common.json";
import arDashboard from "@/locales/ar/dashboard.json";
import arServices from "@/locales/ar/services.json";
import arPublic from "@/locales/ar/public.json";
import arLegacy from "@/locales/ar/legacy.json";
import esAdmin from "@/locales/es/admin.json";
import esAuth from "@/locales/es/auth.json";
import esBilling from "@/locales/es/billing.json";
import esBookings from "@/locales/es/bookings.json";
import esCommon from "@/locales/es/common.json";
import esDashboard from "@/locales/es/dashboard.json";
import esServices from "@/locales/es/services.json";
import esPublic from "@/locales/es/public.json";
import esLegacy from "@/locales/es/legacy.json";
import urAdmin from "@/locales/ur/admin.json";
import urAuth from "@/locales/ur/auth.json";
import urBilling from "@/locales/ur/billing.json";
import urBookings from "@/locales/ur/bookings.json";
import urCommon from "@/locales/ur/common.json";
import urDashboard from "@/locales/ur/dashboard.json";
import urServices from "@/locales/ur/services.json";
import urPublic from "@/locales/ur/public.json";
import urLegacy from "@/locales/ur/legacy.json";

// Detect replacement characters and common UTF-8-as-Windows-1252/Latin-1
// mojibake. Falling back to English is preferable to displaying corrupted UI.
const corruptedTranslationPattern = /\uFFFD|\?{2,}|(?:[\u00d8\u00d9\u00da\u00db][^A-Za-z\s])/u;

function isCorruptedTranslation(value) {
  return (
    typeof value === "string" &&
    corruptedTranslationPattern.test(value)
  );
}

function withFallbackValue(value, fallbackValue) {
  if (isCorruptedTranslation(value)) {
    return typeof fallbackValue === "string" ? fallbackValue : "";
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      withFallbackValue(item, Array.isArray(fallbackValue) ? fallbackValue[index] : undefined)
    );
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        withFallbackValue(child, fallbackValue?.[key])
      ])
    );
  }

  return value;
}

function withSafeFallbacks(sourceResources) {
  const englishResources = sourceResources.en;

  return Object.fromEntries(
    Object.entries(sourceResources).map(([language, languageResources]) => [
      language,
      language === "en"
        ? languageResources
        : withFallbackValue(languageResources, englishResources)
    ])
  );
}

const rawResources = {
  en: {
    admin: enAdmin,
    auth: enAuth,
    billing: enBilling,
    bookings: enBookings,
    common: enCommon,
    dashboard: enDashboard,
    services: enServices,
    public: enPublic,
    legacy: enLegacy
  },
  de: {
    admin: deAdmin,
    auth: deAuth,
    billing: deBilling,
    bookings: deBookings,
    common: deCommon,
    dashboard: deDashboard,
    services: deServices,
    public: dePublic,
    legacy: deLegacy
  },
  ar: {
    admin: arAdmin,
    auth: arAuth,
    billing: arBilling,
    bookings: arBookings,
    common: arCommon,
    dashboard: arDashboard,
    services: arServices,
    public: arPublic,
    legacy: arLegacy
  },
  es: {
    admin: esAdmin,
    auth: esAuth,
    billing: esBilling,
    bookings: esBookings,
    common: esCommon,
    dashboard: esDashboard,
    services: esServices,
    public: esPublic,
    legacy: esLegacy
  },
  ur: {
    admin: urAdmin,
    auth: urAuth,
    billing: urBilling,
    bookings: urBookings,
    common: urCommon,
    dashboard: urDashboard,
    services: urServices,
    public: urPublic,
    legacy: urLegacy
  }
};

export const resources = withSafeFallbacks(rawResources);
