# ServiceFlow Wallet System — Technical Documentation

## 1. Document ka maqsad aur audit scope

Yeh document is project mein maujood wallet, treasury, settlement, withdrawal, booking-payment, Stripe aur finance/analytics implementation ko describe karta hai. Is mein generic wallet design ya future recommendations shamil nahin hain. Jahan koi cheez project mein implement nahin mili, usay seedha **maujood nahin** kaha gaya hai.

Project Next.js App Router, Prisma aur MongoDB use karta hai. Prisma schema ke tamam IDs Mongo ObjectId hain. Amounts integer cents/credits ki surat mein store hotay hain; UI formatting amount ko money ki tarah dikhati hai.

## 2. Architecture map

```text
Customer
  ↓
Public booking payment API
  ↓
Stripe Checkout / manual business-location payment
  ↓
Stripe webhook ya checkout reconciliation
  ↓
BookingPayment = SUCCEEDED
  ↓
Business Wallet: pendingCredits + WalletTransaction(PAYMENT)
  ↓ booking status COMPLETED
Settlement service
  ↓
Business Wallet: pendingCredits → availableCredits
Platform Wallet: pending liability → available liability
  ↓
Withdrawal request
  ↓
Business Wallet: availableCredits → holdCredits
  ↓ admin APPROVE / REJECT
  ├─ APPROVE: request state only
  ├─ REJECT: holdCredits → availableCredits
  └─ PAID: holdCredits → withdrawnCredits
              + Platform Treasury payout
```

## 3. System ke main concepts

### Business Wallet

Project mein alag `BusinessWallet` model nahin hai. Business ka wallet `Wallet` model hai, jiska `businessId` unique hai. Yeh business owner ke earned booking credits aur unki settlement/withdrawal states rakhta hai.

### Platform Treasury Wallet

Platform ka central wallet `PlatformWallet` model hai. Is ka single logical record `key = "PLATFORM"` se identify hota hai. Is mein collected amount, business liability aur paid-out amount ke aggregate counters hotay hain. Detailed movements `PlatformWalletTransaction` mein hoti hain.

### State counters

- `pendingCredits`: successful payment mil chuki hai, lekin booking complete nahin hui.
- `availableCredits`: completed booking ke baad withdrawal ke liye usable amount.
- `holdCredits`: withdrawal request ki wajah se temporarily reserved amount.
- `withdrawnCredits`: paid withdrawal ki cumulative amount.
- `lifetimeCredits`: wallet ko credited booking amount ka cumulative counter.
- `monthlyRevenue`: payment credit ke waqt increment hone wala cumulative field; code isay reset nahin karta.

## 4. File-level audit

### Wallet core files

| File path | Purpose | Kahan/kaun use karta hai | Return | Database collections |
|---|---|---|---|---|
| `src/features/wallet/crediting.js` | Successful booking payment ko business wallet aur platform treasury mein post karta hai. | `features/bookings/payment.js`, Stripe webhook. | `{ credited, duplicate?, treasuryCredited? }`; invalid context/status par reason. | `Business` read; `Wallet`, `WalletTransaction`, `PlatformWallet`, `PlatformWalletTransaction`, `AuditLog` write/read. |
| `src/features/wallet/settlement.js` | Completed booking ki pending earning ko available banata hai. | `src/app/api/bookings/[bookingId]/status/route.js`. | `{ settled, amount, walletId, walletTransactionId }` ya skip reason. | `WalletTransaction`, `Wallet`, `PlatformWallet`, `PlatformWalletTransaction`, `AuditLog`. |
| `src/features/wallet/withdrawals.js` | Withdrawal create, list, approve, reject aur paid processing. | Business dashboard aur admin withdrawal routes. | Serialized withdrawal object ya list; errors domain/API errors hotay hain. | `Business`, `Wallet`, `WithdrawalRequest`, `AuditLog`, `PlatformWallet`, `PlatformWalletTransaction`. |
| `src/features/wallet/treasury.js` | Platform treasury ke credit, settlement aur payout operations. | Crediting, settlement aur withdrawal services; finance dashboard. | Treasury action ka result aur treasury overview. | `PlatformWallet`, `PlatformWalletTransaction`, `AuditLog`. |
| `src/features/wallet/api.js` | Frontend fetch wrappers. | Wallet dashboard component. | Wallet, transactions/pagination, withdrawals ya fallback empty values. | Direct database touch nahin; API endpoints call karta hai. |
| `src/features/wallet/components/wallet-dashboard.jsx` | Business owner ko balance, transactions aur withdrawal UI deta hai. | Dashboard wallet page. | React UI. | Direct database touch nahin; wallet API wrappers use karta hai. |

