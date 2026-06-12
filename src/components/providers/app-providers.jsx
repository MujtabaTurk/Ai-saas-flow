"use client";

import { SessionProvider } from "next-auth/react";
import { I18nProvider } from "./i18n-provider";
import { QueryProvider } from "./query-provider";

export function AppProviders({ children, initialLanguage }) {
  return (
    <SessionProvider>
      <I18nProvider initialLanguage={initialLanguage}>
        <QueryProvider>{children}</QueryProvider>
      </I18nProvider>
    </SessionProvider>
  );
}
