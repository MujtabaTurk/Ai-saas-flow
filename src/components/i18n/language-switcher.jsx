"use client";

import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import {
  languageCookieMaxAge,
  languageCookieName,
  languageStorageKey,
  normalizeLanguageCode,
  supportedLanguages
} from "@/i18n/settings";

export function LanguageSwitcher({ className = "" }) {
  const { i18n, t } = useTranslation("common");
  const router = useRouter();
  const currentLanguage = normalizeLanguageCode(i18n.resolvedLanguage || i18n.language);

  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-2 block font-semibold text-current">
        {t("language.label")}
      </span>
      <select
        className="h-10 w-full rounded-2xl border border-growth-border bg-white px-3 text-sm text-growth-sidebar shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        value={currentLanguage}
        onChange={async (event) => {
          const language = normalizeLanguageCode(event.target.value);
          window.localStorage.setItem(languageStorageKey, language);
          document.cookie = `${languageCookieName}=${language}; Path=/; Max-Age=${languageCookieMaxAge}; SameSite=Lax`;
          await i18n.changeLanguage(language);
          router.refresh();
        }}
      >
        {supportedLanguages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.nativeName}
          </option>
        ))}
      </select>
    </label>
  );
}
