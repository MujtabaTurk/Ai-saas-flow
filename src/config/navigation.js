export const dashboardNavigation = [
  { label: "Overview", labelKey: "navigation.overview", href: "/dashboard", iconName: "LayoutDashboard" },
  { label: "Bookings", labelKey: "navigation.bookings", href: "/dashboard/bookings", iconName: "CalendarDays" },
  { label: "Services", labelKey: "navigation.services", href: "/dashboard/services", roles: ["OWNER", "ADMIN"], iconName: "Wrench" },
  { label: "Customers", labelKey: "navigation.customers", href: "/dashboard/customers", roles: ["OWNER", "ADMIN"], iconName: "UsersRound" },
  { label: "Wallet", labelKey: "navigation.wallet", href: "/dashboard/wallet", roles: ["OWNER"], iconName: "Wallet" },
  { label: "Memberships", labelKey: "navigation.memberships", href: "/dashboard/memberships", roles: ["OWNER", "ADMIN"], iconName: "Sparkles" },
  { label: "Availability", labelKey: "navigation.availability", href: "/dashboard/availability", roles: ["OWNER", "ADMIN"], iconName: "CalendarClock" },
  { label: "Team", labelKey: "navigation.team", href: "/dashboard/team", iconName: "UserRoundCog" },
  { label: "Reviews", labelKey: "navigation.reviews", href: "/dashboard/reviews", roles: ["OWNER", "ADMIN"], iconName: "Star" },
  { label: "AI Assistant", labelKey: "navigation.aiAssistant", href: "/dashboard/ai", roles: ["OWNER", "ADMIN"], iconName: "Bot", section: "secondary" },
  { label: "Analytics", labelKey: "navigation.analytics", href: "/dashboard/analytics", roles: ["OWNER", "ADMIN"], iconName: "LayoutDashboard", section: "secondary" },
  { label: "Notifications", labelKey: "navigation.notifications", href: "/dashboard/notifications", roles: ["OWNER", "ADMIN"], iconName: "Bell", section: "secondary" },
  { label: "Billing", labelKey: "navigation.billing", href: "/dashboard/billing", roles: ["OWNER"], iconName: "CreditCard", section: "footer" },
  { label: "Settings", labelKey: "navigation.settings", href: "/dashboard/settings", roles: ["OWNER", "ADMIN"], iconName: "Settings", section: "footer" }
];

export const adminNavigation = [
  {
    label: "Overview",
    labelKey: "navigation.overview",
    href: "/admin",
    iconName: "LayoutDashboard"
  },
  {
    label: "Businesses",
    labelKey: "navigation.businesses",
    href: "/admin/businesses",
    iconName: "Building2"
  },
  {
    label: "Plans",
    labelKey: "navigation.plans",
    href: "/admin/plans",
    iconName: "CreditCard"
  },
  {
    label: "Subscriptions",
    labelKey: "navigation.subscriptions",
    href: "/admin/subscriptions",
    iconName: "Sparkles"
  },
  {
    label: "Withdrawals",
    labelKey: "navigation.withdrawals",
    href: "/admin/withdrawals",
    iconName: "Wallet"
  },
  {
    label: "Finance",
    labelKey: "navigation.finance",
    href: "/admin/finance",
    iconName: "Activity"
  },
  {
    label: "Analytics",
    labelKey: "navigation.analytics",
    href: "/admin/analytics",
    iconName: "BarChart3"
  },
  {
    label: "Notifications",
    labelKey: "navigation.notifications",
    href: "/admin/notifications",
    iconName: "Bell"
  },
  {
    label: "Activity",
    labelKey: "navigation.activity",
    href: "/admin/activity",
    iconName: "Activity"
  }
];
