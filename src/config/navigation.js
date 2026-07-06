import {
  Bell,
  Bot,
  CalendarClock,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Settings,
  Sparkles,
  Star,
  UsersRound,
  UserRoundCog,
  Wrench
} from "lucide-react";

export const dashboardNavigation = [
  { label: "Overview", labelKey: "navigation.overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Bookings", labelKey: "navigation.bookings", href: "/dashboard/bookings", icon: CalendarDays },
  { label: "Services", labelKey: "navigation.services", href: "/dashboard/services", roles: ["OWNER", "ADMIN"], icon: Wrench },
  { label: "Customers", labelKey: "navigation.customers", href: "/dashboard/customers", roles: ["OWNER", "ADMIN"], icon: UsersRound },
  { label: "Memberships", labelKey: "navigation.memberships", href: "/dashboard/memberships", roles: ["OWNER", "ADMIN"], icon: Sparkles },
  { label: "Availability", labelKey: "navigation.availability", href: "/dashboard/availability", roles: ["OWNER", "ADMIN"], icon: CalendarClock },
  { label: "Team", labelKey: "navigation.team", href: "/dashboard/team", icon: UserRoundCog },
  { label: "Reviews", labelKey: "navigation.reviews", href: "/dashboard/reviews", roles: ["OWNER", "ADMIN"], icon: Star },
  { label: "AI Assistant", labelKey: "navigation.aiAssistant", href: "/dashboard/ai", roles: ["OWNER", "ADMIN"], icon: Bot, section: "secondary" },
  { label: "Analytics", labelKey: "navigation.analytics", href: "/dashboard/analytics", roles: ["OWNER", "ADMIN"], icon: LayoutDashboard, section: "secondary" },
  { label: "Notifications", labelKey: "navigation.notifications", href: "/dashboard/notifications", roles: ["OWNER", "ADMIN"], icon: Bell, section: "secondary" },
  { label: "Billing", labelKey: "navigation.billing", href: "/dashboard/billing", roles: ["OWNER"], icon: CreditCard, section: "footer" },
  { label: "Settings", labelKey: "navigation.settings", href: "/dashboard/settings", roles: ["OWNER", "ADMIN"], icon: Settings, section: "footer" }
];

export const adminNavigation = [
  { label: "Overview", labelKey: "navigation.overview", href: "/admin" },
  { label: "Businesses", labelKey: "navigation.businesses", href: "/admin/businesses" },
  { label: "Users", labelKey: "navigation.users", href: "/admin/users" },
  { label: "Plans", labelKey: "navigation.plans", href: "/admin/plans" },
  { label: "Subscriptions", labelKey: "navigation.subscriptions", href: "/admin/subscriptions" },
  { label: "Activity", labelKey: "navigation.activity", href: "/admin/activity" }
];