### Payment, finance aur analytics files

| File path | Purpose | Kahan/kaun use karta hai | Return | Database collections |
|---|---|---|---|---|
| `src/features/bookings/payment.js` | Public booking payment context, Stripe Checkout, manual payment selection, reconciliation aur owner payment confirmation. | Public payment route, owner booking payment route, Stripe webhook. | Booking/payment objects, checkout URL, already-paid result ya errors. | `Business`, `Booking`, `BookingPayment`, `BookingPaymentAudit`, plus wallet services ke collections. |
| `src/app/api/webhooks/stripe/route.js` | Stripe signature verify, webhook idempotency aur Stripe event dispatch. | Stripe external service POST karta hai. | `{ received: true }`, duplicate response, ya error. | `StripeWebhookEvent`, `BookingPayment`, `Booking`, subscription/membership collections; booking payment events par wallet collections indirectly. |
| `src/features/admin/finance.js` | Finance overview, withdrawal filters aur CSV/XLS export rows. | Admin finance page/routes. | Aggregated overview, filtered requests, export rows. | `Wallet`, `WithdrawalRequest`, `BookingPayment`, `Business`, `User`, `PlatformWallet`. |
| `src/features/analytics/intelligence.js` | Business aur platform analytics; Mongo aggregation aur 30-second Next cache. | `/api/analytics/intelligence`, `/api/admin/analytics`. | Revenue, bookings, customers, withdrawals, treasury aur trend data. | Raw Mongo aggregation: `Booking`, `BookingPayment`, `Customer`, `Business`, `WithdrawalRequest`; Prisma read `Wallet`, `PlatformWallet`. |
| `src/features/analytics/metrics.js` | Business booking analytics aur comparison metrics. | `/api/analytics`. | Overview, status distribution, trends, services, customers/reviews; advanced plan par demand/team data. | `Booking`, `Customer`, `Review`, `BusinessMembership`, `User`. Wallet balance is file se read nahin hota. |
| `src/features/analytics/server.js` | Analytics context, tenant access, plan entitlement aur period validation. | Analytics routes/pages. | Access object ya authorized business context. | `Business`, `Subscription`; auth/permission services. |
| `src/lib/prisma.js` | Prisma client singleton. | Saare server-side Prisma modules. | Shared `prisma` client. | Direct collection operation nahin; client provide karta hai. |
| `src/lib/mongodb.js` | Mongo ObjectId format validation. | Analytics/business selection validation. | Boolean. | Direct database touch nahin. |
| `src/features/billing/stripe.js` | Stripe client/configuration, webhook secret aur base URL. | Booking payment aur webhook. | Stripe client/config values. | Direct Prisma collection touch nahin. |

### Scripts aur background behavior

