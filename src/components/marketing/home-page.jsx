"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Menu,
  Search,
  Star,
  UserRound,
  Users,
  WalletCards,
  X
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { FeaturedBusinessesCarousel } from "@/components/marketing/featured-businesses-carousel";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import {
  bookingRouteConfig,
  categoryConfig,
  faqKeys,
  footerGroups,
  footerHrefs,
  navLinks,
  planOrder,
  socialLinks,
  testimonialKeys
} from "@/components/marketing/home-page-config";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

function formatPrice(cents, language) {
  return new Intl.NumberFormat(language, {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency"
  }).format((cents || 0) / 100);
}

function PrimaryLink({ children, className, href }) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-14 w-full items-center justify-center rounded-[12px] bg-[#3525cd] px-7 text-sm font-semibold text-white transition-[background-color,opacity] duration-150 ease-out hover:bg-[#2f22b6] hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3525cd]/30 sm:w-auto",
        className
      )}
      href={href}
    >
      {children}
    </Link>
  );
}

function SecondaryLink({ children, className, href }) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-14 w-full items-center justify-center rounded-[12px] border border-[#c7c4d8] bg-white px-7 text-sm font-semibold text-[#0b1c30] transition-[background-color,border-color,color] duration-150 ease-out hover:border-[#b7b1f5] hover:bg-[#f8f9ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3525cd]/25 sm:w-auto",
        className
      )}
      href={href}
    >
      {children}
    </Link>
  );
}

function SectionHeader({ align = "center", description, inverse = false, title }) {
  return (
    <div
      className={cn(
        "max-w-[760px]",
        align === "center" ? "mx-auto text-center" : "text-start"
      )}
    >
      <h2
        className={cn(
          "text-3xl font-bold leading-tight sm:text-4xl",
          inverse ? "text-white" : "text-[#0b1c30]"
        )}
      >
        {title}
      </h2>
      <p
        className={cn(
          "mt-4 text-base leading-7",
          inverse ? "text-[#cbd5e1]" : "text-[#464555]"
        )}
      >
        {description}
      </p>
    </div>
  );
}

