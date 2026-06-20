"use client";

import { SessionProvider } from "next-auth/react";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { ToastProvider } from "@/components/ui/toast";
import { I18nProvider } from "./i18n-provider";
import { QueryProvider } from "./query-provider";

export function AppProviders({ children, initialLanguage }) {
  return (
    <SessionProvider>
      <I18nProvider initialLanguage={initialLanguage}>
        <QueryProvider>
          <ToastProvider>
            <LanguageSwitcher />
            {children}
          </ToastProvider>
        </QueryProvider>
      </I18nProvider>
    </SessionProvider>
  );
}
