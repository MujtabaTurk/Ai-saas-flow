import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Building2,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Layers3,
  LineChart,
  MessageSquare,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PLAN_CATALOG } from "@/features/billing/plan-catalog";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "ServiceFlow | AI booking software for service businesses",
  description:
    "ServiceFlow helps service businesses manage services, teams, availability, bookings, customers, reviews, subscriptions, AI workflows, and analytics in one modern SaaS platform."
};

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#testimonials", label: "Testimonials" }
];

const trustedCompanies = [
  "Luma Salon",
  "Northline Health",
  "FitLab Studio",
  "Glow Dental",
  "Cedar Spa",
  "Urban Repair"
];

const metrics = [
  { value: "42%", label: "fewer no-shows", detail: "Reminder loops", progress: 78 },
  { value: "11h", label: "saved weekly", detail: "Ops automation", progress: 64 },
  { value: "3.8x", label: "faster follow-up", detail: "AI summaries", progress: 86 }
];

const bentoFeatures = [
  {
    eyebrow: "Service engine",
    title: "Catalog, capacity, and conversion live in one layer",
    description:
      "Shape bookable services with pricing, duration, staff rules, buffers, prep notes, and customer-facing copy.",
    icon: Layers3,
    className: "lg:col-span-4 lg:row-span-2",
    accent: "from-emerald-400 via-sky-300 to-amber-300",
    visual: "service"
  },
  {
    eyebrow: "AI copilot",
    title: "Suggestions appear where operators already work",
    description:
      "Spot weak service copy, underused slots, review patterns, and follow-up tasks without leaving the dashboard.",
    icon: Bot,
    className: "lg:col-span-2",
    accent: "from-violet-400 via-fuchsia-300 to-rose-300",
    visual: "ai"
  },
  {
    eyebrow: "Team rhythm",
    title: "A live view of who can take what next",
    description:
      "Keep staff roles, service eligibility, workload, and utilization visible before the day gets messy.",
    icon: Users,
    className: "lg:col-span-2",
    accent: "from-sky-400 via-cyan-300 to-emerald-300",
    visual: "team"
  },
  {
    eyebrow: "Availability",
    title: "Scheduling logic designed for real business constraints",
    description:
      "Working hours, blocked dates, service buffers, provider calendars, and public slots stay in sync.",
    icon: Clock3,
    className: "lg:col-span-3",
    accent: "from-amber-400 via-orange-300 to-rose-300",
    visual: "availability"
  },
  {
    eyebrow: "Growth signals",
    title: "Analytics that point to the next operational move",
    description:
      "Track booking velocity, review momentum, no-shows, revenue, and capacity from the same workspace.",
    icon: BarChart3,
    className: "lg:col-span-3",
    accent: "from-lime-300 via-emerald-300 to-sky-300",
    visual: "analytics"
  }
];

const animatedStats = [
  {
    value: "284",
    suffix: "+",
    label: "bookings routed this month",
    caption: "Across public pages, staff calendars, and manual admin entries.",
    progress: 84,
    accent: "from-emerald-400 to-sky-300"
  },
  {
    value: "96",
    suffix: "%",
    label: "schedule confidence",
    caption: "Generated from availability coverage, buffer health, and assignment fit.",
    progress: 96,
    accent: "from-sky-400 to-cyan-300"
  },
  {
    value: "4.9",
    suffix: "/5",
    label: "review momentum",
    caption: "Customer feedback stays connected to booking and service history.",
    progress: 90,
    accent: "from-amber-300 to-rose-300"
  },
  {
    value: "$18.4k",
    suffix: "",
    label: "tracked revenue",
    caption: "Subscription health and booking revenue sit beside daily operations.",
    progress: 72,
    accent: "from-lime-300 to-emerald-400"
  }
];

const workflow = [
  {
    step: "01",
    title: "Create Business",
    description:
      "Add brand details, booking settings, team roles, and the foundation for your customer experience.",
    icon: Building2
  },
  {
    step: "02",
    title: "Configure Services",
    description:
      "Package services with pricing, duration, descriptions, and provider assignment.",
    icon: Settings2
  },
  {
    step: "03",
    title: "Set Availability",
    description:
      "Define working hours, unavailable periods, booking windows, and live customer-facing slots.",
    icon: Clock3
  },
  {
    step: "04",
    title: "Accept Bookings",
    description:
      "Customers book online while your team tracks confirmations, cancellations, reviews, and follow-up.",
    icon: CalendarCheck
  }
];