function SiteNav() {
  const { t } = useTranslation(["public", "common"]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#c7c4d8] bg-[#f8f9ff]">
      <nav
        aria-label={t("landing.nav.ariaLabel")}
        className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between gap-4 px-6 lg:px-8"
      >
        <Link
          aria-label={t("landing.nav.home")}
          className="flex min-w-0 items-center gap-3 text-xl font-bold text-[#0b1c30]"
          href="/"
        >
          <span className="truncate">{t("common:app.shortName")}</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((item) => (
            <Link
              className="text-sm font-semibold text-[#464555] hover:text-[#3525cd]"
              href={item.href}
              key={item.key}
            >
              {t(`landing.nav.links.${item.key}`)}
            </Link>
          ))}
        </div>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <LanguageSwitcher />
          <ThemeSwitcher />
          <PrimaryLink className="min-h-11 rounded-[8px] px-5" href="/register">
            {t("landing.nav.cta")}
          </PrimaryLink>
        </div>

        <DialogPrimitive.Root
          open={isMobileMenuOpen}
          onOpenChange={setIsMobileMenuOpen}
        >
          <DialogPrimitive.Trigger asChild>
            <button
              aria-expanded={isMobileMenuOpen}
              aria-haspopup="dialog"
              aria-label={t("navigation.openSidebar", { ns: "common" })}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-[#c7c4d8] bg-white text-[#0b1c30] shadow-sm transition-colors hover:border-[#3525cd]/35 hover:bg-[#eef4ff] hover:text-[#3525cd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3525cd]/30 dark:shadow-none md:hidden"
              type="button"
            >
              <Menu className="size-5" aria-hidden="true" />
            </button>
          </DialogPrimitive.Trigger>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-[#0b1c30]/35 md:hidden" />
            <DialogPrimitive.Content className="fixed inset-y-0 end-0 z-[80] flex w-[min(22rem,calc(100vw-2rem))] flex-col border-s border-[#c7c4d8] bg-[#f8f9ff] shadow-sm outline-none md:hidden">
              <DialogPrimitive.Title className="sr-only">
                {t("landing.nav.ariaLabel")}
              </DialogPrimitive.Title>
              <div className="flex items-center justify-between gap-4 border-b border-[#c7c4d8] px-5 py-4">
                <Link
                  aria-label={t("landing.nav.home")}
                  className="flex min-w-0 items-center gap-3 text-lg font-bold text-[#0b1c30]"
                  href="/"
                  onClick={closeMobileMenu}
                >
                  <span className="truncate">{t("common:app.shortName")}</span>
                </Link>
                <DialogPrimitive.Close asChild>
                  <button
                    aria-label={t("navigation.closeSidebar", { ns: "common" })}
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-[#464555] transition-colors hover:bg-[#eef4ff] hover:text-[#3525cd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3525cd]/30"
                    type="button"
                  >
                    <X className="size-5" aria-hidden="true" />
                  </button>
                </DialogPrimitive.Close>
              </div>

              <ScrollArea className="min-h-0 flex-1" viewportClassName="flex min-h-full flex-col justify-between gap-8 px-5 py-6" viewportProps={{ tabIndex: 0 }}>
                <div className="space-y-2">
                  {navLinks.map((item) => (
                    <Link
                      className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-[#464555] transition-colors hover:bg-[#eef4ff] hover:text-[#3525cd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3525cd]/30"
                      href={item.href}
                      key={item.key}
                      onClick={closeMobileMenu}
                    >
                      {t(`landing.nav.links.${item.key}`)}
                    </Link>
                  ))}
                </div>

                <div className="border-t border-[#c7c4d8] pt-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <LanguageSwitcher align="start" />
                    <ThemeSwitcher align="start" />
                  </div>
                  <PrimaryLink
                    className="mt-4 min-h-11 w-full rounded-[8px] px-5"
                    href="/register"
                  >
                    {t("landing.nav.cta")}
                  </PrimaryLink>
                </div>
              </ScrollArea>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      </nav>
    </header>
  );
}

function HeroSection() {
  const { t } = useTranslation("public");
  const stats = t("landing.hero.stats", { returnObjects: true });
  const activity = [
    [CalendarDays, "New booking", "Liam Carter · Deep tissue massage", "Just now", "violet"],
    [Clock3, "Calendar updated", "Tuesday, Jun 18 · 10:30 AM", "1m ago", "blue"],
    [CreditCard, "Payment received", "Visa ending in 4242 · $120.00", "2m ago", "green"],
    [Bell, "Customer notified", "Confirmation sent to liam@email.com", "2m ago", "amber"],
    [Users, "Team assignment", "Assigned to Mia Williams", "3m ago", "slate"]
  ];

  return (
    <section className="relative overflow-hidden bg-[#f8f9ff] pb-16 pt-16 sm:pb-24 sm:pt-24">
      <div className="mx-auto grid max-w-[1280px] items-center gap-14 px-6 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16 lg:px-8">
        <div className="relative z-10 max-w-[590px] text-center lg:text-start">
          <h1 className="max-w-[600px] text-[44px] font-bold tracking-[-0.045em] leading-[1.03] text-[#0b1c30] sm:text-[58px] lg:text-[68px]">
          {t("landing.hero.title")}{" "}
            <span className="text-[#5145cd]">{t("landing.hero.titleAccent")}</span>
          </h1>

          <p className="mt-7 max-w-[530px] text-base leading-7 text-[#586377] sm:text-lg">{t("landing.hero.description")}</p>

          <div className="mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row lg:justify-start">
          <PrimaryLink className="min-h-12 rounded-[9px] px-6" href="/register">
            {t("landing.hero.primaryCta")}
            <ArrowRight className="ms-2 size-4" aria-hidden="true" />
          </PrimaryLink>
          <SecondaryLink className="min-h-12 rounded-[9px] px-6" href="/businesses">{t("landing.hero.secondaryCta")}</SecondaryLink>
          </div>

        <dl className="mt-11 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 border-t border-[#d8dff0] pt-5 text-start lg:justify-start">
          {stats.map((stat) => (
            <div className="flex items-baseline gap-2" key={stat.label}>
              <dt className="text-lg font-bold text-[#0b1c30]">{stat.value}</dt>
              <dd className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#778196]">{stat.label}</dd>
            </div>
          ))}
        </dl>
        </div>

        <div className="relative z-10 min-w-0 lg:pt-4">
          <div className="relative mx-auto max-w-[720px] rounded-[18px] border border-[#d9dceb] bg-white p-2 shadow-sm sm:p-3">
            <div className="overflow-hidden rounded-[12px] border border-[#e6e8f0] bg-[#fbfcff]">
              <div className="flex h-11 items-center justify-between border-b border-[#e8eaf0] bg-white px-4 sm:px-5"><div className="flex items-center gap-2.5"><div className="grid size-6 place-items-center rounded-[7px] bg-[#5145cd] text-[10px] font-bold text-white">S</div><span className="text-xs font-bold text-[#1a2540]">ServiceFlow</span><span className="hidden rounded-full bg-[#f1f2f7] px-2 py-1 text-[9px] font-semibold text-[#788197] sm:inline">Workspace</span></div><div className="flex items-center gap-2"><span className="hidden text-[10px] text-[#8992a5] sm:inline">Today, Jun 18</span><span className="size-6 rounded-full bg-[#d8dded]" /></div></div>
              <div className="grid min-h-[330px] grid-cols-[76px_1fr] sm:grid-cols-[126px_1fr]"><aside className="border-e border-[#e8eaf0] bg-[#f7f8fc] p-3 sm:p-4"><p className="mb-5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#9299aa]">Workspace</p>{["Overview", "Bookings", "Customers", "Team"].map((item, index) => <div className={cn("mb-2 rounded-[7px] px-2 py-2 text-[10px] font-semibold", index === 0 ? "bg-[#ecebff] text-[#5145cd]" : "text-[#8a93a6]")} key={item}>{item}</div>)}<div className="mt-10 border-t border-[#e4e6ed] pt-4"><p className="text-[9px] leading-4 text-[#a0a7b5]">All systems operational</p><span className="mt-2 inline-flex items-center gap-1 text-[9px] font-semibold text-[#23956b]"><span className="size-1.5 rounded-full bg-[#35b783]" /> Live</span></div></aside><div className="min-w-0 p-4 sm:p-6"><div className="flex items-end justify-between"><div><p className="text-[10px] font-semibold text-[#8992a5]">Tuesday, June 18</p><h2 className="mt-1 text-lg font-bold tracking-[-0.02em] text-[#1a2540] sm:text-xl">Good morning, Alex</h2></div><button className="hidden h-8 rounded-[7px] bg-[#5145cd] px-3 text-[10px] font-semibold text-white sm:block" type="button">New booking</button></div><div className="mt-5 grid gap-3 sm:grid-cols-3">{[["Today’s bookings","24","+12%"],["Revenue","2,840","+8%"],["Team online","8 / 10",""]].map(([label, value, change]) => <div className="rounded-[9px] border border-[#e9eaf1] bg-white p-3" key={label}><p className="text-[9px] font-semibold text-[#8992a5]">{label}</p><div className="mt-2 flex items-baseline gap-1.5"><strong className="text-sm text-[#1a2540]">{value}</strong>{change && <span className="text-[9px] font-semibold text-[#2a9b70]">{change}</span>}</div></div>)}</div><div className="mt-5 rounded-[10px] border border-[#e9eaf1] bg-white p-3 sm:p-4"><div className="flex items-center justify-between"><p className="text-[11px] font-bold text-[#1a2540]">Live activity</p><span className="flex items-center gap-1 text-[9px] font-semibold text-[#8992a5]"><span className="size-1.5 animate-pulse rounded-full bg-[#35b783]" /> Updating</span></div><div className="mt-3 space-y-1">{activity.map(([Icon, label, detail, time, tone], index) => <div className={cn("hero-activity-row flex items-center gap-2.5 rounded-[8px] px-2 py-2.5", "hero-activity-row-" + (index + 1))} key={label}><span className={cn("grid size-7 shrink-0 place-items-center rounded-[7px]", { violet: "bg-[#eeecff] text-[#5145cd]", blue: "bg-[#eaf3ff] text-[#3a7bd5]", green: "bg-[#e8f8f1] text-[#24966b]", amber: "bg-[#fff5df] text-[#c48722]", slate: "bg-[#eef0f5] text-[#667085]" }[tone])}><Icon className="size-3.5" aria-hidden="true" /></span><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-bold text-[#354057]">{label}</p><p className="truncate text-[9px] text-[#9299aa]">{detail}</p></div><span className="shrink-0 text-[9px] text-[#a0a7b5]">{time}</span></div>)}</div></div></div></div>
            </div>
          </div>
          <p className="mt-4 text-center text-[11px] font-medium text-[#9299aa]">One calm view for every booking, payment, and customer moment.</p>
        </div>
      </div>
    </section>
  );
}

function DiscoverySearchSection() {
  const { t } = useTranslation("public");

  return (
    <section className="bg-white py-12" id="discover-search">
      <div className="mx-auto grid max-w-[1280px] gap-8 px-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
        <div>
          <h2 className="text-3xl font-bold leading-tight text-[#0b1c30] sm:text-4xl">
            {t("landing.discovery.title")}
          </h2>
          <p className="mt-4 max-w-[560px] text-base leading-7 text-[#464555]">
            {t("landing.discovery.description")}
          </p>
        </div>

        <form
          action="/businesses"
          className="grid gap-3 rounded-[8px] border border-[#d8dff0] bg-[#f8f9ff] p-3 sm:grid-cols-[1fr_auto]"
        >
          <div className="block">
            <Label
              className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-[#586377]"
              htmlFor="landing-directory-search"
            >
              {t("landing.discovery.searchLabel")}
            </Label>
            <Input
              className="h-12 rounded-[8px] border-[#c7c4d8] text-[#0b1c30] shadow-none focus-visible:border-[#3525cd] focus-visible:ring-[#3525cd]/15"
              id="landing-directory-search"
              name="q"
              placeholder={t("landing.discovery.searchPlaceholder")}
              type="search"
            />
          </div>
          <button
            className="mt-auto inline-flex h-12 items-center justify-center rounded-[8px] bg-[#3525cd] px-7 text-sm font-semibold text-white transition-colors hover:bg-[#2f22b6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3525cd]/35"
            type="submit"
          >
            <Search className="me-2 size-4" aria-hidden="true" />
            {t("landing.discovery.submit")}
          </button>
        </form>
      </div>
    </section>
  );
}

function FeaturedBusinessesSection() {
  const { t } = useTranslation("public");

  return (
    <section
      className="relative overflow-hidden bg-[#f8f9ff] py-24 sm:py-28"
      id="featured-businesses"
    >
      <div className="mx-auto max-w-[1280px] px-8">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_0.55fr] lg:items-end">
          <div>
            <h2 className="max-w-[820px] text-4xl font-bold leading-[1.03] text-[#0b1c30] sm:text-5xl lg:text-[56px]">
              {t("landing.featured.title")}
            </h2>
          </div>
          <div className="lg:justify-self-end">
            <p className="max-w-[430px] text-base leading-7 text-[#464555]">
              {t("landing.featured.description")}
            </p>
            <Link
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[999px] bg-[#0b1c30] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#3525cd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3525cd]/30"
              href="/businesses"
            >
              {t("landing.featured.cta")}
              <ArrowRight className="ms-2 size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-14">
        <FeaturedBusinessesCarousel />
      </div>
    </section>
  );
}

function CategoriesSection() {
  const { t } = useTranslation("public");

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-[1280px] px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold leading-tight text-[#0b1c30]">
              {t("landing.categories.title")}
            </h2>
          </div>
          <p className="max-w-[430px] text-sm leading-6 text-[#464555]">
            {t("landing.categories.description")}
          </p>
        </div>

        <div className="mt-10 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
          {categoryConfig.map((category) => {
            const Icon = category.icon;

            return (
              <article className="border-t border-[#d8dff0] pt-5" key={category.key}>
                <div className="flex items-center gap-3">
                  <span className={cn("grid size-10 place-items-center rounded-[8px]", category.accent)}>
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="text-sm font-bold text-[#0b1c30]">
                    {t(`landing.categories.items.${category.key}.title`)}
                  </h3>
                </div>
                <p className="mt-1 text-xs leading-5 text-[#586377]">
                  {t(`landing.categories.items.${category.key}.description`)}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature }) {
  const { t } = useTranslation("public");
  const Icon = feature.icon;

  return (
    <article className="border-t border-[#d8dff0] pt-6">
      <span className={cn("grid size-11 place-items-center rounded-[8px]", feature.accent)}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h3 className="mt-5 text-lg font-bold leading-7 text-[#0b1c30]">
        {t(`landing.features.items.${feature.key}.title`)}
      </h3>
      <p className="mt-2 text-sm leading-6 text-[#464555]">
        {t(`landing.features.items.${feature.key}.description`)}
      </p>
    </article>
  );
}

const storySteps = {
  bookings: [["Customer books service", "Deep tissue massage · Liam Carter"], ["Time selected", "Tuesday, Jun 18 · 10:30 AM"], ["Booking confirmed", "Booking #SF-2048 is locked in"], ["Business notified", "Mia Williams has been assigned"]],
  team: [["New booking arrives", "Deep tissue massage · 60 min"], ["Best teammate found", "Mia Williams · 4.9 rating"], ["Assignment shared", "Mia has accepted the appointment"], ["Team stays aligned", "Calendar and customer record updated"]],
  wallet: [["Payment initiated", "Visa ending in 4242 · $120.00"], ["Payment received", "Funds captured successfully"], ["Revenue categorized", "Booking revenue · June 18"], ["Balance ready", "Available to withdraw · $2,840"]],
  analytics: [["Bookings are tracked", "24 appointments this week"], ["Signals become clear", "Tuesday is your strongest day"], ["Revenue is forecast", "$8,420 projected this month"], ["Action is obvious", "Open two more Tuesday slots"]],
  customers: [["Customer returns", "Liam Carter booked again"], ["History is connected", "4 visits · 2 reviews · 1 membership"], ["Team sees context", "Last service and preferences surfaced"], ["Next visit is personal", "Send a tailored follow-up"]]
};

const storyMeta = {
  bookings: { eyebrow: "Booking Management", title: "Turn every booking into a calm, confirmed experience.", description: "Give customers a frictionless path from service discovery to confirmation while your team always knows what happens next.", icon: CalendarDays, accent: "violet" },
  team: { eyebrow: "Team Management", title: "Keep the right person in the loop.", description: "Route appointments to the right teammate, share context instantly, and keep a busy service team moving together.", icon: Users, accent: "blue" },
  wallet: { eyebrow: "Wallet & Revenue", title: "Make every payment easy to follow.", description: "Connect deposits, completed bookings, and available balance so revenue never gets lost between the front desk and the books.", icon: WalletCards, accent: "green" },
  analytics: { eyebrow: "Analytics", title: "See the signal before the week is over.", description: "Turn booking activity into clear decisions with a live view of demand, revenue, and the next best move.", icon: BarChart3, accent: "amber" },
  customers: { eyebrow: "Customer Management", title: "Make the next visit feel considered.", description: "Keep every customer detail, visit, and preference in one place so your team can build relationships that last.", icon: UserRound, accent: "slate" }
};

function StoryCanvas({ storyKey, activeStep }) {
  const meta = storyMeta[storyKey];
  const steps = storySteps[storyKey];
  const Icon = meta.icon;
  const tone = { violet: "bg-[#eeecff] text-[#5145cd]", blue: "bg-[#eaf3ff] text-[#3a7bd5]", green: "bg-[#e8f8f1] text-[#24966b]", amber: "bg-[#fff5df] text-[#c48722]", slate: "bg-[#eef0f5] text-[#667085]" }[meta.accent];

  return (
    <div className="min-w-0 rounded-[12px] border border-[#dfe2ea] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3 border-b border-[#edf0f4] pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className={cn("grid size-9 shrink-0 place-items-center rounded-[9px]", tone)}>
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#1a2540]">ServiceFlow workspace</p>
            <p className="text-[11px] font-semibold text-[#8992a5]">{meta.eyebrow}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-[#e8f8f1] px-2.5 py-1 text-[10px] font-bold text-[#23956b]">
          Live
        </span>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[0.72fr_1fr]">
        <div className="rounded-[9px] border border-[#e8eaf0] bg-[#f8f9fc] p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9299aa]">
            Booking workflow
          </p>
          <div className="mt-3 space-y-2">
            {steps.map(([label, detail], index) => (
              <div className="flex items-start gap-2.5" key={label}>
                <span
                  className={cn(
                    "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[9px] font-bold",
                    index <= activeStep
                      ? "bg-[#5145cd] text-white"
                      : "border border-[#d9ddea] bg-white text-[#8992a5]"
                  )}
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold text-[#354057]">{label}</p>
                  <p className="truncate text-[10px] leading-4 text-[#9299aa]">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-[9px] border border-[#e8eaf0] bg-white p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9299aa]">Customer booking</p>
                <p className="mt-1 text-sm font-bold text-[#1a2540]">Deep tissue massage</p>
              </div>
              <span className="rounded-full bg-[#eeecff] px-2 py-1 text-[10px] font-bold text-[#5145cd]">Confirmed</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-semibold text-[#687286]">
              <span className="rounded-[7px] bg-[#f8f9fc] px-2.5 py-2">Liam Carter</span>
              <span className="rounded-[7px] bg-[#f8f9fc] px-2.5 py-2">Tue · 10:30 AM</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[9px] border border-[#e8eaf0] bg-[#f8f9fc] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9299aa]">Calendar</p>
              <p className="mt-2 text-xs font-bold text-[#354057]">Slot updated</p>
              <p className="mt-1 text-[10px] text-[#8992a5]">10:30 AM reserved</p>
            </div>
            <div className="rounded-[9px] border border-[#cfeedd] bg-[#effaf4] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#23956b]">Notification</p>
              <p className="mt-2 text-xs font-bold text-[#267c5b]">Business notified</p>
              <p className="mt-1 text-[10px] text-[#4f9878]">Team assignment shared</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductStory({ storyKey, reverse = false }) {
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const storyRef = useRef(null);
  const meta = storyMeta[storyKey];
  const Icon = meta.icon;
  useEffect(() => {
    const node = storyRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!isVisible) return undefined;
    const timer = window.setInterval(() => setActiveStep((step) => (step + 1) % storySteps[storyKey].length), 1500);
    return () => window.clearInterval(timer);
  }, [isVisible, storyKey]);
  return <article className={cn("product-story grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-2 lg:gap-20", reverse && "lg:[&>div:first-child]:order-2")} ref={storyRef}><div className="max-w-[470px]"><span className={cn("grid size-11 place-items-center rounded-[11px]", { violet: "bg-[#eeecff] text-[#5145cd]", blue: "bg-[#eaf3ff] text-[#3a7bd5]", green: "bg-[#e8f8f1] text-[#24966b]", amber: "bg-[#fff5df] text-[#c48722]", slate: "bg-[#eef0f5] text-[#667085]" }[meta.accent])}><Icon className="size-5" aria-hidden="true" /></span><p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-[#7f899b]">{meta.eyebrow}</p><h3 className="mt-3 text-3xl font-bold tracking-[-0.04em] leading-[1.08] text-[#0b1c30] sm:text-[42px]">{meta.title}</h3><p className="mt-5 text-base leading-7 text-[#687286]">{meta.description}</p></div><StoryCanvas activeStep={activeStep} storyKey={storyKey} /></article>;
}

function FeaturesSection() {
  const { t } = useTranslation("public");

  return (
    <section className="bg-[#f8fafc]" id="features">
      <div className="mx-auto max-w-[1280px] px-6 sm:px-8">
        <SectionHeader
          title={t("landing.features.title")}
          description={t("landing.features.description")}
        />

        <div className="mt-4 divide-y divide-[#e1e4ec]">
          <ProductStory storyKey="bookings" />
          <ProductStory reverse storyKey="team" />
          <ProductStory storyKey="wallet" />
          <ProductStory reverse storyKey="analytics" />
          <ProductStory storyKey="customers" />
        </div>
      </div>
    </section>
  );
}

function StepGrid({ iconClassName, items, stepKey }) {
  const { t } = useTranslation("public");

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      {items.map((step, index) => {
        const Icon = step.icon;

        return (
          <article className="relative border-t border-[#c7c4d8] pt-6" key={step.key}>
            <div className="flex items-center gap-3">
              <span className={cn("grid size-11 place-items-center rounded-[8px]", iconClassName)}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#586377]">
                {t("landing.workflow.step", { count: index + 1 })}
              </p>
            </div>
            <h3 className="mt-4 text-base font-bold leading-6 text-[#0b1c30]">
              {t(`${stepKey}.${step.key}.title`)}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#464555]">
              {t(`${stepKey}.${step.key}.description`)}
            </p>
          </article>
        );
      })}
    </div>
  );
}

function BookingWorkflowSection() {
  const { t } = useTranslation("public");

  return (
    <section className="bg-white py-20" id="booking-workflow">
      <div className="mx-auto max-w-[1280px] px-8">
        <SectionHeader
          title={t("landing.workflow.title")}
          description={t("landing.workflow.description")}
        />

        <div className="mt-12">
          <StepGrid
            iconClassName="bg-[#eef4ff] text-[#3525cd]"
            items={bookingRouteConfig}
            stepKey="landing.workflow.items"
          />
        </div>
      </div>
    </section>
  );
}

const pricing = {
  TRIAL: { monthly: 0, yearly: 0 },
  BASIC: { monthly: 1900, yearly: 19380 },
  PRO: { monthly: 4900, yearly: 49980 }
};

function PricingCard({ billingCycle, code }) {
  const { i18n, t } = useTranslation("public");
  const highlighted = code === "BASIC";
  const trial = code === "TRIAL";
  const features = t(`landing.pricing.plans.${code}.features`, { returnObjects: true });
  const priceCents = pricing[code][billingCycle];
  const monthlyEquivalent = billingCycle === "yearly" && !trial ? Math.round(priceCents / 12) : priceCents;
  const savings = trial || billingCycle === "monthly" ? 0 : pricing[code].monthly * 12 - pricing[code].yearly;

  return (
    <article
      className={cn(
        "relative flex h-full flex-col rounded-[12px] border bg-white p-7 transition-[border-color,box-shadow] duration-200",
        highlighted ? "border-[#5145cd]" : "border-[#dfe2ea]"
      )}
    >
      {highlighted ? (
        <div className="absolute start-6 top-0 -translate-y-1/2 rounded-full bg-[#5145cd] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
          {t("landing.pricing.popular")}
        </div>
      ) : null}
      <h3 className="text-xl font-bold leading-8 text-[#0b1c30]">
        {t(`landing.pricing.plans.${code}.name`)}
      </h3>
      <p className="mt-1 min-h-10 text-sm leading-5 text-[#687286]">
        {t(`landing.pricing.plans.${code}.description`)}
      </p>
      <div className="mt-6 flex items-end gap-1.5">
        <span className="text-4xl font-bold leading-10 tracking-[-0.04em] text-[#0b1c30]">
          {formatPrice(monthlyEquivalent, i18n.language)}
        </span>
        <span className="pb-1 text-sm font-semibold text-[#687286]">
          {trial ? t("landing.pricing.trialPeriod") : "/ month"}
        </span>
      </div>
      <p className="mt-1 min-h-5 text-xs text-[#8b94a5]">
        {trial ? "No credit card required" : billingCycle === "yearly" ? `Billed ${formatPrice(priceCents, i18n.language)} yearly` : "Billed monthly"}
      </p>
      {savings > 0 ? <span className="mt-3 inline-flex w-fit rounded-full bg-[#e9f8f0] px-2.5 py-1 text-[11px] font-bold text-[#21855f]">Save {formatPrice(savings, i18n.language)} / year</span> : <span className="mt-3 block h-6" />}

      <ul className="mt-7 flex-1 space-y-3 border-t border-[#edf0f4] pt-6">
        {features.slice(0, 4).map((feature) => (
          <li className="flex items-start gap-2 text-sm leading-5 text-[#354057]" key={feature}>
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#5145cd]" aria-hidden="true" />
            {feature}
          </li>
        ))}
      </ul>

      {highlighted ? (
        <PrimaryLink className="mt-8 min-h-12 w-full rounded-[8px]" href="/register">
          {t("landing.pricing.choose", { plan: t(`landing.pricing.plans.${code}.name`) })}
        </PrimaryLink>
      ) : (
        <SecondaryLink className="mt-8 min-h-12 w-full rounded-[8px] text-[#5145cd]" href="/register">
          {trial
            ? t("landing.pricing.startTrial")
            : t("landing.pricing.choose", { plan: t(`landing.pricing.plans.${code}.name`) })}
        </SecondaryLink>
      )}
    </article>
  );
}

function PricingSection() {
  const { t } = useTranslation("public");
  const [billingCycle, setBillingCycle] = useState("monthly");

  return (
    <section className="bg-white py-24" id="pricing">
      <div className="mx-auto max-w-[1280px] px-8">
        <SectionHeader
          title={t("landing.pricing.title")}
          description={t("landing.pricing.description")}
        />

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <div className="inline-flex rounded-full border border-[#dfe2ea] bg-[#f7f8fb] p-1" role="group" aria-label="Billing frequency">
            {["monthly", "yearly"].map((cycle) => (
              <button
                aria-pressed={billingCycle === cycle}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-bold transition-[background-color,color,box-shadow] duration-200",
                  billingCycle === cycle ? "bg-white text-[#1a2540] shadow-sm" : "text-[#7c8698] hover:text-[#354057]"
                )}
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                type="button"
              >
                {cycle === "monthly" ? "Monthly" : "Yearly"}
              </button>
            ))}
          </div>
          <span className="rounded-full bg-[#e9f8f0] px-3 py-1.5 text-xs font-bold text-[#21855f]">Save 15% yearly</span>
        </div>

        <div className="mt-10 grid items-stretch gap-5 lg:grid-cols-3">
          {planOrder.map((code) => (
            <PricingCard billingCycle={billingCycle} code={code} key={code} />
          ))}
        </div>
        <p className="mt-7 text-center text-xs text-[#8b94a5]">Yearly pricing is shown as an equivalent monthly rate and billed upfront.</p>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const { t } = useTranslation("public");

  return (
    <section className="bg-[#eef4ff] py-20" id="reviews">
      <div className="mx-auto max-w-[1280px] px-8">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <SectionHeader
              align="left"
              title={t("landing.testimonials.title")}
              description={t("landing.testimonials.description")}
            />
            <div className="mt-8 border-y border-[#c7c4d8] py-6">
              <div className="flex gap-1 text-amber-400" aria-label={t("landing.testimonials.ratingAria")}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star className="size-5 fill-current" key={index} aria-hidden="true" />
                ))}
              </div>
              <p className="mt-4 text-3xl font-bold text-[#0b1c30]">4.9/5</p>
              <p className="mt-2 text-sm leading-6 text-[#464555]">
                {t("landing.testimonials.ratingDescription")}
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {testimonialKeys.map((key) => (
              <article
                className="flex min-h-[310px] flex-col rounded-[8px] border border-[#c7c4d8] bg-white p-6"
                key={key}
              >
                <div className="flex gap-1 text-amber-400" aria-label={t("landing.testimonials.reviewAria")}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star className="size-4 fill-current" key={index} aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="mt-5 flex-1 text-sm leading-7 text-[#0b1c30]">
                  &quot;{t(`landing.testimonials.items.${key}.quote`)}&quot;
                </blockquote>
                <div className="mt-6 flex items-center gap-3 border-t border-[#c7c4d8] pt-5">
                  <span className="grid size-11 place-items-center rounded-full bg-[#3525cd] text-sm font-bold text-white">
                    {t(`landing.testimonials.items.${key}.avatar`)}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#0b1c30]">
                      {t(`landing.testimonials.items.${key}.name`)}
                    </p>
                    <p className="text-xs text-[#586377]">
                      {t(`landing.testimonials.items.${key}.role`)}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-[#3525cd]">
                      {t(`landing.testimonials.items.${key}.result`)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  const { t } = useTranslation("public");

  return (
    <section className="bg-white py-20" id="faq">
      <div className="mx-auto max-w-[960px] px-8">
        <SectionHeader
          title={t("landing.faq.title")}
          description={t("landing.faq.description")}
        />

        <Accordion
          className="mt-12 divide-y divide-[#d8dff0] border-y border-[#d8dff0]"
          collapsible
          type="single"
        >
          {faqKeys.map((key) => (
            <AccordionItem className="border-0" key={key} value={key}>
              <AccordionTrigger
                className="py-6 text-base font-bold text-[#0b1c30] focus-visible:ring-[#3525cd]/30"
                iconClassName="size-4 text-[#3525cd]"
              >
                {t(`landing.faq.items.${key}.question`)}
              </AccordionTrigger>
              <AccordionContent className="pb-6 pt-0 text-sm leading-6 text-[#464555]">
                {t(`landing.faq.items.${key}.answer`)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function CtaSection() {
  const { t } = useTranslation("public");

  return (
    <section className="bg-[#0b1c30] py-20">
      <div className="mx-auto max-w-[1280px] px-8 text-center text-white">
        <h2 className="mx-auto max-w-[760px] text-3xl font-bold leading-tight sm:text-4xl">
          {t("landing.cta.title")}
        </h2>
        <p className="mx-auto mt-5 max-w-[640px] text-base leading-7 text-[#cbd5e1]">
          {t("landing.cta.description")}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <PrimaryLink className="bg-white text-[#0b1c30] hover:bg-[#eef4ff]" href="/register">
            {t("landing.cta.primary")}
            <ArrowRight className="ms-2 size-4" aria-hidden="true" />
          </PrimaryLink>
          <SecondaryLink className="border-white/20 bg-white/10 text-white hover:bg-white/15" href="/businesses">
            {t("landing.cta.secondary")}
          </SecondaryLink>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  const { t } = useTranslation(["public", "common"]);

  return (
    <footer className="border-t border-[#c7c4d8] bg-white">
      <div className="mx-auto max-w-[1280px] px-8 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Link
              aria-label={t("landing.nav.home")}
              className="flex items-center gap-3 text-xl font-bold text-[#0b1c30]"
              href="/"
            >
              {t("common:app.shortName")}
            </Link>
            <p className="mt-4 max-w-[360px] text-sm leading-6 text-[#464555]">
              {t("landing.footer.description")}
            </p>
            <div className="mt-6 flex gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;

                return (
                  <a
                    aria-label={t(`landing.footer.social.${social.key}`)}
                    className="grid size-10 place-items-center rounded-[8px] border border-[#c7c4d8] text-[#464555] transition-colors hover:border-[#3525cd] hover:text-[#3525cd]"
                    href={social.href}
                    key={social.key}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {footerGroups.map((group) => (
              <div key={group.key}>
                <h3 className="text-sm font-bold text-[#0b1c30]">
                  {t(`landing.footer.groups.${group.key}.title`)}
                </h3>
                <ul className="mt-4 space-y-3">
                  {group.links.map((item) => (
                    <li key={item}>
                      <Link className="text-sm text-[#464555] hover:text-[#3525cd]" href={footerHrefs[item]}>
                        {t(`landing.footer.links.${item}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-5 border-t border-[#c7c4d8] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#586377]">
            {t("landing.footer.copyright", { year: 2026 })}
          </p>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}

export function MarketingHomePage() {
  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#0b1c30]">
      <SiteNav />
      <HeroSection />
      <DiscoverySearchSection />
      <FeaturedBusinessesSection />
      <CategoriesSection />
      <FeaturesSection />
      <BookingWorkflowSection />
      <PricingSection />
      <TestimonialsSection />
      <FaqSection />
      <CtaSection />
      <SiteFooter />
    </main>
  );
}
