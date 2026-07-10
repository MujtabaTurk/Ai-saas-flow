import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  Instagram,
  Layers3,
  Linkedin,
  MousePointerClick,
  Rocket,
  Scissors,
  Send,
  Settings2,
  Smartphone,
  Sparkles,
  Stethoscope,
  Twitter,
  Users,
  Wrench,
  Youtube
} from "lucide-react";

export const navLinks = [
  { key: "discover", href: "/businesses" },
  { key: "featured", href: "#featured-businesses" },
  { key: "features", href: "#features" },
  { key: "pricing", href: "#pricing" },
  { key: "login", href: "/login" }
];

export const categoryConfig = [
  { key: "salons", icon: Scissors, accent: "bg-rose-50 text-rose-600" },
  { key: "gyms", icon: Dumbbell, accent: "bg-orange-50 text-orange-600" },
  { key: "clinics", icon: Stethoscope, accent: "bg-sky-50 text-sky-600" },
  {
    key: "consultants",
    icon: BriefcaseBusiness,
    accent: "bg-indigo-50 text-indigo-600"
  },
  {
    key: "coaching",
    icon: GraduationCap,
    accent: "bg-amber-50 text-amber-600"
  },
  { key: "repair", icon: Wrench, accent: "bg-slate-100 text-slate-700" },
  {
    key: "wellness",
    icon: HeartPulse,
    accent: "bg-emerald-50 text-emerald-600"
  }
];

export const featureConfig = [
  {
    key: "bookingPages",
    icon: CalendarCheck,
    accent: "bg-indigo-50 text-[#3525cd]"
  },
  {
    key: "customerProfiles",
    icon: Users,
    accent: "bg-sky-50 text-sky-600"
  },
  {
    key: "payments",
    icon: CreditCard,
    accent: "bg-emerald-50 text-emerald-600"
  },
  {
    key: "memberships",
    icon: Sparkles,
    accent: "bg-amber-50 text-amber-600"
  },
  {
    key: "analytics",
    icon: BarChart3,
    accent: "bg-cyan-50 text-cyan-600"
  },
  {
    key: "mobile",
    icon: Smartphone,
    accent: "bg-rose-50 text-rose-600"
  }
];

export const bookingRouteConfig = [
  { key: "visit", icon: MousePointerClick },
  { key: "service", icon: Layers3 },
  { key: "slot", icon: Clock3 },
  { key: "confirm", icon: CheckCircle2 },
  { key: "confirmation", icon: Send }
];

export const publishStepConfig = [
  { key: "business", icon: Building2 },
  { key: "services", icon: Settings2 },
  { key: "availability", icon: CalendarDays },
  { key: "publish", icon: Rocket },
  { key: "bookings", icon: CalendarCheck }
];

export const planOrder = ["TRIAL", "BASIC", "PRO"];
export const testimonialKeys = ["maya", "daniel", "aisha", "leo"];
export const faqKeys = [
  "booking",
  "staff",
  "online",
  "memberships",
  "payments",
  "analytics"
];

export const footerGroups = [
  {
    key: "product",
    links: ["discover", "featured", "features", "pricing", "memberships"]
  },
  { key: "company", links: ["about", "contact", "careers"] },
  { key: "resources", links: ["help", "docs", "faqs"] },
  { key: "legal", links: ["privacy", "terms"] }
];

export const footerHrefs = {
  about: "#",
  careers: "#",
  contact: "#",
  discover: "/businesses",
  docs: "#",
  faqs: "#faq",
  featured: "#featured-businesses",
  features: "#features",
  help: "#",
  memberships: "#features",
  pricing: "#pricing",
  privacy: "#",
  terms: "#"
};

export const socialLinks = [
  { key: "twitter", href: "#", icon: Twitter },
  { key: "linkedin", href: "#", icon: Linkedin },
  { key: "instagram", href: "#", icon: Instagram },
  { key: "youtube", href: "#", icon: Youtube }
];
