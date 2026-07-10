"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Check,
  CreditCard,
  LogOut,
  Settings,
  User
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { THEME_OPTIONS } from "@/components/theme/theme-switcher";
import { Tooltip } from "@/components/ui/tooltip";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

function getInitials(name, email) {
  const source = name || email || "User";
  const parts = source
    .replace(/@.*/, "")
    .split(/[\s._-]+/)
    .filter(Boolean);

  return (
    parts
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("") || "U"
  );
}

function normalizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    ...user,
    name: user.displayName || user.name || user.email || "User",
    email: user.email || "",
    image: user.image || ""
  };
}

function Avatar({ email, image, name, size = "md" }) {
  const [failedImage, setFailedImage] = useState("");
  const initials = getInitials(name, email);
  const showImage = Boolean(image && failedImage !== image);

  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft text-sm font-bold text-primary shadow-sm ring-1 ring-growth-border dark:shadow-none",
        size === "lg" ? "size-11" : "size-8"
      )}
      aria-hidden="true"
    >
      {showImage ? (
        // OAuth avatar URLs are provider-hosted and already optimized for small profile thumbnails.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
          src={image}
          onError={() => setFailedImage(image)}
        />
      ) : (
        initials
      )}
    </span>
  );
}

function MenuItem({
  children,
  className,
  href,
  icon: Icon,
  onClick,
  variant = "default"
}) {
  const content = (
    <>
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{children}</span>
    </>
  );
  const itemClassName = cn(
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[highlighted]:outline-none",
    variant === "destructive"
      ? "text-[hsl(var(--error-foreground))] hover:bg-[hsl(var(--error-bg))] data-[highlighted]:bg-[hsl(var(--error-bg))]"
      : "text-foreground hover:bg-accent data-[highlighted]:bg-accent",
    className
  );

  if (href) {
    return (
      <DropdownMenuPrimitive.Item asChild>
        <Link className={itemClassName} href={href} onClick={onClick}>
          {content}
        </Link>
      </DropdownMenuPrimitive.Item>
    );
  }

  return (
    <DropdownMenuPrimitive.Item asChild>
      <button className={itemClassName} onClick={onClick} type="button">
        {content}
      </button>
    </DropdownMenuPrimitive.Item>
  );
}

function ThemeMenu({ currentTheme, onThemeChange, t }) {
  const currentOption =
    THEME_OPTIONS.find((option) => option.value === currentTheme) ||
    THEME_OPTIONS[2];
  const CurrentIcon = currentOption.icon;

  return (
    <DropdownMenuPrimitive.Sub>
      <DropdownMenuPrimitive.SubTrigger className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm font-semibold text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[highlighted]:bg-accent data-[highlighted]:outline-none">
        <CurrentIcon className="size-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate">{t("theme.label")}</span>
        <span className="hidden shrink-0 text-xs font-semibold text-muted-foreground sm:inline">
          {t(currentOption.labelKey)}
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground rtl:rotate-180" aria-hidden="true" />
      </DropdownMenuPrimitive.SubTrigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.SubContent
          alignOffset={-4}
          className="z-50 w-48 animate-stat-rise rounded-xl border border-growth-border bg-card p-2 text-foreground shadow-xl shadow-[hsl(var(--sf-shadow)/0.16)] outline-none dark:shadow-[hsl(var(--sf-shadow)/0.45)]"
          sideOffset={8}
        >
          <DropdownMenuPrimitive.Label className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            {t("theme.label")}
          </DropdownMenuPrimitive.Label>
          <DropdownMenuPrimitive.RadioGroup
            aria-label={t("theme.choose")}
            value={currentTheme}
            onValueChange={onThemeChange}
          >
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;

              return (
                <DropdownMenuPrimitive.RadioItem
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-sm font-semibold text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[highlighted]:bg-accent data-[highlighted]:outline-none"
                  key={option.value}
                  value={option.value}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">
                    {t(option.labelKey)}
                  </span>
                  <DropdownMenuPrimitive.ItemIndicator className="text-primary">
                    <Check className="size-4" aria-hidden="true" />
                  </DropdownMenuPrimitive.ItemIndicator>
                </DropdownMenuPrimitive.RadioItem>
              );
            })}
          </DropdownMenuPrimitive.RadioGroup>
        </DropdownMenuPrimitive.SubContent>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Sub>
  );
}