| File path | Purpose | Kaise run hota hai | Return/asar | Collections |
|---|---|---|---|---|
| `scripts/backfill-wallet-settlements.mjs` | Historical wallet payment transactions ke settlement markers aur treasury settlement repair. | Manual npm script `wallet:settle-backfill`; automatic cron nahin. | Console result; transactional repairs. | `Booking`, `BookingPayment`, `WalletTransaction`, `Wallet`, `PlatformWallet`, `PlatformWalletTransaction`, `AuditLog`. |
| `scripts/backfill-platform-treasury.mjs` | Historical successful booking payments se missing wallet/treasury credits create karta hai. | Manual script; package script mein named entry nahin. | Console counters. | `BookingPayment`, `Wallet`, `WalletTransaction`, `PlatformWallet`, `PlatformWalletTransaction`, `AuditLog`. |
| `scripts/repair-wallet-settlement-dates.mjs` | Existing wallet settlement records ke date-related Mongo repair ke liye script. | Manual execution. | Console result. | Raw Mongo command; wallet settlement collection(s). |
| `scripts/verify-analytics-aggregations.mjs` | Analytics aggregation sanity check aur treasury snapshot verification. | Manual execution. | Console JSON report. | `Business`, `BookingPayment`, `Booking`, `WithdrawalRequest`, raw aggregates, `PlatformWallet`. |
| `package.json` | Build/run commands define karta hai. | `next`, Prisma aur manual maintenance scripts. | Process exit/status. | Indirect. |

Project mein wallet settlement ya payout ke liye scheduled cron, queue worker, recurring background process ya separate job runner nahin mila. Settlement request ke andar synchronous Prisma transaction mein hoti hai. Notifications best-effort queue/event service ko di jati hain, lekin wallet balance update us notification par depend nahin karta.

## 5. Function-level audit

### `src/features/wallet/crediting.js`

| Function | Input | Output | Side effects / related APIs |
|---|---|---|---|
| `logWalletCredit` | Stage aur details. | `undefined`. | Console JSON logging. |
| `creditWalletForBookingPayment` | `{ booking, payment }`; payment `SUCCEEDED` hona chahiye. | Credit result; duplicate idempotency par duplicate result. | Business owner verify; transaction mein wallet upsert, `PAYMENT` transaction, pending/lifetime/monthly counters aur treasury credit. Called by Checkout reconciliation, PaymentIntent success aur owner confirm flows. |

### `src/features/wallet/settlement.js`

| Function | Input | Output | Side effects / related APIs |
|---|---|---|---|
| `settlementLog` | Event/details. | `undefined`. | Console logging. |
| `settleWalletForCompletedBooking` | Active Prisma transaction aur completed booking. | Settled result ya `booking_not_completed`, `no_unsettled_payment`, `invalid_amount`, duplicate reason. | Payment transaction ko `settledAt` deta hai; pending se available move; treasury liability settle; wallet `SETTLEMENT` marker create. Called by booking status PATCH. |

### `src/features/wallet/treasury.js`

| Function | Input | Output | Side effects |
|---|---|---|---|
| `getPlatformWallet` | Prisma client/transaction. | `PlatformWallet` record. | `key=PLATFORM` wallet upsert. |
| `writeTreasuryAudit` | Action, target, amount/reference, optional actor/business. | `undefined`. | `AuditLog` create. |
| `creditPlatformTreasury` | Positive integer amount, reference aur unique idempotency key. | `{ credited, walletId }` ya duplicate/invalid result. | Collected, pending liability aur current balance increment; `CREDIT` movement/audit. |
| `settlePlatformTreasury` | Settlement amount/reference/key. | `{ settled, walletId }` ya duplicate/invalid result. | Pending liability decrement, available liability increment; `SETTLEMENT` movement/audit. Current balance is stage par change nahin hota. |
| `payoutPlatformTreasury` | Payout amount/reference/key, optional actor/business. | `{ paid, walletId }` ya duplicate/invalid result. | Current treasury aur available liability decrement; paid-out increment; `PAYOUT` movement/audit. |
| `getTreasuryOverview` | None. | Platform wallet snapshot. | Missing platform wallet ho to upsert. |

### `src/features/wallet/withdrawals.js`

