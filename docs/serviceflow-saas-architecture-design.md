# ServiceFlow SaaS Architecture Design

Tech stack:

- Next.js
- Prisma
- MongoDB
- NextAuth
- Stripe
- React Query
- Formik
- Yup

Note: This document is an architecture design only. No application code was changed.

## High Level Architecture

ServiceFlow should use a layered Next.js architecture.

| Layer | Responsibility | Technology |
|---|---|---|
| Presentation | Landing page, auth screens, dashboards, public booking page. | Next.js, Tailwind/shadcn UI |
| Client State | Server API caching, mutations, loading states, and error states. | React Query |
| Forms | Login, onboarding, services, availability, and booking forms. | Formik, Yup |
| API Layer | Business logic endpoints and tenant-scoped operations. | Next.js API routes |
| Auth Layer | Login, OAuth, sessions, and role checks. | NextAuth |
| Data Layer | SaaS entities and relations. | Prisma |
| Database | Multi-tenant persistence. | MongoDB |
| Billing Layer | Subscriptions, invoices, and booking payments. | Stripe |
| External Services | Email, AI, analytics, and future integrations. | Provider-based integrations |

Decision: keep all backend logic inside Next.js API routes instead of adding Express. The assignment explicitly wants the built-in Next.js API structure, and for an MVP this keeps deployment and architecture simpler.

## System Components

| Component | Purpose |
|---|---|
| Public Website | Explains the product and sends businesses to signup. |
| Auth Module | Handles login, OAuth, password reset, and session creation. |
| Business Dashboard | Main workspace for business owners, admins, and staff. |
| Public Booking Page | Customer-facing page per business slug. |
| Super Admin Dashboard | Platform owner view for businesses, plans, subscriptions, and activity. |
| Billing Service | Creates Stripe checkout sessions and handles webhooks. |
| Booking Service | Validates availability, creates bookings, and updates statuses. |
| Notification Service | Sends booking, payment, and subscription emails or in-app alerts. |
| Tenant Guard | Ensures users only access allowed business data. |
| Audit Logger | Records sensitive actions for debugging and accountability. |

## Data Flow Diagram

```text
Customer
  -> Public Booking Page
  -> Next.js API
  -> Tenant Resolver by business slug
  -> Booking Validation
  -> MongoDB via Prisma
  -> Optional Stripe Payment
  -> Booking Confirmation
  -> Notification Email

Business Owner
  -> NextAuth Login
  -> Dashboard
  -> React Query API Calls
  -> RBAC + Tenant Guard
  -> Prisma
  -> MongoDB

Stripe
  -> Webhook API
  -> Verify Signature
  -> Update Subscription / Payment
  -> Apply Plan Limits
  -> Notify Business / Super Admin

Super Admin
  -> Admin Dashboard
  -> Platform APIs
  -> Aggregate Tenant, Revenue, Subscription, Activity Data
```

Decision: public booking resolves tenant by `businessSlug`; dashboard routes resolve tenant by authenticated membership. This keeps customer flows simple and admin flows secure.

## Folder Structure

```text
src/
  app/
    (public)/
      page
      [businessSlug]/
    (auth)/
      login
      register
      forgot-password
    (dashboard)/
      dashboard
      services
      bookings
      customers
      availability
      settings
      billing
    (admin)/
      admin
      businesses
      users
      plans
      subscriptions
    api/
      auth/
      businesses/
      services/
      availability/
      bookings/
      customers/
      billing/
      webhooks/
      admin/
      public/
  components/
    ui/
    layout/
    forms/
    tables/
    states/
  features/
    auth/
    businesses/
    billing/
    bookings/
    customers/
    services/
    availability/
    admin/
    notifications/
    tenants/
  lib/
    prisma
    auth
    stripe
    api
    query-client
    permissions
    validators
  hooks/
  config/
  constants/
  i18n/
prisma/
  schema.prisma
docs/
```

Decision: organize by feature, not by file type only. ServiceFlow has many SaaS domains, so `features/bookings`, `features/billing`, and `features/tenants` keep logic easier to maintain.

## API Architecture

| API Group | Example Routes | Responsibility |
|---|---|---|
| Auth | `/api/auth/[...nextauth]` | NextAuth sessions and OAuth. |
| Public Business | `/api/public/businesses/:slug` | Load public profile, active services, and booking settings. |
| Public Booking | `/api/public/businesses/:slug/bookings` | Create customer booking from public page. |
| Businesses | `/api/business/current`, `/api/business/settings` | Current tenant profile and settings. |
| Services | `/api/services`, `/api/services/:id` | CRUD services with plan-limit checks. |
| Availability | `/api/availability`, `/api/availability/slots` | Manage schedules and generate available slots. |
| Bookings | `/api/bookings`, `/api/bookings/:id/status` | Dashboard booking list and status changes. |
| Customers | `/api/customers`, `/api/customers/:id` | Customer records, notes, and booking history. |
| Billing | `/api/billing/checkout`, `/api/billing/portal` | Stripe checkout and billing portal sessions. |
| Webhooks | `/api/webhooks/stripe` | Stripe subscription and payment event processing. |
| Admin | `/api/admin/businesses`, `/api/admin/stats` | Super admin platform operations. |

Decision: split public APIs from dashboard APIs. Public APIs use slug-based tenant lookup and limited fields; dashboard APIs require authenticated membership and can return private business data.

## API Rules

All dashboard APIs must require a valid session.

All tenant APIs must require `businessId` scoping.

All writes must validate input with Yup or server-side validation schemas.

All billing changes must be confirmed by Stripe webhooks.

All sensitive actions should create audit logs.

All list endpoints should support pagination, filtering, and sorting.

## Multi Tenant Strategy

Use shared database, shared collections, tenant-scoped records.

| Strategy | Decision |
|---|---|
| Tenant identifier | `businessId` is the primary tenant boundary. |
| Public tenant lookup | Use unique `business.slug`. |
| Authenticated tenant lookup | Use owner or staff membership. |
| Data isolation | Every tenant-owned query must include `businessId`. |
| Access control | Check both user session and business role. |
| Platform access | Super Admin can query across tenants through admin-only APIs. |
| Tenant status | `ACTIVE`, `SUSPENDED`, and `ARCHIVED` control access. |
| Plan limits | Enforced before creating services, staff, bookings, or AI usage. |
| Billing state | Subscription status decides whether tenant features remain available. |
| Auditability | Every create, update, delete, payment, and AI action stores business and actor context. |

Decision: shared MongoDB with `businessId` scoping is best for this MVP. Separate databases per tenant would be heavier than needed for a 2-3 week SaaS build.

## Request Lifecycle Examples

Business dashboard request:

```text
User request
-> NextAuth session check
-> Resolve current business
-> Verify business membership role
-> Check tenant status/subscription
-> Validate request
-> Query Prisma with businessId
-> Return tenant-scoped response
```

Public booking request:

```text
Customer request
-> Resolve business by slug
-> Check business is active
-> Load active services and availability
-> Validate selected slot
-> Create/update customer
-> Create booking
-> Optional Stripe payment
-> Send confirmation
```

## Core Architectural Principle

Every feature must answer three questions before implementation:

1. Which tenant owns this data?
2. Which role is allowed to perform this action?
3. Does the current subscription plan allow it?
