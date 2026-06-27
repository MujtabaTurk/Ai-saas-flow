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
import { Skeleton } from "@/components/ui/skeleton";
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
        "relative grid shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-growth-sidebar via-growth-forest to-primary text-sm font-bold text-white shadow-sm ring-1 ring-white/60 dark:ring-white/10",
        size === "lg" ? "size-11" : "size-10"
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
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[highlighted]:outline-none",
    variant === "destructive"
      ? "text-red-700 hover:bg-red-50 data-[highlighted]:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10 dark:data-[highlighted]:bg-red-500/10"
      : "text-growth-sidebar hover:bg-growth-mint/50 data-[highlighted]:bg-growth-mint/50 dark:text-zinc-100 dark:hover:bg-white/10 dark:data-[highlighted]:bg-white/10",
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
  user: providedUser = null,
  variant = "workspace"
}) {
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
        label: "Profile",
        href: profileHref,
        icon: User
      },
      {
        label: "Account Settings",
        href: settingsHref,
        icon: Settings
      }
    ];

    if (!isCustomerContext && hasBusiness && !isAdminContext) {
      items.push({
        label: "Business Settings",
        href: "/dashboard/bookings#booking-rules",
        icon: Building2
      });
    }

    if (canViewBilling) {
      items.push({
        label: "Subscription / Billing",
        href: "/dashboard/billing",
        icon: CreditCard
      });
    }

    return items;
  }, [canViewBilling, hasBusiness, isAdminContext, isCustomerContext]);

  async function handleSignOut() {
    setOpen(false);
    await signOut({ callbackUrl: signOutCallbackUrl });
  }

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex h-12 w-[12.5rem] items-center gap-3 rounded-2xl border border-growth-border bg-white/80 px-3 shadow-sm dark:border-white/10 dark:bg-white/5",
          className
        )}
        role="status"
        aria-label="Loading account menu"
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

  return (
    <DropdownMenuPrimitive.Root open={open} onOpenChange={setOpen}>
      <div className={cn("relative", className)}>
        <DropdownMenuPrimitive.Trigger asChild>
          <button
            className="group flex h-12 max-w-[15rem] items-center gap-3 rounded-2xl border border-growth-border bg-white/90 px-2.5 text-left shadow-sm transition-colors hover:bg-growth-mint/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 sm:px-3"
            type="button"
          >
            <Avatar email={user.email} image={user.image} name={user.name} />
            <span className="hidden min-w-0 flex-1 sm:block">
              <span className="block truncate text-sm font-bold text-growth-sidebar dark:text-white">
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
                "hidden size-4 shrink-0 text-muted-foreground transition-transform sm:block",
                open && "rotate-180"
              )}
              aria-hidden="true"
            />
          </button>
        </DropdownMenuPrimitive.Trigger>

        <DropdownMenuPrimitive.Portal>
          <DropdownMenuPrimitive.Content
            align="end"
            className="z-50 w-[min(20rem,calc(100vw-2rem))] origin-top-right animate-stat-rise rounded-2xl border border-growth-border bg-white p-2 shadow-xl shadow-emerald-950/10 outline-none dark:border-white/10 dark:bg-zinc-950 dark:shadow-black/40"
            sideOffset={8}
          >
            <div className="flex min-w-0 items-center gap-3 border-b border-growth-border px-3 py-3 dark:border-white/10">
              <Avatar email={user.email} image={user.image} name={user.name} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-growth-sidebar dark:text-white">
                  {user.name}
                </p>
                {user.email ? (
                  <p className="truncate text-xs font-medium text-muted-foreground dark:text-zinc-400">
                    {user.email}
                  </p>
                ) : null}
                {user.activeBusinessName ? (
                  <p className="mt-1 truncate text-xs font-semibold text-growth-forest dark:text-emerald-300">
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

            <DropdownMenuPrimitive.Separator className="border-t border-growth-border dark:border-white/10" />
            <div className="pt-2">
              <MenuItem icon={LogOut} onClick={handleSignOut} variant="destructive">
                Sign Out
              </MenuItem>
            </div>
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      </div>
    </DropdownMenuPrimitive.Root>
  );
}
