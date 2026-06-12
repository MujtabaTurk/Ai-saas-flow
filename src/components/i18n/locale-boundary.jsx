"use client";

import { useEffect, useMemo } from "react";
import { createInstance } from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { resources } from "@/i18n/resources";
import {
  defaultLanguage,
  getLanguageDirection,
  namespaces,
  normalizeLanguageCode,
  supportedLanguages
} from "@/i18n/settings";

export function LocaleBoundary({ children, language }) {
  const normalizedLanguage = normalizeLanguageCode(language);
  const direction = getLanguageDirection(normalizedLanguage);
  const instance = useMemo(() => {
    const scopedInstance = createInstance();

    void scopedInstance.use(initReactI18next).init({
      resources,
      lng: normalizedLanguage,
      fallbackLng: defaultLanguage,
      supportedLngs: supportedLanguages.map((item) => item.code),
      ns: namespaces,
      defaultNS: "common",
      interpolation: {
        escapeValue: false
      },
      react: {
        useSuspense: false
      },
      initImmediate: false
    });

    return scopedInstance;
  }, [normalizedLanguage]);

  useEffect(() => {
    document.documentElement.lang = normalizedLanguage;
    document.documentElement.dir = direction;
    document.body.dataset.language = normalizedLanguage;
  }, [direction, normalizedLanguage]);

  return (
    <I18nextProvider i18n={instance}>
      <div dir={direction} lang={normalizedLanguage}>
        {children}
      </div>
    </I18nextProvider>
  );
}
