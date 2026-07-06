"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Building2,
  ChevronDown,
  CreditCard,
  LogOut,
  Settings,
  User
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
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
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-[#e2dfff] text-sm font-bold text-[#3525cd] shadow-sm ring-1 ring-[#c7c4d8] dark:ring-white/10",
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
      ? "text-red-700 hover:bg-red-50 data-[highlighted]:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10 dark:data-[highlighted]:bg-red-500/10"
      : "text-[#0b1c30] hover:bg-[#e5eeff] data-[highlighted]:bg-[#e5eeff] dark:text-zinc-100 dark:hover:bg-white/10 dark:data-[highlighted]:bg-white/10",
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
          "flex h-12 w-12 items-center justify-center gap-3 rounded-2xl border border-growth-border bg-white/80 px-3 shadow-sm dark:border-white/10 dark:bg-white/5 sm:w-[12.5rem] sm:justify-start",
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
          "group flex h-10 max-w-[15rem] items-center gap-3 rounded-full border border-[#c7c4d8] bg-white/70 px-1 text-start shadow-sm transition-[background-color,box-shadow,width] duration-200 hover:bg-[#e5eeff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3525cd]/30 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 sm:px-1",
          layout === "sidebar" &&
            "h-12 w-full max-w-full rounded-xl bg-white/65 px-2 sm:px-2",
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
          <span className="block truncate text-sm font-bold text-[#0b1c30] dark:text-white">
            {user.name}
          </span>
          {user.email ? (
            <span className="block truncate text-xs font-medium text-muted-foreground dark:text-zinc-400">
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
            className="origin-top-inline-end z-50 w-[min(20rem,calc(100vw-2rem))] animate-stat-rise rounded-xl border border-[#c7c4d8] bg-white p-2 shadow-xl shadow-slate-950/10 outline-none dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/40"
            side={menuSide}
            sideOffset={8}
          >
            <div className="flex min-w-0 items-center gap-3 border-b border-[#c7c4d8] px-3 py-3 dark:border-white/10">
              <Avatar email={user.email} image={user.image} name={user.name} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#0b1c30] dark:text-white">
                  {user.name}
                </p>
                {user.email ? (
                  <p className="truncate text-xs font-medium text-muted-foreground dark:text-zinc-400">
                    {user.email}
                  </p>
                ) : null}
                {user.activeBusinessName ? (
                  <p className="mt-1 truncate text-xs font-semibold text-[#3525cd] dark:text-emerald-300">
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
            </div>

            <DropdownMenuPrimitive.Separator className="border-t border-[#c7c4d8] dark:border-white/10" />
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
