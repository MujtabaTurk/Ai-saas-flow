"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslation } from "react-i18next";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function NavigationSkeleton({ className, collapsed = false }) {
  const { t } = useTranslation("common");

  return (
    <div
      className={cn(
        "space-y-2",
        collapsed && "flex flex-col items-center",
        className,
      )}
      role="status"
      aria-label={t("loading.navigation")}
    >
      <span className="sr-only">{t("loading.navigation")}</span>
      {Array.from({ length: 9 }).map((_, index) => (
        <div
          className={cn(
            "h-10 animate-pulse rounded-lg bg-primary-mist",
            collapsed && "w-10",
            !collapsed && index % 3 === 0 && "w-11/12",
            !collapsed && index % 3 === 1 && "w-full",
            !collapsed && index % 3 === 2 && "w-10/12",
          )}
          key={index}
        />
      ))}
    </div>
  );
}

export function AppShellNavigation({
  ariaLabel,
  className,
  collapsed = false,
  isLoading = false,
  navigation,
  onNavigate,
  placement = "content",
}) {
  const { i18n, t } = useTranslation("common");
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const showSkeleton = isLoading || status === "loading";
  const tooltipSide = i18n.dir() === "rtl" ? "left" : "right";

  if (showSkeleton) {
    return <NavigationSkeleton className={className} collapsed={collapsed} />;
  }

  const visibleNavigation = navigation.filter(
    (item) =>
      !item.roles ||
      session?.user?.platformRole === "SUPER_ADMIN" ||
      item.roles.includes(session?.user?.businessRole),
  );
  const groups =
    placement === "footer"
      ? [visibleNavigation.filter((item) => item.section === "footer")]
      : [
          visibleNavigation.filter(
            (item) => !item.section || item.section === "main",
          ),
          visibleNavigation.filter((item) => item.section === "secondary"),
        ];
  const visibleGroups = groups.filter((group) => group.length > 0);

  if (visibleGroups.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label={ariaLabel || t("navigation.primary")}
      className={cn("space-y-1", collapsed && "text-center", className)}
    >
      {visibleGroups.map((group, groupIndex) => (
        <div
          className={cn(
            groupIndex > 0 && "border-t border-growth-border/60 pt-2",
          )}
          key={`${placement}-${groupIndex}`}
        >
          {groupIndex > 0 ? <div className="pb-1" /> : null}
          <div className="space-y-1">
            {group.map((item) => {
              const Icon = item.icon;
              const label = item.labelKey
                ? t(item.labelKey, item.label)
                : item.label;
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" &&
                  item.href !== "/dashboard" &&
                  pathname.startsWith(`${item.href}/`));

              const link = (
                <Link
                  aria-label={collapsed ? label : undefined}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex min-h-10 items-center gap-2 rounded-lg px-4 py-2 text-[15px] font-medium text-serviceflow-muted transition-[background-color,color,box-shadow] duration-150 hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    collapsed &&
                      "mx-auto h-10 w-10 justify-center gap-0 px-0 py-0",
                    isActive && "bg-primary-soft text-serviceflow-subtle",
                  )}
                  href={item.href}
                  key={item.href}
                  onClick={onNavigate}
                >
                  {Icon ? (
                    <Icon
                      className={cn(
                        "size-[18px] shrink-0 transition-transform duration-200",
                        collapsed && "size-5",
                      )}
                      aria-hidden="true"
                    />
                  ) : null}
                  <span
                    aria-hidden={collapsed}
                    className={cn(
                      "truncate whitespace-nowrap transition-[max-width,opacity,transform] duration-200",
                      collapsed
                        ? "max-w-0 -translate-x-1 opacity-0"
                        : "max-w-[10rem] translate-x-0 opacity-100",
                    )}
                  >
                    {label}
                  </span>
                </Link>
              );

              return collapsed ? (
                <Tooltip content={label} key={item.href} side={tooltipSide}>
                  {link}
                </Tooltip>
              ) : (
                link
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