| Function | Input | Output | Side effects |
|---|---|---|---|
| `auditAction` | Status suffix. | Audit action string. | None. |
| `serializeWithdrawal` | Withdrawal record. | Safe response object. | None. |
| `assertPositiveAmount` | Integer amount. | None; invalid par 422. | None. |
| `createAudit` | Prisma transaction, action, request, actor, metadata. | None. | `AuditLog` create. |
| `createWithdrawalRequest` | Owner user, positive amount, notes, idempotency key. | Serialized request. | Available balance reserve karke hold mein move; request aur CREATED audit create. Duplicate key existing request return karta hai. |
| `getBusinessWithdrawalRequests` | Owner user. | Us business ki newest-first list. | Read only. |
| `getAdminWithdrawalRequests` | Optional status. | Admin list. | Read only. |
| `getRequestForAction` | Transaction aur request ID. | Request with business. | Not found par error. |
| `releaseWithdrawalHold` | Transaction aur request. | Recovery status. | Hold ko available mein release; legacy zero-hold request ka one-time recovery path bhi hai. |
| `processWithdrawalRequest` | Super admin, request ID, `APPROVE`/`REJECT`/`PAID`, notes. | Updated serialized request. | Approve state/audit; reject hold release/state/audit; paid wallet deduction, treasury payout, state/audit. |

### `src/features/bookings/payment.js`

| Function | Input | Output | Main effect |
|---|---|---|---|
| `getPublicBookingPaymentContext` | Business slug, booking number, customer token. | Business + booking/payment. | Token access verify; read only. |
| `createBookingCheckoutSession` | Public booking context + request. | Checkout URL, already-paid result ya booking. | `BookingPayment` create/update; Stripe Checkout session create; metadata mein booking/business IDs. |
| `reconcileBookingCheckoutSession` | Stripe session ID, business ID, booking ID. | Booking + succeeded payment. | Stripe session amount/currency/metadata verify; payment SUCCEEDED; booking CONFIRMED; wallet credit call. |
| `createBookingPaymentIntent` | Any args. | Error 410. | Deprecated flow explicitly reject hota hai. |
| `chooseBookingPaymentMethod` | Public context + `BUSINESS_LOCATION`. | Booking + pending payment. | Manual payment method aur booking CONFIRMED; wallet credit nahin hota jab tak owner confirm na kare. |
| `finalizeBookingCardPayment` | Public context + PaymentIntent ID. | Booking + payment. | Stripe intent verify; payment/booking update; wallet credit. |
| `updateOwnerBookingPayment` | Booking/business/actor, `CONFIRM` ya `UNPAID`, notes. | Booking + payment + recent audits. | Payment audit create; CONFIRM par wallet credit. |
| `normalizeStripeError` | Stripe error. | `AppError`. | Stripe error ko API-safe message mein convert karta hai. |

### Finance/analytics functions

- `getFinanceOverview`: tamam wallets, withdrawals, successful booking payments aur platform wallet read karke totals, revenue by month/business aur payout lists return karta hai.
- `filterFinanceRequests`: status ke mutabiq finance request list filter karta hai.
- `toFinanceExportRows`: revenue ya withdrawal data ko tabular CSV/XLS rows mein map karta hai.
- `getAnalyticsRange`: days se UTC start/end range banata hai.
- `getBusinessIntelligence`: cached business analytics call; underlying `computeBusinessIntelligence` Mongo aggregation aur wallet snapshot read karta hai.
- `getPlatformIntelligence`: cached platform analytics call; revenue, booking, business, withdrawals aur treasury snapshot return karta hai.
- `computeBusinessIntelligence` / `computePlatformIntelligence`: internal aggregation workers; direct API nahin.
- `aggregate`, `facetResult`, `businessMatch`, `dateRangeMatch`, `andMatch`, `revenueFacets`, `normalizeSeries`: Mongo aggregation pipeline helpers.
- `buildBusinessAnalytics`: Prisma-based booking/customer/review analytics; wallet data ka source nahin.
- `requireAnalyticsContext`, `buildAnalyticsAccess`, `parseAnalyticsPeriod`, `assertAnalyticsAccess`: tenant, subscription entitlement, plan period aur permission checks.

## 6. Complete customer payment flow

### Stripe Checkout

