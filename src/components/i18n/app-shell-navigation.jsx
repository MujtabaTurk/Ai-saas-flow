"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export function AppShellNavigation({ navigation }) {
  const { t } = useTranslation("common");
  const pathname = usePathname();
  const { data: session } = useSession();
  const visibleNavigation = navigation.filter(
    (item) =>
      !item.roles ||
      session?.user?.platformRole === "SUPER_ADMIN" ||
      item.roles.includes(session?.user?.businessRole)
  );

  return (
    <nav className="mt-8 space-y-2">
      {visibleNavigation.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/admin" &&
            item.href !== "/dashboard" &&
            pathname.startsWith(`${item.href}/`));

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "block rounded-2xl px-4 py-3 text-sm font-medium text-growth-border transition hover:bg-growth-forest hover:text-white",
              isActive && "bg-primary text-white"
            )}
            href={item.href}
            key={item.href}
          >
            {item.labelKey ? t(item.labelKey, item.label) : item.label}
          </Link>
        );
      })}
    </nav>
  );
}