const dashboardHighlights = [
  "Today view for bookings, services, and team capacity",
  "Customer profiles with history, notes, and review signals",
  "Subscription and billing status built into the operating layer"
];

const aiMessages = [
  {
    role: "assistant",
    text: "I found three services with low conversion. Want revised descriptions and pricing notes?"
  },
  {
    role: "user",
    text: "Improve the haircut and color consultation listings for premium clients."
  },
  {
    role: "assistant",
    text: "Done. I also added a prep note, suggested a 15 minute buffer, and flagged two peak-time slots."
  }
];

const testimonials = [
  {
    quote:
      "ServiceFlow replaced three tools for us. Our team can see the day, customers book without calling, and AI helps us keep service pages sharp.",
    name: "Maya Chen",
    role: "Founder, Luma Salon",
    result: "31% more online bookings"
  },
  {
    quote:
      "The setup flow felt designed for real operators. Availability, staff assignment, payments, and reviews finally live in one place.",
    name: "Daniel Brooks",
    role: "Operations Lead, Northline Health",
    result: "9 hours saved weekly"
  },
  {
    quote:
      "We launched our booking page in a day. Customers get a clean experience and our managers get the analytics they needed.",
    name: "Aisha Rahman",
    role: "Owner, FitLab Studio",
    result: "4.9 average review score"
  }
];

const faqItems = [
  {
    question: "Can I use ServiceFlow for multiple service categories?",
    answer:
      "Yes. You can manage different services, durations, prices, providers, and booking rules from one workspace."
  },
  {
    question: "Does it support teams and role-based access?",
    answer:
      "Yes. Owners and admins can invite team members, assign services, manage availability, and keep access scoped to the right workflows."
  },
  {
    question: "How does the AI Assistant help?",
    answer:
      "It can draft service descriptions, analyze patterns, suggest operational improvements, and help teams move faster inside daily booking work."
  },
  {
    question: "Can customers book online without an account?",
    answer:
      "Yes. Public booking pages are designed for quick customer conversion with available slots, service details, and booking confirmation flows."
  }
];

function formatPrice(cents) {
  if (cents === 0) {
    return "Free";
  }

  return `$${cents / 100}`;
}

function SectionHeader({ eyebrow, title, description, align = "center" }) {
  return (
    <div
      className={cn(
        "mx-auto max-w-3xl space-y-4",
        align === "center" ? "text-center" : "text-left"
      )}
    >
      <Badge
        variant="outline"
        className="border-emerald-200 bg-white/70 text-growth-forest shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-emerald-200"
      >
        {eyebrow}
      </Badge>
      <h2 className="text-3xl font-bold text-growth-sidebar dark:text-white sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="text-base leading-7 text-slate-600 dark:text-zinc-300 sm:text-lg">
        {description}
      </p>
    </div>
  );
}

function HeroStat({ metric }) {
  return (
    <div
      className="group rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-900/10 dark:border-white/10 dark:bg-white/5"
      style={{ "--stat-progress": `${metric.progress}%` }}
    >
      <dt className="animate-stat-rise text-2xl font-bold text-growth-sidebar dark:text-white">
        {metric.value}
      </dt>
      <dd className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
        {metric.label}
      </dd>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
        <span className="animate-stat-bar block h-full rounded-full bg-gradient-to-r from-emerald-500 via-sky-400 to-amber-300" />
      </div>
      <p className="mt-2 text-xs font-semibold text-growth-forest dark:text-emerald-200">
        {metric.detail}
      </p>
    </div>
  );
}

