import Link from "next/link";
import {
  CalendarDays,
  CreditCard,
  Home,
  Search,
  Settings,
  UserCircle
} from "lucide-react";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { EmailVerificationNotice } from "@/features/auth/components/email-verification-notice";
import { UserProfileMenu } from "@/features/auth/components/user-profile-menu";
import { cn } from "@/lib/utils";
import { HorizontalScrollArea } from "@/components/ui/scroll-area";

const customerNavigation = [
  {
    label: "Overview",
    href: "/customer",
    icon: Home
  },
  {
    label: "Bookings",
    href: "/customer/bookings",
    icon: CalendarDays
  },
  {
    label: "Memberships",
    href: "/customer/memberships",
    icon: CreditCard
  },
  {
    label: "Browse",
    href: "/businesses",
    icon: Search
  },
  {
    label: "Profile",
    href: "/customer/profile",
    icon: UserCircle
  },
  {
    label: "Settings",
    href: "/customer/settings",
    icon: Settings
  }
];

export function CustomerPortalShell({
  activePath = "/customer",
  children,
  user
}) {
  return (
    <main className="min-h-screen bg-growth-dashboard text-foreground">
      <aside className="customer-portal-sidebar fixed inset-y-0 hidden w-72 bg-card/95 p-6 shadow-sm lg:block">
        <Link className="text-lg font-bold" href="/customer">
          ServiceFlow
        </Link>
        <nav className="mt-8 space-y-2">
          {customerNavigation.map((item) => {
            const Icon = item.icon;
            const isActive =
              activePath === item.href ||
              (item.href !== "/customer" &&
                activePath.startsWith(`${item.href}/`));

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground",
                  isActive && "bg-primary text-white hover:bg-primary hover:text-white"
                )}
                href={item.href}
                key={item.href}
              >
                <Icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="customer-portal-main">
        <header className="sticky top-0 z-20 border-b border-growth-border bg-card/90 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                className="shrink-0 font-bold text-foreground lg:hidden"
                href="/customer"
              >
                ServiceFlow
              </Link>
              <Badge variant={user?.emailVerified ? "success" : "warning"}>
                {user?.emailVerified ? "Verified" : "Verify email"}
              </Badge>
            </div>

            <div className="flex min-w-0 items-center justify-end gap-2">
              <HorizontalScrollArea className="flex-1 lg:hidden" viewportClassName="pb-1">
                <nav className="flex gap-1">
                {customerNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    activePath === item.href ||
                    (item.href !== "/customer" &&
                      activePath.startsWith(`${item.href}/`));

                  return (
                    <Tooltip content={item.label} key={item.href}>
                      <Link
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-growth-border bg-card text-primary",
                          isActive && "border-primary bg-primary text-white"
                        )}
                        href={item.href}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                        <span className="sr-only">{item.label}</span>
                      </Link>
                    </Tooltip>
                  );
                })}
                </nav>
              </HorizontalScrollArea>
              <ThemeSwitcher compact />
              <UserProfileMenu
                callbackUrl="/customer/login"
                user={user}
                variant="customer"
              />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
          {!user?.emailVerified ? <EmailVerificationNotice /> : null}
          {children}
        </div>
      </div>
    </main>
  );
}
