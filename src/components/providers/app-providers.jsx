"use client";

import { SessionProvider } from "next-auth/react";
import { LegacyTextTranslator } from "@/components/i18n/legacy-text-translator";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "./theme-provider";
import { I18nProvider } from "./i18n-provider";
import { QueryProvider } from "./query-provider";

export function AppProviders({ children, initialLanguage }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <I18nProvider initialLanguage={initialLanguage}>
          <QueryProvider>
            <ToastProvider>
              {children}
              <LegacyTextTranslator />
            </ToastProvider>
          </QueryProvider>
        </I18nProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