1. Customer public booking payment endpoint par booking number aur access token deta hai.
2. System business aur booking ko token se verify karta hai.
3. Agar payment required hai to `BookingPayment` `PENDING`/`CARD` ke saath create hota hai.
4. Stripe Checkout session amount, currency, customer email aur booking metadata ke saath create hoti hai.
5. Stripe `checkout.session.completed` webhook bhejta hai, ya customer success ke baad reconciliation endpoint use hota hai.
6. Webhook signature verify hoti hai. `StripeWebhookEvent` duplicate event ko rokta hai aur processing lease rakhta hai.
7. Session metadata, amount, currency aur `payment_status=paid` validate hotay hain.
8. `BookingPayment` `SUCCEEDED`, `paidAt` set; booking `CONFIRMED` hoti hai.
9. `creditWalletForBookingPayment` business `Wallet` upsert karta hai.
10. `WalletTransaction` type `PAYMENT`, status `COMPLETED`, amount/credits ke saath create hota hai.
11. Wallet counters: `pendingCredits`, `lifetimeCredits`, `monthlyRevenue` increment hotay hain.
12. Treasury: `totalCollectedCredits`, `totalPendingLiability`, `currentTreasuryBalance` increment hotay hain.
13. Payment notification best-effort generate hoti hai.

### Manual business-location payment

1. Customer `BUSINESS_LOCATION` method select karta hai.
2. Payment record `PENDING` aur booking `CONFIRMED` hoti hai.
3. Business owner booking payment ko `CONFIRM` karta hai to payment `SUCCEEDED` hoti hai, `BookingPaymentAudit` create hota hai aur wallet credit hota hai.
4. Owner `UNPAID` mark kare to payment `PENDING` rehti hai aur audit create hota hai; wallet credit nahin hota.

### Payment failure/refund

- `payment_intent.payment_failed` ya `payment_intent.canceled`: payment `FAILED`, `failedAt` set.
- `charge.refunded`: matching payment `REFUNDED` hoti hai.
- Existing implementation refund ke waqt wallet reversal/treasury reversal nahin karti; webhook sirf `BookingPayment` status update karta hai.

## 7. Settlement flow

1. Business booking ko `COMPLETED` mark karta hai.
2. Booking status transaction ke andar `settleWalletForCompletedBooking` call hota hai.
3. Us booking ka pehla unsettled successful `PAYMENT` transaction find hota hai.
4. `settledAt` atomic claim se set hota hai, is liye repeat request duplicate settlement nahin karti.
5. Wallet mein `pendingCredits` decrement aur `availableCredits` increment hota hai.
6. Treasury mein `totalPendingLiability` decrement aur `totalAvailableLiability` increment hota hai.
7. Wallet mein separate `SETTLEMENT` transaction marker create hota hai.
8. Credits-settled notification best-effort send hoti hai.

`holdCredits` settlement state nahin, withdrawal reservation state hai. `withdrawnCredits` sirf paid withdrawal par barhta hai.

## 8. Withdrawal flow

### Request creation

1. Sirf business owner apne active business ke liye request kar sakta hai.
2. Positive integer amount aur `x-request-id`/idempotency key required hai.
3. Available amount atomic condition ke saath decrement hota hai; same amount hold mein increment hota hai.
4. `WithdrawalRequest` `PENDING` state mein create hoti hai.
5. `AuditLog` action `WITHDRAWAL_REQUEST_CREATED` create hota hai.

### Approval

1. Super admin `APPROVE` action bhejta hai.
2. Sirf `PENDING` request approve hoti hai.
3. Request `APPROVED`, `approvedAt` aur `processedByUserId` update hotay hain.
4. Hold amount wallet mein rehta hai; treasury payout abhi nahin hota.

### Rejection

1. Sirf `PENDING` request reject ho sakti hai.
2. Hold release hota hai: `holdCredits` kam, `availableCredits` wapas barhta hai.
3. Request `REJECTED`, `rejectedAt`, processor aur notes update hotay hain.
4. Rejection audit create hota hai.

