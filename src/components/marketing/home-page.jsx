"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Layers3,
  Menu,
  Search,
  Star,
  X
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { FeaturedBusinessesCarousel } from "@/components/marketing/featured-businesses-carousel";
import { PublishBookingJourney } from "@/components/marketing/publish-booking-journey";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import {
  bookingRouteConfig,
  categoryConfig,
  faqKeys,
  featureConfig,
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
        "inline-flex min-h-14 w-full items-center justify-center rounded-[12px] bg-[#3525cd] px-7 text-sm font-semibold text-white shadow-[0px_10px_15px_-3px_rgba(53,37,205,0.2),0px_4px_6px_-4px_rgba(53,37,205,0.2)] transition-colors hover:bg-[#2f22b6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3525cd]/40 dark:shadow-none sm:w-auto",
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
        "inline-flex min-h-14 w-full items-center justify-center rounded-[12px] border border-[#c7c4d8] bg-white px-7 text-sm font-semibold text-[#0b1c30] transition-colors hover:bg-[#eef4ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3525cd]/30 sm:w-auto",
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
    <header className="sticky top-0 z-50 border-b border-[#c7c4d8] bg-[#f8f9ff]/90 backdrop-blur-[6px]">
      <nav
        aria-label={t("landing.nav.ariaLabel")}
        className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between gap-4 px-6 lg:px-8"
      >
        <Link
          aria-label={t("landing.nav.home")}
          className="flex min-w-0 items-center gap-3 text-xl font-bold text-[#0b1c30]"
          href="/"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#3525cd] text-white">
            <Layers3 className="size-5" aria-hidden="true" />
          </span>
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
            <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-[#0b1c30]/35 backdrop-blur-sm md:hidden" />
            <DialogPrimitive.Content className="fixed inset-y-0 end-0 z-[80] flex w-[min(22rem,calc(100vw-2rem))] flex-col border-s border-[#c7c4d8] bg-[#f8f9ff] shadow-2xl outline-none md:hidden">
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
                  <span className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-[#3525cd] text-white">
                    <Layers3 className="size-5" aria-hidden="true" />
                  </span>
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

              <div className="flex min-h-0 flex-1 flex-col justify-between gap-8 overflow-y-auto px-5 py-6">
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
              </div>
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

  return (
    <section className="relative overflow-hidden bg-[#f8f9ff] pb-16 pt-20 sm:pb-20 sm:pt-24">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center px-8 text-center">
        <h1 className="max-w-[920px] text-[42px] font-bold leading-[1.02] text-[#0b1c30] sm:text-[56px] lg:text-[64px]">
          {t("landing.hero.title")}{" "}
          <span className="text-[#3525cd]">{t("landing.hero.titleAccent")}</span>
        </h1>

        <p className="mt-6 max-w-[690px] text-base leading-7 text-[#464555] sm:text-lg">
          {t("landing.hero.description")}
        </p>

        <div className="mt-10 flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row">
          <PrimaryLink href="/register">
            {t("landing.hero.primaryCta")}
            <ArrowRight className="ms-2 size-4" aria-hidden="true" />
          </PrimaryLink>
          <SecondaryLink href="/businesses">{t("landing.hero.secondaryCta")}</SecondaryLink>
        </div>

        <dl className="mt-12 grid w-full max-w-[820px] divide-y divide-[#d8dff0] border-y border-[#d8dff0] py-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {stats.map((stat) => (
            <div className="px-5 py-4" key={stat.label}>
              <dt className="text-2xl font-bold text-[#0b1c30]">{stat.value}</dt>
              <dd className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#586377]">
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>
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

function FeaturedBusinessesSection({ businesses }) {
  const { t } = useTranslation("public");

  return (
    <section
      className="relative overflow-hidden bg-[linear-gradient(180deg,#fbfcff_0%,#eef4ff_46%,#f8f9ff_100%)] py-24 sm:py-28"
      id="featured-businesses"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c7c4d8] to-transparent" />
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
        <FeaturedBusinessesCarousel businesses={businesses} />
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

function FeaturesSection() {
  const { t } = useTranslation("public");

  return (
    <section className="bg-[#f8fafc] py-20" id="features">
      <div className="mx-auto max-w-[1280px] px-8">
        <SectionHeader
          title={t("landing.features.title")}
          description={t("landing.features.description")}
        />

        <div className="mt-12 grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {featureConfig.map((feature) => (
            <FeatureCard feature={feature} key={feature.key} />
          ))}
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

function PublishSection() {
  const { t } = useTranslation("public");

  return (
    <section className="bg-[#f8fafc] py-20" id="publish">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <SectionHeader
          align="left"
          title={t("landing.publish.title")}
          description={t("landing.publish.description")}
        />

        <PublishBookingJourney />
      </div>
    </section>
  );
}

function PricingCard({ code }) {
  const { i18n, t } = useTranslation("public");
  const highlighted = code === "BASIC";
  const trial = code === "TRIAL";
  const features = t(`landing.pricing.plans.${code}.features`, { returnObjects: true });
  const priceCents = code === "TRIAL" ? 0 : code === "BASIC" ? 1900 : 4900;

  return (
    <article
      className={cn(
        "relative rounded-[8px] border bg-white p-8",
        highlighted ? "border-2 border-[#3525cd] lg:scale-[1.03]" : "border-[#c7c4d8]"
      )}
    >
      {highlighted ? (
        <div className="absolute left-1/2 top-[-15px] -translate-x-1/2 rounded-full bg-[#3525cd] px-6 py-1 text-xs font-medium tracking-[0.02em] text-white">
          {t("landing.pricing.popular")}
        </div>
      ) : null}
      <h3 className="text-2xl font-semibold leading-8 text-[#0b1c30]">
        {t(`landing.pricing.plans.${code}.name`)}
      </h3>
      <p className="mt-2 min-h-10 text-sm leading-5 text-[#464555]">
        {t(`landing.pricing.plans.${code}.description`)}
      </p>
      <div className="mt-4 flex items-end gap-2">
        <span className="text-4xl font-bold leading-10 text-[#0b1c30]">
          {formatPrice(priceCents, i18n.language)}
        </span>
        <span className="pb-1 text-sm font-semibold text-[#464555]">
          {trial ? t("landing.pricing.trialPeriod") : t("landing.pricing.monthPeriod")}
        </span>
      </div>

      <ul className="mt-8 space-y-3">
        {features.slice(0, 4).map((feature) => (
          <li className="flex items-center gap-2 text-sm leading-5 text-[#0b1c30]" key={feature}>
            <CheckCircle2 className="size-4 shrink-0 text-[#3525cd]" aria-hidden="true" />
            {feature}
          </li>
        ))}
      </ul>

      {highlighted ? (
        <PrimaryLink className="mt-8 min-h-[58px] w-full rounded-[8px]" href="/register">
          {t("landing.pricing.choose", { plan: t(`landing.pricing.plans.${code}.name`) })}
        </PrimaryLink>
      ) : (
        <SecondaryLink className="mt-8 min-h-[58px] w-full rounded-[8px] text-[#3525cd]" href="/register">
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

  return (
    <section className="bg-white py-20" id="pricing">
      <div className="mx-auto max-w-[1280px] px-8">
        <SectionHeader
          title={t("landing.pricing.title")}
          description={t("landing.pricing.description")}
        />

        <div className="mt-12 grid items-start gap-6 lg:grid-cols-3">
          {planOrder.map((code) => (
            <PricingCard code={code} key={code} />
          ))}
        </div>
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
              <span className="grid size-10 place-items-center rounded-[10px] bg-[#3525cd] text-white">
                <Layers3 className="size-5" aria-hidden="true" />
              </span>
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

export function MarketingHomePage({ featuredBusinesses = [] }) {
  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#0b1c30]">
      <SiteNav />
      <HeroSection />
      <DiscoverySearchSection />
      <FeaturedBusinessesSection businesses={featuredBusinesses} />
      <CategoriesSection />
      <FeaturesSection />
      <BookingWorkflowSection />
      <PublishSection />
      <PricingSection />
      <TestimonialsSection />
      <FaqSection />
      <CtaSection />
      <SiteFooter />
    </main>
  );
}
