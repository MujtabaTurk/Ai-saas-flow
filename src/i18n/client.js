"use client";

import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { resources } from "@/i18n/resources";
import {
  defaultLanguage,
  languageCookieName,
  languageStorageKey,
  namespaces,
  supportedLanguages
} from "@/i18n/settings";

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: defaultLanguage,
      supportedLngs: supportedLanguages.map((language) => language.code),
      ns: namespaces,
      defaultNS: "common",
      interpolation: {
        escapeValue: false
      },
      detection: {
        order: ["cookie", "localStorage", "htmlTag", "navigator"],
        caches: ["cookie", "localStorage"],
        lookupCookie: languageCookieName,
        lookupLocalStorage: languageStorageKey,
        cookieMinutes: 60 * 24 * 365,
        cookieOptions: {
          path: "/",
          sameSite: "lax"
        }
      },
      react: {
        useSuspense: false
      }
    });
}

export { i18n };