### Paid

1. Sirf `APPROVED` request paid ho sakti hai.
2. Wallet se hold decrement aur `withdrawnCredits` increment hota hai.
3. Treasury payout verify karta hai ke current balance aur available liability dono amount cover karte hain.
4. Treasury current balance aur available liability decrement; total paid out increment.
5. `PlatformWalletTransaction` type `PAYOUT` create hota hai.
6. Request `PAID`, `paidAt`, processor aur notes update hotay hain.
7. `WITHDRAWAL_REQUEST_PAID` audit aur notification create hoti hai.

## 9. Treasury detail

Business wallet aur treasury alag ledgers hain:

| Event | Business Wallet | Platform Treasury |
|---|---|---|
| Successful payment | Pending/lifetime/monthly increment | Collected, pending liability, current balance increment |
| Booking completion | Pending → available | Pending liability → available liability |
| Withdrawal request | Available → hold | No change |
| Withdrawal approve | No balance change | No change |
| Withdrawal reject | Hold → available | No change |
| Withdrawal paid | Hold → withdrawn | Current balance/available liability decrease, paid-out increase |

Treasury ka `currentTreasuryBalance` available cash-like platform balance ko represent karta hai. `totalAvailableLiability` businesses ko settled, withdrawable amount ki platform-side liability hai. Payout dono ko cover karna zaroori samajhta hai.

## 10. Database collections / Prisma models

Prisma MongoDB mein model names ko Mongo collections ke taur par use karta hai, jab tak schema mein custom mapping na ho.

| Collection/model | Maqsad | Important fields | Create/update behavior |
|---|---|---|---|
| `Wallet` | Har business ka single wallet. | `businessId`, available/pending/hold/withdrawn, lifetime, monthlyRevenue, currency. | Successful payment par upsert/create; payment par pending/lifetime/monthly; completion par pending→available; withdrawal par available↔hold ya hold→withdrawn. |
| `WalletTransaction` | Business wallet ledger. | `walletId`, optional `paymentId`, `type`, `status`, `amount`, `credits`, `referenceType/Id`, unique `idempotencyKey`, `settledAt`. | Payment credit par `PAYMENT`; completion par `SETTLEMENT`; records normally update nahin hotay, payment settlement marker ka `settledAt` set hota hai. |
| `PlatformWallet` | Single platform treasury aggregate. | `key`, collected, pending/available liability, paid out, current balance. | Upsert on first treasury operation; counters credit/settlement/payout par atomic update. |
| `PlatformWalletTransaction` | Treasury ledger. | wallet ID, `type` (`CREDIT`, `SETTLEMENT`, `PAYOUT`), amount, unique idempotency key, reference. | Har treasury movement par create; duplicate key par movement skip. |
| `WithdrawalRequest` | Business payout lifecycle. | business/wallet IDs, amount, status, idempotency key, notes, timestamps, processor. | Create `PENDING`; admin actions se `APPROVED`, `REJECTED`, `PAID`. |
| `BookingPayment` | Booking ki payment source of truth. | booking/business/customer IDs, amount/currency, method, status, Stripe IDs, paid/failed timestamps. | Checkout/manual/intent flow mein upsert/create; webhook success/failure/refund status update. |
| `BookingPaymentAudit` | Owner ke manual payment actions ka audit. | booking/payment/business, actor, action, status, method, notes. | Owner `CONFIRM` ya `UNPAID` par create; update nahin. |
| `AuditLog` | Treasury/withdrawal platform audit trail. | actor, business, action, target type/id, metadata, createdAt. | Withdrawal create/approve/reject/paid aur treasury credit/settle/payout par create. |
| `StripeWebhookEvent` | Stripe event idempotency aur processing status. | unique Stripe event ID, type, status, attempts, lastError, processedAt. | Event receive par `PROCESSING`; success `PROCESSED`; failure `FAILED`; retry par attempts increment. |
| `Booking` | Booking status aur completion trigger. | status, completedAt, business/customer/service IDs, price/currency snapshots. | Payment success par `CONFIRMED`; status PATCH par `COMPLETED`; isi transition se settlement trigger hota hai. |
| `Business` | Wallet owner aur tenant boundary. | id, ownerId, currency, slug/name/status. | Wallet access aur payment ownership verification mein read. |
| `Notification` | Payment, settled credits aur withdrawal event notifications. | audience/channel/type/status, business/user/booking refs. | Notification event handlers ke through create/queue; wallet accounting ka source nahin. |

