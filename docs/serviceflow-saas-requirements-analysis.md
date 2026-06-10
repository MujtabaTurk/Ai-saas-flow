# ServiceFlow SaaS Requirements Analysis

Senior SaaS Architect analysis based on the ServiceFlow SaaS project brief and the inspected Prisma schema snapshot.

Note: This document is a product and architecture analysis. No application code was changed.

## Architecture Basis

ServiceFlow is a multi-tenant SaaS for small service businesses. The core value is that businesses subscribe to the platform, publish a booking page, manage services, availability, bookings, and customers, while the platform owner monitors tenants, revenue, subscriptions, and platform activity.

The data model inspected during analysis already suggested a larger SaaS structure: tenants, staff, services, availability, bookings, subscriptions, payments, reviews, notifications, AI generations, and audit logs.

## 1. User Roles

| Role | Responsibilities | Decision |
|---|---|---|
| Visitor / Prospect | Views marketing page and starts signup. | Needed because SaaS acquisition begins before authentication. |
| Customer | Uses public booking page, selects service and time, pays if required, may leave reviews. | Customers are end users, not tenant admins; public and guest booking should remain low-friction. |
| Business Owner | Owns business account, subscription, profile, services, availability, bookings, and customers. | This is the paying SaaS tenant and primary dashboard user. |
| Business Admin / Manager | Helps manage bookings, services, staff, and customers. | The schema supports `BusinessRole.ADMIN`; useful once team support exists. |
| Staff Member | Has assigned services, availability, and bookings. | The schema includes staff availability and bookings, so staff should be a first-class advanced role. |
| Platform Admin | Supports tenants, monitors accounts, and handles operational issues. | The schema has `PlatformRole.ADMIN`; this avoids giving every support user super-admin power. |
| Super Admin | Manages platform-wide plans, tenants, subscriptions, revenue, suspensions, and activity. | Required by the brief as the platform owner role. |
| System Actors | Stripe webhooks, email jobs, AI provider, and notification workers. | Not human users, but they trigger important workflows and must be modeled for auditability. |

Decision: Platform roles and business roles should remain separate. A user may be a platform admin globally and a staff member or owner inside one tenant, but permissions must always be checked in the correct context.

## 2. Business Workflows

### Business Onboarding

The business owner registers, creates a business profile, claims a unique slug, sets timezone, currency, language, and chooses a trial or paid plan.

Decision: Onboarding must happen before full dashboard access because bookings require business identity, public URL, and scheduling settings.

### Subscription Lifecycle

The owner selects a plan, Stripe checkout starts, webhook confirms status, the app applies feature limits, and the billing portal handles upgrades, downgrades, and cancellations.

Decision: Stripe webhooks must be the source of truth, not the browser success page.

### Service Setup

The owner creates services with name, description, duration, price, active state, optional image/category, and payment requirement.

Decision: Public booking cannot exist without a clean service catalog.

### Availability Setup

The owner defines working days, times, slot duration, buffers, unavailable dates, and optional staff/service-specific schedules.

Decision: Availability is the constraint engine behind valid booking slots.

### Public Booking

The customer opens the business public page, chooses a service, selects date and slot, enters details, pays if required, and receives confirmation.

Decision: The public flow should not require login unless the business disables guest booking.

### Booking Management

The business views today, upcoming, completed, canceled, paid, and unpaid bookings. The business can confirm, cancel, complete, mark no-show, and add internal notes.

Decision: Booking status must be explicit because analytics, notifications, reviews, and payments depend on it.

### Customer Management

Customer records are automatically created from bookings. The owner can view booking history, notes, contact details, and marketing opt-in state.

Decision: CRM value emerges naturally from booking data, so manual customer creation is secondary.

### Team Workflow

The owner invites staff or admins, assigns roles, services, availability, and bookings.

Decision: This is advanced but strongly supported by the schema and should be gated by plan limits.

### Super Admin Workflow

The platform operator reviews businesses, users, subscriptions, revenue, failed payments, plan distribution, and audit activity.

Decision: SaaS operators need observability and control, not only customer-facing features.

### AI Assistant Workflow

The owner uses AI to draft service descriptions, replies, summaries, insights, or translations. Usage is logged against credits.

Decision: AI should assist the user and should not silently modify business data without user confirmation.

## 3. Functional Requirements

| Area | Requirement | Decision |
|---|---|---|
| Authentication and RBAC | Email/password login, Google OAuth, forgot password, protected routes, platform and business role guards. | Required because different users have different business and platform access. |
| Tenant Management | Business profile, slug, logo, contact info, timezone, currency, locale, and status. | Tenant identity powers public pages, billing, and data isolation. |
| Subscription Plans | Trial, Basic, Pro, Stripe checkout, billing portal, webhooks, and plan limits. | SaaS revenue and entitlement control depend on this. |
| Service Management | Create, edit, delete, activate/deactivate, duration, price, payment flag, and validation. | Services are the inventory customers book. |
| Availability Management | Working hours, unavailable dates, slot generation, and invalid range validation. | Prevents impossible or overlapping bookings. |
| Public Booking Page | Business display, service/date/time selection, customer form, confirmation, and optional payment. | This is the main customer-facing value proposition. |
| Booking Dashboard | Status filters, search, approve, cancel, complete, no-show, and paid/unpaid visibility. | Businesses need operational control after bookings are created. |
| Customer Management | Auto-create customers from bookings, show profile, booking history, and notes. | Avoids duplicate manual work and supports retention. |
| Payments | Subscription payments and optional one-time booking payments. | The brief requires Stripe subscriptions; booking payment is optional but commercially useful. |
| Notifications | Booking, payment, subscription, staff, and system events via in-app and email. | Email is listed as advanced, but basic confirmations are core to trust. |
| Internationalization | English, German, Arabic, Spanish, Urdu, with RTL support for Arabic and Urdu. | Required by the brief and important for public booking usability. |
| Super Admin Dashboard | Businesses, users, plans, subscriptions, revenue, activity, and account status. | Needed to operate the SaaS platform. |
| Staff Management | Invite staff, assign role, assign services, availability, and bookings. | Advanced feature, but the schema already anticipates it. |
| Reviews | Customer submits review after completed booking; business moderates and publishes. | Should depend on completed bookings to reduce spam. |
| AI Assistant | Generate descriptions, copy, replies, summaries, insights, and track tokens/costs/credits. | Must be metered because AI has direct cost. |
| Audit Logs | Record create, update, delete, login, invite, payment, and AI actions. | Required for admin trust, debugging, and abuse investigation. |

