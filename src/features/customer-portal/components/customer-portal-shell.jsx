import Link from "next/link";
import {
  CalendarDays,
  CreditCard,
  Home,
  Search,
  Settings,
  UserCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmailVerificationNotice } from "@/features/auth/components/email-verification-notice";
import { SignOutButton } from "@/features/auth/components/sign-out-button";
import { cn } from "@/lib/utils";

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
  const initials = String(user?.displayName || user?.email || "C")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  return (
    <main className="min-h-screen bg-growth-dashboard text-growth-sidebar">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-growth-border bg-white/95 p-6 shadow-sm lg:block">
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
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-growth-mint/50 hover:text-growth-sidebar",
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

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-growth-border bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between gap-3">
              <Link className="font-bold lg:hidden" href="/customer">
                ServiceFlow
              </Link>
              <div className="hidden items-center gap-3 lg:flex">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-growth-mint font-bold text-growth-forest">
                  {initials || "C"}
                </div>
                <div>
                  <p className="font-bold">{user?.displayName || "Customer"}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <Badge variant={user?.emailVerified ? "success" : "warning"}>
                {user?.emailVerified ? "Verified" : "Verify email"}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <nav className="flex flex-1 gap-1 overflow-x-auto lg:hidden">
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
                        "inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-growth-border bg-white text-growth-forest",
                        isActive && "border-primary bg-primary text-white"
                      )}
                      href={item.href}
                      key={item.href}
                      title={item.label}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                      <span className="sr-only">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <SignOutButton callbackUrl="/customer/login" />
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
