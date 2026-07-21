import { cookies, headers } from "next/headers";
import { createInstance } from "i18next";
import { resources } from "@/i18n/resources";
import {
  defaultLanguage,
  isSupportedLanguage,
  languageCookieName,
  namespaces,
  normalizeLanguageCode
} from "@/i18n/settings";

function getAcceptedLanguage(acceptLanguage) {
  if (!acceptLanguage) {
    return null;
  }

  const candidates = acceptLanguage
    .split(",")
    .map((entry) => {
      const [language, quality] = entry.trim().split(";q=");
      const baseLanguage = language?.split("-")[0]?.toLowerCase();

      return {
        language: baseLanguage,
        quality: quality === undefined ? 1 : Number(quality)
      };
    })
    .filter(
      (entry) =>
        Number.isFinite(entry.quality) &&
        isSupportedLanguage(entry.language)
    )
    .sort((left, right) => right.quality - left.quality);

  return candidates[0]?.language || null;
}

export async function resolveRequestLanguage(fallbackLanguage = null) {
  const [cookieStore, headerStore] = await Promise.all([
    cookies(),
    headers()
  ]);
  const cookieLanguage = cookieStore.get(languageCookieName)?.value;

  if (cookieLanguage) {
    return normalizeLanguageCode(cookieLanguage);
  }

  if (fallbackLanguage) {
    return normalizeLanguageCode(fallbackLanguage);
  }

  return (
    getAcceptedLanguage(headerStore.get("accept-language")) ||
    defaultLanguage
  );
}

export async function getServerTranslator(language, namespace = "common") {
  const normalizedLanguage = normalizeLanguageCode(language);
  const instance = createInstance();

  await instance.init({
    resources,
    lng: normalizedLanguage,
    fallbackLng: defaultLanguage,
    fallbackNS: namespaces,
    load: "languageOnly",
    nonExplicitSupportedLngs: true,
    returnEmptyString: false,
    returnNull: false,
    missingKeyHandler: (languageCode, namespaceName, key) => {
      console.warn(`[i18n] Missing translation: ${languageCode}/${namespaceName}:${key}`);
    },
    parseMissingKeyHandler: (key, defaultValue) => defaultValue || "",
    supportedLngs: Object.keys(resources),
    ns: namespaces,
    defaultNS: namespace,
    interpolation: {
      escapeValue: false
    },
    initImmediate: false
  });

  return instance.getFixedT(normalizedLanguage, namespace);
}
