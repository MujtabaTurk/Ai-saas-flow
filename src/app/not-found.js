"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  const { t } = useTranslation("common");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <LanguageSwitcher className="w-56 text-growth-sidebar" />
      <EmptyState
        action={
          <Link className="font-medium text-primary hover:underline" href="/">
            {t("actions.goHome")}
          </Link>
        }
        className="w-full max-w-md"
        description={t("notFound.description")}
        title={t("notFound.title")}
      />
    </main>
  );
}