function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-emerald-900/10 bg-white/75 backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/75">
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
        aria-label="Primary navigation"
      >
        <Link href="/" className="flex items-center gap-3" aria-label="ServiceFlow home">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-growth-sidebar text-white shadow-lg shadow-emerald-900/20 dark:bg-emerald-400 dark:text-zinc-950">
            <CalendarCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold text-growth-sidebar dark:text-white">
            ServiceFlow
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-slate-600 transition-colors hover:text-growth-forest dark:text-zinc-300 dark:hover:text-emerald-200"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 pr-12 sm:gap-3 sm:pr-14">
          <Button
            asChild
            variant="ghost"
            className="hidden text-growth-sidebar hover:bg-emerald-100/70 dark:text-zinc-200 dark:hover:bg-white/10 sm:inline-flex"
          >
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild className="shadow-lg shadow-emerald-700/20">
            <Link href="/register">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pb-28">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(16,185,129,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(14,165,233,0.08)_1px,transparent_1px)] bg-[size:44px_44px] animate-landing-grid dark:bg-[linear-gradient(90deg,rgba(52,211,153,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(251,191,36,0.06)_1px,transparent_1px)]" />
      <div className="absolute left-0 right-0 top-0 -z-10 h-72 bg-[linear-gradient(180deg,rgba(16,185,129,0.16),rgba(14,165,233,0.06)_48%,transparent)] dark:bg-[linear-gradient(180deg,rgba(16,185,129,0.14),rgba(251,191,36,0.05)_48%,transparent)]" />

      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.94fr_1.06fr]">
        <div className="max-w-3xl">
          <Badge className="mb-6 border border-emerald-200 bg-white/80 text-growth-sidebar shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-emerald-100">
            <Sparkles className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            AI-assisted booking operations
          </Badge>
          <h1 className="max-w-4xl text-5xl font-bold text-growth-sidebar dark:text-white sm:text-6xl lg:text-7xl">
            The{" "}
            <span className="animate-gradient-pan bg-gradient-to-r from-growth-forest via-sky-500 to-amber-500 bg-clip-text text-transparent dark:from-emerald-200 dark:via-sky-200 dark:to-amber-200">
              booking operating system
            </span>{" "}
            for modern service businesses
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-zinc-300 sm:text-xl">
            Manage services, staff, availability, bookings, customers, reviews,
            subscriptions, AI workflows, and analytics from one polished SaaS
            workspace.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 shadow-xl shadow-emerald-700/20">
              <Link href="/register">
                Start free trial
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-slate-200 bg-white/80 text-growth-sidebar shadow-sm backdrop-blur hover:bg-emerald-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              <Link href="#showcase">
                View product tour
                <ChevronRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <dl className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
            {metrics.map((metric) => (
              <HeroStat key={metric.label} metric={metric} />
            ))}
          </dl>
        </div>

        <HeroDashboardMockup />
      </div>
    </section>
  );
}