## 4. Non-Functional Requirements

| Requirement | Decision |
|---|---|
| Tenant isolation | Every tenant-owned record must be scoped by `businessId`; this is the highest-risk SaaS boundary. |
| Security | Enforce RBAC server-side, validate inputs, hash passwords, verify Stripe webhooks, and protect PII. |
| Data integrity | Prevent double-booking, use idempotent payment/webhook handling, and maintain booking/payment status consistency. |
| Performance | Public booking and dashboard lists should be fast; use indexes, pagination, and cached reads where safe. |
| Reliability | Booking, payment, and notification flows need retries and clear failure states because they affect revenue and trust. |
| Scalability | Design around many businesses with separate services, bookings, customers, and staff. |
| Observability | Logs, audit events, payment event tracking, and admin dashboards are required to operate the SaaS. |
| Accessibility | Public booking and dashboards should target WCAG 2.1 AA. |
| Localization | Locale, timezone, currency, date/time format, and RTL layout must be handled consistently. |
| Maintainability | Feature modules should remain separated: auth, tenants, billing, bookings, services, customers, admin, and AI. |
| Privacy | Support customer consent, data export/deletion, and restricted access to customer notes/contact data. |
| AI governance | Log prompts, outputs, costs, and require user approval before publishing AI content. Enforce credit limits. |

## 5. SaaS-Specific Requirements

| SaaS Requirement | Why |
|---|---|
| Multi-tenancy by business | One platform serves many independent businesses. |
| Tenant lifecycle | Active, suspended, and archived states are needed for billing failures, abuse, and offboarding. |
| Plan entitlements | Limits like max staff, services, bookings, and AI credits must be enforced centrally. |
| Subscription source of truth | Stripe webhook state should drive local subscription state. |
| Billing portal | Customers need self-service upgrade, downgrade, cancellation, and invoice management. |
| Usage metering | AI credits, booking counts, staff count, and service count influence pricing and limits. |
| Public tenant branding | Each business needs a shareable booking page with its own slug and profile. |
| Platform operations | Super admin needs MRR, churn, failed payments, signups, active tenants, and plan mix. |
| Per-tenant auditability | Support and debugging require knowing who changed what inside each business. |
| Data portability | Businesses should eventually export bookings and customers for trust and compliance. |

## 6. Feature Dependency Map

| Feature | Depends On | Enables |
|---|---|---|
| Authentication | User model and session handling. | Owner dashboard, admin dashboard, and RBAC. |
| RBAC | Authentication, platform roles, and business roles. | Protected routes and safe tenant operations. |
| Business onboarding | Authentication, business model, and slug validation. | Public page, subscription, and dashboard. |
| Subscription billing | Business, plans, Stripe, and webhooks. | SaaS monetization and feature limits. |
| Feature limits | Plans, subscription status, and usage counts. | Staff, service, booking, and AI gating. |
| Service management | Business, RBAC, and plan limits. | Availability and public booking. |
| Availability | Business, services, and optional staff. | Slot generation. |
| Public booking page | Active business, active services, and availability. | Customer records, bookings, and optional payment. |
| Booking creation | Public page, slot validation, and customer form. | Dashboard, notifications, reviews, and analytics. |
| Booking payments | Booking, service price, and Stripe. | Paid bookings and revenue tracking. |
| Customer management | Booking creation. | CRM, history, and marketing opt-in. |
| Booking dashboard | Bookings, RBAC, customer data, and service data. | Operations and status control. |
| Notifications | Booking, payment, and subscription events. | Customer trust and business alerts. |
| Super admin dashboard | Tenants, users, subscriptions, payments, and audit logs. | Platform operations. |
| Staff management | Business RBAC and plan limits. | Staff scheduling and assignment. |
| Reviews | Completed bookings and customers. | Public trust signals. |
| AI assistant | Business data, plan credits, and AI logs. | Better copy, insights, replies, summaries, and translations. |
| Analytics | Bookings, payments, customers, and subscriptions. | Business and platform reporting. |
| Internationalization | Locale files and UI routing/layout. | International public, customer, and admin experience. |

## MVP Cut

Build first:

- Authentication and RBAC
- Business onboarding
- Subscriptions and billing webhooks
- Service management
- Availability management
- Public booking page
- Booking and customer dashboard
- Basic notifications
- Super admin overview
- Internationalization foundation

Defer or gate:

- AI assistant
- Staff workflows
- Reviews
- Analytics charts
- CSV export
- SMS notifications
- Social OAuth
- Advanced revenue reporting

Decision: These deferred features are valuable, but they depend on stable core booking and billing flows. A 2-3 week MVP should prove the tenant, subscription, public booking, and dashboard loop before adding advanced layers.