## 11. API endpoints

| Method | Route | Purpose | Request | Response | Permissions |
|---|---|---|---|---|---|
| `GET` | `/api/dashboard/wallet` | Current wallet balances. | None. | Wallet counters + `currentBalance`. | Authenticated business owner; super admin active business context ke saath. |
| `GET` | `/api/dashboard/wallet/transactions` | Wallet ledger pagination. | `page`, `pageSize` (max 100). | Transactions + pagination. | Business owner/super admin with business access. |
| `GET` | `/api/wallet/withdrawals` | Apni withdrawal list. | None. | Requests list. | Business owner. |
| `POST` | `/api/wallet/withdrawals` | Withdrawal create. | `{ requestedAmount, notes }`; header `x-request-id` optional, server UUID banata hai. | Created withdrawal, HTTP 201. | Business owner. |
| `GET` | `/api/admin/withdrawals?status=` | Admin withdrawal queue. | Optional status. | Requests list. | Super admin. |
| `PATCH` | `/api/admin/withdrawals/:requestId` | Approve, reject ya paid. | `{ action: "APPROVE" | "REJECT" | "PAID", notes }`. | Updated withdrawal. | Super admin. |
| `GET` | `/api/admin/finance?status=` | Finance overview aur filtered requests. | Optional status. | Treasury, wallet liabilities, revenue, requests. | Super admin. |
| `GET` | `/api/admin/finance/export?report=&format=` | Finance report download. | `report=revenue|withdrawals`, `format=csv|xls`. | CSV ya tab-separated XLS response. | Super admin. |
| `GET` | `/api/analytics` | Business analytics. | `businessId`, `days`. | Booking/customer/review metrics. | Authorized business management; subscription entitlement required. |
| `GET` | `/api/analytics/intelligence` | Cached business intelligence, including wallet counters. | `businessId`, `days` ya `start/end`. | Revenue, bookings, customers, wallet snapshot. | Authorized analytics access; plan rules. |
| `GET` | `/api/admin/analytics` | Platform analytics, withdrawal aur treasury snapshot. | `days` in 1/7/30/90/365. | Platform revenue, businesses, bookings, withdrawals, treasury. | Super admin. |
| `GET` | `/api/public/businesses/:businessSlug/bookings/:bookingNumber/payment` | Public payment context. | Query `token`. | Business + booking/payment. | Valid customer access token. |
| `POST` | Same public payment route | Checkout ya manual method start. | `{ action: "checkout"|"manual", token, method }`. | Checkout URL/already paid ya updated booking/payment. | Valid customer access token. |
| `POST` | `/api/webhooks/stripe` | Stripe events process. | Raw Stripe body + `stripe-signature`. | Received/duplicate response. | Stripe signature aur configured mode required. |
| `PATCH` | `/api/bookings/:bookingId/status` | Booking status change; completion settlement trigger. | Valid status payload, notes/cancellation reason. | Updated booking + settlement result indirectly. | Authorized business operational user. |
| `POST` | `/api/bookings/:bookingId/payment` | Owner manual payment confirm/unpaid. | Action aur notes. | Updated booking/payment/audits. | Authorized business owner/manager according to booking route policy. |

## 12. Stripe integration ka exact role

