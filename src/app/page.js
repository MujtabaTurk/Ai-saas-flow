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
  CreditCard,
  Globe2,
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
  { value: "42%", label: "fewer no-shows" },
  { value: "11h", label: "saved weekly" },
  { value: "3.8x", label: "faster follow-up" }
];

const features = [
  {
    title: "Service Management",
    description:
      "Create bookable services with pricing, duration, capacity, staff assignment, and booking rules.",
    icon: Layers3,
    accent: "from-emerald-500 to-teal-500",
    detail: "Unlimited service catalog"
  },
  {
    title: "Team Management",
    description:
      "Invite team members, assign roles, manage capacity, and keep every provider aligned.",
    icon: Users,
    accent: "from-sky-500 to-cyan-500",
    detail: "Role-aware workflows"
  },
  {
    title: "Availability Scheduling",
    description:
      "Set working hours, blocked dates, and smart slots that reflect your real operating rhythm.",
    icon: Clock3,
    accent: "from-amber-500 to-orange-500",
    detail: "Live slot generation"
  },
  {
    title: "Online Booking",
    description:
      "Publish a polished booking page where customers can choose a service, time, and provider.",
    icon: CalendarCheck,
    accent: "from-rose-500 to-pink-500",
    detail: "Self-serve conversion"
  },
  {
    title: "AI Assistant",
    description:
      "Generate service copy, answer operational questions, and turn booking data into next actions.",
    icon: Bot,
    accent: "from-violet-500 to-fuchsia-500",
    detail: "Built-in AI credits"
  },
  {
    title: "Analytics",
    description:
      "Track revenue, booking volume, customer behavior, team performance, and review trends.",
    icon: BarChart3,
    accent: "from-lime-500 to-emerald-500",
    detail: "Decision-ready reports"
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
      <h2 className="text-3xl font-bold tracking-tight text-growth-sidebar dark:text-white sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="text-base leading-7 text-slate-600 dark:text-zinc-300 sm:text-lg">
        {description}
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
          <span className="text-lg font-bold tracking-tight text-growth-sidebar dark:text-white">
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

        <div className="flex items-center gap-2 sm:gap-3">
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
          <h1 className="max-w-4xl text-5xl font-bold tracking-tight text-growth-sidebar dark:text-white sm:text-6xl lg:text-7xl">
            The booking operating system for modern service businesses
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
              <div
                key={metric.label}
                className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5"
              >
                <dt className="text-2xl font-bold tracking-tight text-growth-sidebar dark:text-white">
                  {metric.value}
                </dt>
                <dd className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
                  {metric.label}
                </dd>
              </div>
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

function FeaturesSection() {
  return (
    <section id="features" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Platform"
          title="Everything a service business needs to run bookings with confidence"
          description="ServiceFlow connects the operational details that usually live across calendars, spreadsheets, forms, payment tools, and support inboxes."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature }) {
  const Icon = feature.icon;

  return (
    <Card className="group overflow-hidden border-slate-200 bg-white/85 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-900/10 dark:border-white/10 dark:bg-white/[0.04] dark:hover:border-emerald-400/30">
      <CardContent className="p-6">
        <div
          className={cn(
            "mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
            feature.accent
          )}
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="flex min-h-52 flex-col">
          <h3 className="text-xl font-bold tracking-tight text-growth-sidebar dark:text-white">
            {feature.title}
          </h3>
          <p className="mt-3 flex-1 text-sm leading-6 text-slate-600 dark:text-zinc-300">
            {feature.description}
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm font-bold text-growth-forest dark:text-emerald-200">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {feature.detail}
          </div>
        </div>
      </CardContent>
    </Card>
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
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <SectionHeader
            align="left"
            eyebrow="Dashboard"
            title="A command center for the full customer journey"
            description="From first booking to follow-up review, every workflow sits beside the metrics that help operators make better decisions."
          />
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

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-emerald-900/10 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="grid gap-3 md:grid-cols-[1fr_0.82fr]">
            <div className="rounded-2xl bg-growth-sidebar p-5 text-white dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-100">Revenue forecast</p>
                  <p className="mt-2 text-4xl font-bold">$24.8k</p>
                </div>
                <Badge className="bg-white/15 text-white">+18%</Badge>
              </div>
              <div className="mt-8 flex h-48 items-end gap-2">
                {[42, 58, 53, 76, 69, 92, 81, 96, 88].map((height, index) => (
                  <span
                    key={`${height}-${index}`}
                    className="flex-1 rounded-t-xl bg-gradient-to-t from-emerald-400 to-sky-300"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-zinc-900">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-400/15 dark:text-rose-200">
                    <Star className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-zinc-400">
                      Review momentum
                    </p>
                    <p className="text-2xl font-bold text-growth-sidebar dark:text-white">
                      4.9 / 5
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-zinc-900">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-400/15 dark:text-sky-200">
                    <Globe2 className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-zinc-400">
                      Booking page
                    </p>
                    <p className="text-2xl font-bold text-growth-sidebar dark:text-white">
                      7.4k visits
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-zinc-900">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200">
                    <CreditCard className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-zinc-400">
                      Active subscriptions
                    </p>
                    <p className="text-2xl font-bold text-growth-sidebar dark:text-white">
                      186
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
          <h2 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
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
                  <span className="text-5xl font-bold tracking-tight text-growth-sidebar dark:text-white">
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
        <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
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
