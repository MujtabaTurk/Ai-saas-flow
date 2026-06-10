"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

export function AppShellNavigation({ navigation }) {
  const { t } = useTranslation("common");

  return (
    <nav className="mt-8 space-y-2">
      {navigation.map((item) => (
        <Link
          className="block rounded-2xl px-4 py-3 text-sm font-medium text-growth-border transition hover:bg-growth-forest hover:text-white"
          href={item.href}
          key={item.href}
        >
          {item.labelKey ? t(item.labelKey, item.label) : item.label}
        </Link>
      ))}
    </nav>
  );
}

