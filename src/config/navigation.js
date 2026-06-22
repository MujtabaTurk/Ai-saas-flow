export const dashboardNavigation = [
  { label: "Dashboard", labelKey: "navigation.dashboard", href: "/dashboard" },
  { label: "Analytics", labelKey: "navigation.analytics", href: "/dashboard/analytics", roles: ["OWNER", "ADMIN"] },
  { label: "Services", labelKey: "navigation.services", href: "/dashboard/services", roles: ["OWNER", "ADMIN"] },
  { label: "Memberships", labelKey: "navigation.memberships", href: "/dashboard/memberships", roles: ["OWNER", "ADMIN"] },
  { label: "Bookings", labelKey: "navigation.bookings", href: "/dashboard/bookings" },
  { label: "Customers", labelKey: "navigation.customers", href: "/dashboard/customers", roles: ["OWNER", "ADMIN"] },
  { label: "Reviews", labelKey: "navigation.reviews", href: "/dashboard/reviews", roles: ["OWNER", "ADMIN"] },
  { label: "AI Assistant", labelKey: "navigation.aiAssistant", href: "/dashboard/ai", roles: ["OWNER", "ADMIN"] },
  { label: "Notifications", labelKey: "navigation.notifications", href: "/dashboard/notifications", roles: ["OWNER", "ADMIN"] },
  { label: "Availability", labelKey: "navigation.availability", href: "/dashboard/availability", roles: ["OWNER", "ADMIN"] },
  { label: "Team", labelKey: "navigation.team", href: "/dashboard/team" },
  { label: "Billing", labelKey: "navigation.billing", href: "/dashboard/billing", roles: ["OWNER"] },
  { label: "Settings", labelKey: "navigation.settings", href: "/dashboard/settings", roles: ["OWNER", "ADMIN"] }
];

export const adminNavigation = [
  { label: "Overview", labelKey: "navigation.overview", href: "/admin" },
  { label: "Businesses", labelKey: "navigation.businesses", href: "/admin/businesses" },
  { label: "Users", labelKey: "navigation.users", href: "/admin/users" },
  { label: "Plans", labelKey: "navigation.plans", href: "/admin/plans" },
  { label: "Subscriptions", labelKey: "navigation.subscriptions", href: "/admin/subscriptions" },
  { label: "Activity", labelKey: "navigation.activity", href: "/admin/activity" }
];