function HeroDashboardMockup() {
  const schedule = [
    { time: "09:00", service: "Wellness consultation", status: "Confirmed" },
    { time: "11:30", service: "Color refresh", status: "Assigned" },
    { time: "14:15", service: "Strategy session", status: "Paid" }
  ];

  return (
    <div className="relative mx-auto w-full max-w-3xl animate-landing-float">
      <div className="absolute -right-3 top-8 hidden rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-xl shadow-emerald-900/10 backdrop-blur dark:border-white/10 dark:bg-zinc-900/80 sm:block">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200">
            <Zap className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold text-growth-sidebar dark:text-white">
              AI suggested 4 updates
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Services, slots, reviews
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/70 bg-white/85 p-3 shadow-[0_24px_90px_rgba(6,78,59,0.22)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/85 dark:shadow-[0_24px_90px_rgba(0,0,0,0.45)]">
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-zinc-900/80">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-white/10">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-400" />
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="h-3 w-3 rounded-full bg-emerald-400" />
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-growth-forest dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Live booking page
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
            <aside className="hidden rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-950/70 lg:block">
              <div className="mb-5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-growth-sidebar dark:bg-emerald-400" />
                <div>
                  <p className="h-2.5 w-24 rounded-full bg-slate-200 dark:bg-white/20" />
                  <p className="mt-2 h-2 w-16 rounded-full bg-slate-100 dark:bg-white/10" />
                </div>
              </div>
              {["Dashboard", "Bookings", "Services", "Customers", "AI"].map((item, index) => (
                <div
                  key={item}
                  className={cn(
                    "mb-2 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold",
                    index === 0
                      ? "bg-emerald-50 text-growth-forest dark:bg-emerald-400/10 dark:text-emerald-200"
                      : "text-slate-500 dark:text-zinc-400"
                  )}
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                  {item}
                </div>
              ))}
            </aside>

            <div className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Revenue", "$18.4k", "12%"],
                  ["Bookings", "284", "31 new"],
                  ["Reviews", "4.9", "98%"]
                ].map(([label, value, change]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-950/70"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                      {label}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-growth-sidebar dark:text-white">
                      {value}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                      {change}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-950/70">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-growth-sidebar dark:text-white">
                      Today&apos;s schedule
                    </h2>
                    <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-200">
                      Smart slots
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {schedule.map((item) => (
                      <div
                        key={item.time}
                        className="grid grid-cols-[3.5rem_1fr] gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5"
                      >
                        <p className="text-sm font-bold text-growth-forest dark:text-emerald-200">
                          {item.time}
                        </p>
                        <div>
                          <p className="text-sm font-semibold text-growth-sidebar dark:text-white">
                            {item.service}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                            {item.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-950/70">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-growth-sidebar dark:text-white">
                      Utilization
                    </h2>
                    <LineChart className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                  </div>
                  <div className="flex h-40 items-end gap-2">
                    {[52, 68, 44, 76, 88, 61, 94].map((height, index) => (
                      <span
                        key={height}
                        className={cn(
                          "flex-1 rounded-t-xl",
                          index % 3 === 0
                            ? "bg-sky-400"
                            : index % 3 === 1
                              ? "bg-emerald-500"
                              : "bg-amber-400"
                        )}
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                  <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-growth-forest dark:bg-emerald-400/10 dark:text-emerald-200">
                    No unassigned bookings
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustedBySection() {
  return (
    <section className="border-y border-emerald-900/10 bg-white/70 px-4 py-8 backdrop-blur dark:border-white/10 dark:bg-white/[0.03] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
            Trusted by appointment-driven teams
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {trustedCompanies.map((company) => (
              <div
                key={company}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-bold text-slate-500 shadow-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300"
              >
                {company}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AnimatedStatsSection() {
  return (
    <section className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-white/70 bg-growth-sidebar p-2 shadow-2xl shadow-emerald-900/15 dark:border-white/10 dark:bg-zinc-950">
        <div className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))] p-5 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-4">
            {animatedStats.map((stat) => (
              <article
                key={stat.label}
                className="group rounded-2xl border border-white/10 bg-white/[0.07] p-5 text-white backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.1]"
                style={{ "--stat-progress": `${stat.progress}%` }}
              >
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100/80">
                  {stat.label}
                </p>
                <div className="mt-4 flex items-end gap-1">
                  <span className="animate-stat-rise text-4xl font-bold sm:text-5xl">
                    {stat.value}
                  </span>
                  {stat.suffix ? (
                    <span className="pb-1 text-xl font-bold text-emerald-100">
                      {stat.suffix}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 min-h-12 text-sm leading-6 text-emerald-50/75">
                  {stat.caption}
                </p>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                  <span
                    className={cn(
                      "animate-stat-bar block h-full rounded-full bg-gradient-to-r",
                      stat.accent
                    )}
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Bento operating system"
          title="Not another booking form. A connected command layer for service revenue."
          description="Each workflow has its own surface, but the data stays connected: services influence availability, availability shapes bookings, bookings enrich customers, and AI turns the pattern into action."
        />

        <div className="mt-12 grid auto-rows-[minmax(19rem,auto)] gap-5 lg:grid-cols-6">
          {bentoFeatures.map((feature) => (
            <BentoFeature key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BentoFeature({ feature }) {
  const Icon = feature.icon;

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm backdrop-blur transition-all duration-500 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-900/10 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-emerald-300/30",
        feature.className
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-80 transition-opacity duration-300 group-hover:opacity-100",
          feature.accent
        )}
      />
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-growth-forest dark:text-emerald-200">
              {feature.eyebrow}
            </p>
            <h3 className="mt-3 max-w-xl text-2xl font-bold text-growth-sidebar dark:text-white">
              {feature.title}
            </h3>
          </div>
          <span
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
              feature.accent
            )}
          >
            <Icon className="h-6 w-6" aria-hidden="true" />
          </span>
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 dark:text-zinc-300">
          {feature.description}
        </p>
        <div className="mt-6 flex-1">
          {feature.visual === "service" ? <ServiceBentoPreview /> : null}
          {feature.visual === "ai" ? <AiBentoPreview /> : null}
          {feature.visual === "team" ? <TeamBentoPreview /> : null}
          {feature.visual === "availability" ? <AvailabilityBentoPreview /> : null}
          {feature.visual === "analytics" ? <AnalyticsBentoPreview /> : null}
        </div>
      </div>
    </article>
  );
}

function ServiceBentoPreview() {
  return (
    <div className="grid gap-4 md:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-zinc-950/70">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-growth-sidebar dark:text-white">
            Premium consultation
          </p>
          <Badge className="bg-emerald-100 text-growth-forest dark:bg-emerald-400/15 dark:text-emerald-200">
            Live
          </Badge>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ["Duration", "45m"],
            ["Price", "$120"],
            ["Buffer", "15m"]
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-white p-3 dark:bg-white/5">
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                {label}
              </p>
              <p className="mt-1 text-lg font-bold text-growth-sidebar dark:text-white">
                {value}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-xl bg-white p-3 dark:bg-white/5">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-growth-forest dark:text-emerald-200">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            AI copy score improved
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <span className="animate-stat-bar block h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-400" style={{ "--stat-progress": "82%" }} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-950/70">
        <p className="text-sm font-bold text-growth-sidebar dark:text-white">
          Booking path
        </p>
        <div className="mt-4 space-y-3">
          {["Choose service", "Select provider", "Pick smart slot", "Confirm booking"].map(
            (item, index) => (
              <div key={item} className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                    index === 2
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200"
                      : "bg-emerald-100 text-growth-forest dark:bg-emerald-400/15 dark:text-emerald-200"
                  )}
                >
                  {index + 1}
                </span>
                <span className="text-sm font-semibold text-slate-600 dark:text-zinc-300">
                  {item}
                </span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function AiBentoPreview() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-zinc-950 p-4 text-white shadow-inner dark:border-white/10">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
        Action queue
      </div>
      <div className="mt-4 space-y-3">
        {[
          "Rewrite 3 low-converting services",
          "Open 2 Friday afternoon slots",
          "Ask 11 customers for reviews"
        ].map((item) => (
          <div key={item} className="rounded-xl border border-white/10 bg-white/[0.06] p-3">
            <p className="text-sm font-semibold text-zinc-100">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamBentoPreview() {
  return (
    <div className="space-y-3">
      {[
        ["Maya", "Color, consults", 92],
        ["Noah", "Repair, installs", 68],
        ["Ari", "Coaching, reviews", 81]
      ].map(([name, role, load]) => (
        <div key={name} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-zinc-950/70">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-growth-sidebar dark:text-white">{name}</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400">{role}</p>
            </div>
            <span className="text-sm font-bold text-growth-forest dark:text-emerald-200">
              {load}%
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <span
              className="animate-stat-bar block h-full rounded-full bg-gradient-to-r from-sky-400 to-emerald-400"
              style={{ "--stat-progress": `${load}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function AvailabilityBentoPreview() {
  const cells = [
    [88, 64, 72, 95],
    [42, 80, 58, 76],
    [67, 74, 91, 55]
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-zinc-950/70">
      <div className="grid grid-cols-4 gap-2">
        {["Mon", "Tue", "Wed", "Thu"].map((day) => (
          <div key={day} className="text-center text-xs font-bold text-slate-500 dark:text-zinc-400">
            {day}
          </div>
        ))}
        {cells.flat().map((value, index) => (
          <div
            key={`${value}-${index}`}
            className="h-14 overflow-hidden rounded-xl border border-white bg-white p-1 dark:border-white/10 dark:bg-white/5"
          >
            <span
              className={cn(
                "animate-stat-bar block h-full rounded-lg",
                value > 84
                  ? "bg-gradient-to-t from-emerald-500 to-lime-300"
                  : value > 68
                    ? "bg-gradient-to-t from-sky-500 to-cyan-300"
                    : "bg-gradient-to-t from-amber-400 to-rose-300"
              )}
              style={{ "--stat-progress": `${value}%`, width: "100%", transform: `scaleY(${value / 100})`, transformOrigin: "bottom" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsBentoPreview() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {animatedStats.slice(0, 3).map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-zinc-950/70"
          style={{ "--stat-progress": `${stat.progress}%` }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-zinc-400">
            {stat.label.split(" ").slice(0, 2).join(" ")}
          </p>
          <p className="mt-3 text-3xl font-bold text-growth-sidebar dark:text-white">
            {stat.value}
            <span className="text-lg text-growth-forest dark:text-emerald-200">
              {stat.suffix}
            </span>
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <span
              className={cn(
                "animate-stat-bar block h-full rounded-full bg-gradient-to-r",
                stat.accent
              )}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function WorkflowSection() {
  return (
    <section className="bg-white px-4 py-20 dark:bg-zinc-950 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="How it works"
          title="Launch a polished booking operation in four practical steps"
          description="The onboarding path is built around the sequence service businesses already understand: business, services, availability, bookings."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-4">
          {workflow.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="relative rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-white/10 dark:bg-white/[0.04]"
              >
                <span className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">
                  {item.step}
                </span>
                <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-growth-forest shadow-sm dark:bg-zinc-900 dark:text-emerald-200">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-growth-sidebar dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-zinc-300">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function DashboardShowcaseSection() {
  return (
    <section id="showcase" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <Badge
              variant="outline"
              className="border-emerald-200 bg-white/70 text-growth-forest shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-emerald-200"
            >
              Dashboard theater
            </Badge>
            <h2 className="mt-5 text-3xl font-bold text-growth-sidebar dark:text-white sm:text-4xl lg:text-5xl">
              A cockpit that keeps bookings, people, money, and AI in motion
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600 dark:text-zinc-300 sm:text-lg">
              The dashboard is designed around the way service operators scan:
              what is happening now, what needs attention, and which decision
              will improve the next booking cycle.
            </p>
            <ul className="mt-8 space-y-4">
              {dashboardHighlights.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-sm font-semibold leading-6 text-slate-700 dark:text-zinc-200"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-emerald-300/60 via-sky-300/50 to-amber-200/60 opacity-70 blur-xl dark:from-emerald-400/20 dark:via-sky-400/20 dark:to-amber-300/20" />
            <div className="relative overflow-hidden rounded-2xl border border-white/80 bg-white p-3 shadow-[0_30px_100px_rgba(6,78,59,0.2)] dark:border-white/10 dark:bg-zinc-950">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-zinc-900">
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-rose-400" />
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                    <Sparkles className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                    Ask ServiceFlow about this week&apos;s booking gaps
                  </div>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-[0.78fr_1.22fr]">
                  <aside className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-950/70">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-zinc-400">
                      Attention queue
                    </p>
                    <div className="mt-4 space-y-3">
                      {[
                        ["2 bookings need assignment", "Team"],
                        ["Friday capacity is 91%", "Availability"],
                        ["7 reviews ready to request", "Reviews"]
                      ].map(([title, label]) => (
                        <div
                          key={title}
                          className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5"
                        >
                          <p className="text-sm font-bold text-growth-sidebar dark:text-white">
                            {title}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-growth-forest dark:text-emerald-200">
                            {label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </aside>

                  <div className="grid gap-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {animatedStats.slice(0, 3).map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-950/70"
                          style={{ "--stat-progress": `${stat.progress}%` }}
                        >
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                            {stat.label.split(" ").slice(0, 2).join(" ")}
                          </p>
                          <p className="mt-2 text-2xl font-bold text-growth-sidebar dark:text-white">
                            {stat.value}
                            <span className="text-sm text-growth-forest dark:text-emerald-200">
                              {stat.suffix}
                            </span>
                          </p>
                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                            <span
                              className={cn(
                                "animate-stat-bar block h-full rounded-full bg-gradient-to-r",
                                stat.accent
                              )}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-950/70">
                        <div className="mb-4 flex items-center justify-between">
                          <p className="text-sm font-bold text-growth-sidebar dark:text-white">
                            Live booking board
                          </p>
                          <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-200">
                            14 today
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          {[
                            ["09:00", "Discovery consult", "Maya", "Paid"],
                            ["11:30", "Color refresh", "Ari", "Confirm"],
                            ["14:15", "Repair visit", "Noah", "Assigned"]
                          ].map(([time, service, member, status]) => (
                            <div
                              key={`${time}-${service}`}
                              className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-white/5"
                            >
                              <p className="text-sm font-bold text-growth-forest dark:text-emerald-200">
                                {time}
                              </p>
                              <div>
                                <p className="text-sm font-bold text-growth-sidebar dark:text-white">
                                  {service}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-zinc-400">
                                  {member}
                                </p>
                              </div>
                              <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-500 dark:bg-zinc-900 dark:text-zinc-300">
                                {status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-growth-sidebar p-4 text-white dark:bg-white dark:text-zinc-950">
                        <p className="text-sm text-emerald-100 dark:text-zinc-500">
                          Revenue pulse
                        </p>
                        <p className="mt-2 text-4xl font-bold">$24.8k</p>
                        <div className="mt-8 flex h-36 items-end gap-2">
                          {[38, 64, 52, 78, 70, 94, 82].map((height, index) => (
                            <span
                              key={`${height}-${index}`}
                              className="animate-bar-rise flex-1 rounded-t-xl bg-gradient-to-t from-emerald-300 to-sky-200"
                              style={{ "--bar-height": `${height}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["Services", "Copy, duration, price, capacity, buffers"],
            ["Customers", "History, notes, reviews, follow-up state"],
            ["Billing", "Plan status, subscription health, revenue trail"]
          ].map(([label, text]) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 bg-white/70 p-5 backdrop-blur dark:border-white/10 dark:bg-white/[0.04]"
            >
              <p className="font-bold text-growth-sidebar dark:text-white">{label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-zinc-300">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AiAssistantSection() {
  return (
    <section className="bg-zinc-950 px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div>
          <Badge className="border border-white/10 bg-white/10 text-emerald-100">
            <Bot className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            AI Assistant
          </Badge>
          <h2 className="mt-5 max-w-3xl text-3xl font-bold sm:text-4xl lg:text-5xl">
            Make every operator feel like they have a strategist on shift
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
            The assistant helps teams improve service content, spot scheduling
            issues, prepare follow-ups, and turn analytics into concrete next
            steps.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["Copy", "Draft service descriptions"],
              ["Ops", "Find scheduling gaps"],
              ["Insights", "Summarize trends"]
            ].map(([label, text]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <p className="text-sm font-bold text-emerald-200">{label}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-emerald-950/50">
          <div className="rounded-2xl bg-zinc-900 p-4">
            <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400 text-zinc-950">
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-bold">ServiceFlow AI</p>
                  <p className="text-xs text-zinc-400">Operational co-pilot</p>
                </div>
              </div>
              <Badge className="bg-emerald-400/15 text-emerald-200">Live</Badge>
            </div>

            <div className="space-y-4">
              {aiMessages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={cn(
                    "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6",
                    message.role === "assistant"
                      ? "bg-white/10 text-zinc-100"
                      : "ml-auto bg-emerald-400 text-zinc-950"
                  )}
                >
                  {message.text}
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-400">
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              Ask about bookings, services, reviews, or revenue
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section id="testimonials" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Customers"
          title="Built for teams that sell time, expertise, and trust"
          description="Service businesses use the platform to replace scattered booking tools with one calmer operating system."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.name}
              className="border-slate-200 bg-white/85 dark:border-white/10 dark:bg-white/[0.04]"
            >
              <CardContent className="flex min-h-80 flex-col p-6">
                <div className="mb-6 flex gap-1 text-amber-400" aria-label="Five star review">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-current" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="flex-1 text-base leading-7 text-slate-700 dark:text-zinc-200">
                  &quot;{testimonial.quote}&quot;
                </blockquote>
                <div className="mt-6 border-t border-slate-200 pt-5 dark:border-white/10">
                  <p className="font-bold text-growth-sidebar dark:text-white">
                    {testimonial.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
                    {testimonial.role}
                  </p>
                  <Badge className="mt-4 bg-emerald-100 text-growth-forest dark:bg-emerald-400/15 dark:text-emerald-200">
                    {testimonial.result}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const plans = ["TRIAL", "BASIC", "PRO"].map((code) => PLAN_CATALOG[code]);

  return (
    <section id="pricing" className="bg-white px-4 py-20 dark:bg-zinc-950 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Pricing"
          title="Start lean, then scale as bookings grow"
          description="Every plan includes the operating foundation. Upgrade when your team, booking volume, or AI needs expand."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.code}
              className={cn(
                "relative border-slate-200 bg-slate-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-900/10 dark:border-white/10 dark:bg-white/[0.04]",
                plan.highlighted &&
                  "border-growth-forest bg-white shadow-2xl shadow-emerald-900/10 dark:border-emerald-300/50 dark:bg-zinc-900"
              )}
            >
              {plan.highlighted ? (
                <div className="absolute right-5 top-5 rounded-full bg-growth-sidebar px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white dark:bg-emerald-300 dark:text-zinc-950">
                  Popular
                </div>
              ) : null}
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold text-growth-sidebar dark:text-white">
                  {plan.name}
                </h3>
                <p className="mt-3 min-h-12 text-sm leading-6 text-slate-600 dark:text-zinc-300">
                  {plan.description}
                </p>
                <div className="mt-7 flex items-end gap-2">
                  <span className="text-5xl font-bold text-growth-sidebar dark:text-white">
                    {formatPrice(plan.monthlyPriceCents)}
                  </span>
                  {plan.monthlyPriceCents > 0 ? (
                    <span className="pb-2 text-sm font-semibold text-slate-500 dark:text-zinc-400">
                      /month
                    </span>
                  ) : null}
                </div>

                <Button
                  asChild
                  variant={plan.highlighted ? "default" : "outline"}
                  className={cn(
                    "mt-7 w-full",
                    !plan.highlighted &&
                      "border-slate-200 bg-white text-growth-sidebar hover:bg-emerald-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                  )}
                >
                  <Link href="/register">
                    {plan.code === "TRIAL" ? "Start trial" : `Choose ${plan.name}`}
                  </Link>
                </Button>

                <ul className="mt-7 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex gap-3 text-sm font-semibold leading-6 text-slate-700 dark:text-zinc-200"
                    >
                      <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-4xl">
        <SectionHeader
          eyebrow="FAQ"
          title="Questions service operators ask before switching"
          description="Clear answers for the common concerns around bookings, teams, customers, and AI."
        />

        <div className="mt-12 space-y-4">
          {faqItems.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-bold text-growth-sidebar dark:text-white">
                {item.question}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-growth-forest transition-transform group-open:rotate-45 dark:bg-emerald-400/15 dark:text-emerald-200">
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </summary>
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-zinc-300">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
      <div className="mx-auto max-w-7xl rounded-2xl bg-growth-sidebar px-6 py-14 text-center text-white shadow-2xl shadow-emerald-900/20 dark:bg-white dark:text-zinc-950 sm:px-10 lg:px-16">
        <Badge className="bg-white/15 text-white dark:bg-zinc-950/10 dark:text-zinc-900">
          <ShieldCheck className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
          Built for real service operations
        </Badge>
        <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-bold sm:text-4xl lg:text-5xl">
          Bring bookings, customers, teams, reviews, and AI into one calm workspace
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-emerald-50 dark:text-zinc-600 sm:text-lg">
          Start with a trial, configure your services, and publish a booking
          experience your customers can trust.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="bg-white text-growth-sidebar hover:bg-emerald-50 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-800"
          >
            <Link href="/register">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="border-white/30 bg-white/10 text-white hover:bg-white/15 dark:border-zinc-950/10 dark:bg-zinc-950/5 dark:text-zinc-950 dark:hover:bg-zinc-950/10"
          >
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-emerald-900/10 bg-white px-4 py-10 dark:border-white/10 dark:bg-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-growth-sidebar text-white dark:bg-emerald-400 dark:text-zinc-950">
            <CalendarCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-bold text-growth-sidebar dark:text-white">ServiceFlow</p>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              AI-assisted booking and subscription platform.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-500 dark:text-zinc-400">
          <Link href="#features" className="hover:text-growth-forest dark:hover:text-emerald-200">
            Features
          </Link>
          <Link href="#pricing" className="hover:text-growth-forest dark:hover:text-emerald-200">
            Pricing
          </Link>
          <Link href="#testimonials" className="hover:text-growth-forest dark:hover:text-emerald-200">
            Testimonials
          </Link>
          <Link href="/login" className="hover:text-growth-forest dark:hover:text-emerald-200">
            Login
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7fbf8] text-growth-sidebar dark:bg-[#080b0a] dark:text-white">
      <SiteNav />
      <HeroSection />
      <TrustedBySection />
      <AnimatedStatsSection />
      <FeaturesSection />
      <WorkflowSection />
      <DashboardShowcaseSection />
      <AiAssistantSection />
      <TestimonialsSection />
      <PricingSection />
      <FaqSection />
      <FinalCtaSection />
      <SiteFooter />
    </main>
  );
}
