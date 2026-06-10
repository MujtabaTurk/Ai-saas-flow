"use client";

import { SessionProvider } from "next-auth/react";
import { I18nProvider } from "./i18n-provider";
import { QueryProvider } from "./query-provider";

export function AppProviders({ children }) {
  return (
    <SessionProvider>
      <I18nProvider>
        <QueryProvider>{children}</QueryProvider>
      </I18nProvider>
    </SessionProvider>
  );
}
