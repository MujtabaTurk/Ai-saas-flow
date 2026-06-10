"use client";

import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { resources } from "@/i18n/resources";
import {
  defaultLanguage,
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
        order: ["localStorage", "navigator", "htmlTag"],
        caches: ["localStorage"],
        lookupLocalStorage: languageStorageKey
      },
      react: {
        useSuspense: false
      }
    });
}

export { i18n };