export function UserProfileMenu({
  callbackUrl,
  className,
  compact = false,
  layout = "default",
  menuAlign = "end",
  menuSide = "bottom",
  user: providedUser = null,
  tooltipSide = "top",
  variant = "workspace"
}) {
  const { i18n, t } = useTranslation("common");
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { setTheme, theme } = useTheme();
  const [open, setOpen] = useState(false);

  const user = normalizeUser(providedUser || session?.user);
  const isCustomerContext =
    variant === "customer" || pathname?.startsWith("/customer");
  const isAdminContext =
    variant === "admin" ||
    pathname?.startsWith("/admin") ||
    user?.platformRole === "SUPER_ADMIN";
  const hasBusiness = Boolean(user?.activeBusinessId || user?.businessRole);
  const canViewBilling =
    !isCustomerContext && hasBusiness && user?.businessRole === "OWNER";
  const signOutCallbackUrl =
    callbackUrl || (isCustomerContext ? "/customer/login" : "/login");
  const isLoading = !providedUser && status === "loading";

  const menuItems = useMemo(() => {
    const profileHref = isCustomerContext
      ? "/customer/profile"
      : "/dashboard/settings#profile";
    const settingsHref = isCustomerContext
      ? "/customer/settings"
      : "/dashboard/settings#account";
    const items = [
      {
        label: t("userMenu.profile"),
        href: profileHref,
        icon: User
      },
      {
        label: t("userMenu.accountSettings"),
        href: settingsHref,
        icon: Settings
      }
    ];

    if (!isCustomerContext && hasBusiness && !isAdminContext) {
      items.push({
        label: t("userMenu.businessSettings"),
        href: "/dashboard/bookings#booking-rules",
        icon: Building2
      });
    }

    if (canViewBilling) {
      items.push({
        label: t("userMenu.subscriptionBilling"),
        href: "/dashboard/billing",
        icon: CreditCard
      });
    }

    return items;
  }, [canViewBilling, hasBusiness, isAdminContext, isCustomerContext, t]);

  async function handleSignOut() {
    setOpen(false);
    await signOut({ callbackUrl: signOutCallbackUrl });
  }

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center gap-3 rounded-2xl border border-growth-border bg-card/80 px-3 shadow-sm sm:w-[12.5rem] sm:justify-start",
          className
        )}
        role="status"
        aria-label={t("loading.accountMenu")}
      >
        <Skeleton className="size-9 rounded-2xl" />
        <div className="hidden min-w-0 flex-1 space-y-2 sm:block">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const triggerLabel = compact && user.email ? `${user.name} (${user.email})` : user.name;
  const trigger = (
    <DropdownMenuPrimitive.Trigger asChild>
      <button
        aria-label={
          compact ? `${t("userMenu.open")}: ${triggerLabel}` : t("userMenu.open")
        }
        className={cn(
          "group flex h-10 max-w-[15rem] items-center gap-3 rounded-full border border-growth-border bg-card/70 px-1 text-start shadow-sm transition-[background-color,box-shadow,width] duration-200 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:shadow-none sm:px-1",
          layout === "sidebar" &&
            "h-12 w-full max-w-full rounded-xl bg-card/65 px-2 sm:px-2",
          compact && "size-10 max-w-none justify-center rounded-full px-1 sm:px-1"
        )}
        type="button"
      >
        <Avatar email={user.email} image={user.image} name={user.name} />
        <span
          className={cn(
            "min-w-0 flex-1 transition-[max-width,opacity,transform] duration-200",
            layout === "sidebar" ? "block" : "hidden sm:block",
            compact
              ? "max-w-0 -translate-x-1 overflow-hidden opacity-0"
              : "max-w-[11rem] translate-x-0 opacity-100"
          )}
        >
          <span className="block truncate text-sm font-bold text-foreground">
            {user.name}
          </span>
          {user.email ? (
            <span className="block truncate text-xs font-medium text-muted-foreground">
              {user.email}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-[opacity,transform] duration-200",
            layout === "sidebar" ? "block" : "hidden sm:block",
            open && "rotate-180",
            compact && "hidden opacity-0"
          )}
          aria-hidden="true"
        />
      </button>
    </DropdownMenuPrimitive.Trigger>
  );

  return (
    <DropdownMenuPrimitive.Root dir={i18n.dir()} open={open} onOpenChange={setOpen}>
      <div className={cn("relative", className)}>
        {compact ? (
          <Tooltip content={triggerLabel} side={tooltipSide}>
            {trigger}
          </Tooltip>
        ) : (
          trigger
        )}

        <DropdownMenuPrimitive.Portal>
          <DropdownMenuPrimitive.Content
            align={menuAlign}
            className="origin-top-inline-end z-50 w-[min(20rem,calc(100vw-2rem))] animate-stat-rise rounded-xl border border-growth-border bg-card p-2 shadow-xl shadow-[hsl(var(--sf-shadow)/0.16)] outline-none dark:shadow-[hsl(var(--sf-shadow)/0.45)]"
            side={menuSide}
            sideOffset={8}
          >
            <div className="flex min-w-0 items-center gap-3 border-b border-growth-border px-3 py-3">
              <Avatar email={user.email} image={user.image} name={user.name} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">
                  {user.name}
                </p>
                {user.email ? (
                  <p className="truncate text-xs font-medium text-muted-foreground">
                    {user.email}
                  </p>
                ) : null}
                {user.activeBusinessName ? (
                  <p className="mt-1 truncate text-xs font-semibold text-primary">
                    {user.activeBusinessName}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="py-2">
              {menuItems.map((item) => (
                <MenuItem
                  href={item.href}
                  icon={item.icon}
                  key={`${item.label}-${item.href}`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </MenuItem>
              ))}
              <ThemeMenu
                currentTheme={theme}
                t={t}
                onThemeChange={(nextTheme) => {
                  setTheme(nextTheme);
                  setOpen(false);
                }}
              />
            </div>

            <DropdownMenuPrimitive.Separator className="border-t border-growth-border" />
            <div className="pt-2">
              <MenuItem icon={LogOut} onClick={handleSignOut} variant="destructive">
                {t("actions.signOut")}
              </MenuItem>
            </div>
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      </div>
    </DropdownMenuPrimitive.Root>
  );
}
