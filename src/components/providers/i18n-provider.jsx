"use client";

import { useEffect } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import { i18n } from "@/i18n/client";
import { getLanguageDirection, normalizeLanguageCode } from "@/i18n/settings";

function DocumentLanguageEffect() {
  const { i18n: activeI18n } = useTranslation();
  const language = normalizeLanguageCode(activeI18n.resolvedLanguage || activeI18n.language);
  const direction = getLanguageDirection(language);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    document.body.dataset.language = language;
  }, [direction, language]);

  return null;
}

function LanguageSync({ language }) {
  useEffect(() => {
    if (
      i18n.resolvedLanguage !== language &&
      i18n.language !== language
    ) {
      void i18n.changeLanguage(language);
    }
  }, [language]);

  return null;
}

export function I18nProvider({ children, initialLanguage }) {
  const language = normalizeLanguageCode(initialLanguage);

  return (
    <I18nextProvider i18n={i18n}>
      <LanguageSync language={language} />
      <DocumentLanguageEffect />
      {children}
    </I18nextProvider>
  );
}