- Stripe Checkout booking card payment ka current public flow hai.
- Checkout metadata `flow=BOOKING`, `bookingId`, `businessId`, `bookingNumber` rakhti hai.
- Webhook raw body signature se verify hota hai; live/test mode mismatch reject hota hai.
- `StripeWebhookEvent` event duplication aur concurrent processing lease handle karta hai.
- Booking events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`, `charge.refunded`.
- Subscription aur membership Stripe events bhi isi webhook mein handle hotay hain, lekin woh business booking wallet credit flow ka hissa nahin hain.
- `PaymentIntent` create flow deprecated hai; code `410` return karta hai. Legacy finalize/webhook verification paths abhi maujood hain.

## 13. Finance dashboard aur analytics integration

### Admin Finance

`getFinanceOverview` raw wallet totals ko sum karta hai, successful `BookingPayment` se platform revenue/month/business breakdown banata hai, withdrawal statuses ke amounts nikalta hai aur `PlatformWallet` snapshot include karta hai. UI pending/available/withdrawn credits, outstanding liability, pending/paid withdrawals aur treasury cards dikhati hai. Export revenue monthly rows ya withdrawal history deta hai.

### Business Analytics

`/api/analytics` booking, customer, review aur service snapshot data se metrics banata hai. `metrics.js` wallet ledger ko source nahin banata. `intelligence.js` ka business endpoint wallet se `pendingCredits`, `availableCredits`, `withdrawnCredits`, `lifetimeCredits` read karta hai aur successful `BookingPayment` se revenue aggregate karta hai.

### Platform Analytics

Platform intelligence Mongo aggregation se `BookingPayment`, `Booking`, `Business`, `WithdrawalRequest` aggregate karta hai aur `PlatformWallet` se treasury balance read karta hai. Cache `unstable_cache` ke through 30 seconds ke liye hai.

## 14. Dependencies

- Next.js `16.2.7` App Router aur Node.js route runtime.
- Prisma `5.22.0` / `@prisma/client`.
- MongoDB via Prisma Mongo connector aur `$runCommandRaw` aggregation.
- Stripe Node SDK `17.4.0`; frontend Stripe packages bhi installed hain.
- NextAuth session/auth guards aur role permissions.
- TanStack React Query wallet/dashboard fetching ke surrounding frontend mein.
- Next cache `unstable_cache` analytics intelligence ke liye.
- Notifications/email service withdrawal/payment events ke liye.
- Framer Motion, Radix/shadcn-style UI packages presentation ke liye; wallet accounting in par depend nahin karti.
- Background jobs/cron package: wallet scope mein koi installed scheduler/worker nahin mila. Maintenance scripts manual Node processes hain.

## 15. Idempotency, consistency aur observed implementation boundaries

- Payment credit duplicate payment ID aur unique wallet transaction key se guarded hai.
- Treasury movements unique idempotency keys se guarded hain: `PAYMENT:<paymentId>`, `SETTLEMENT:<walletTransactionId>`, `PAYOUT:<withdrawalId>`.
- Wallet/treasury/withdrawal state changes Prisma transactions aur conditional `updateMany` checks mein hotay hain.
- Webhook events persistent processing status aur lease ke saath protected hain.
- Booking completion settlement atomic booking transaction ka hissa hai.
- Refund webhook local payment status ko `REFUNDED` karta hai, lekin wallet/treasury reversal current code mein nahin hai.
- Wallet transaction ledger mein payment aur settlement records alag records hain; settlement original payment record ko delete ya amount-change nahin karta.
- Finance revenue successful booking payments se calculate hoti hai, na ke wallet transaction totals se.

## 16. Short handoff summary

Is project ka accounting path yeh hai: Stripe ya owner-confirmed manual booking payment se business wallet mein pending credit banta hai; booking completion par woh available hota hai; withdrawal request amount ko hold karti hai; super admin approve/reject/paid karta hai; paid action business wallet se withdrawn amount aur platform treasury se payout deduct karta hai. `Wallet`, `PlatformWallet`, `WithdrawalRequest`, `BookingPayment`, `AuditLog` aur webhook event records mil kar is lifecycle ko persist karte hain.
