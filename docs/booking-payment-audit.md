# Booking payment audit

## Current architecture

- Public booking creation is handled by `src/features/bookings/server.js:createBooking`. A payment-required service creates a `PENDING` booking and reserves occupancy.
- The public payment endpoint is `src/app/api/public/businesses/[businessSlug]/bookings/[bookingNumber]/payment/route.js`. It creates/reuses a Stripe PaymentIntent, accepts a manual method, or finalizes a PaymentIntent.
- `src/features/bookings/payment.js` owns booking payment persistence. Card success is also consumed by `src/app/api/webhooks/stripe/route.js`.
- The dashboard booking list uses `bookingListSelect` in `src/features/bookings/server.js`; before this change it did not select payment status or method.
- Subscription billing uses the same Stripe environment variables through `src/features/billing/stripe.js`, but it is a separate Checkout/subscription flow.

## Root causes found

1. `src/features/bookings/payment.js` accepted `CASH` and `BANK_TRANSFER` while the product requirement is two methods. The UI exposed all three in `booking-payment-page.jsx`, and the API did not normalize the manual flow into a completed customer journey.
2. `booking-payment-page.jsx` created a PaymentIntent in `useEffect` on page load, before method selection. This makes manual-payment users depend on Stripe configuration and produces the misleading “payment not configured” path even when they never selected card.
3. Stripe secret and publishable keys are validated only for prefix/shape in `next.config.mjs` and `src/features/billing/stripe.js`; neither route verifies that the keys belong to the same Stripe mode/account. A revoked, mismatched, or copied key still reaches Stripe and produces `Invalid API Key`/PaymentIntent errors. The runtime now reports Stripe errors consistently and card initialization is lazy.
4. Card finalization trusted a client-supplied PaymentIntent ID but did not verify amount/currency against the booking. That could incorrectly finalize a valid intent for the booking with the wrong amount.
5. The webhook set both payment and booking status for card payments, but there was no owner endpoint for manual payment confirmation/unpaid actions and no payment-specific audit history.
6. Booking status and payment status were not consistently independent: the manual path left the booking pending and the card webhook confirmed it as a side effect. Pay-at-location now confirms the booking while keeping payment `PENDING`; payment mutations never change booking status except where explicitly required for cancellation.

## Required changes

- Database: reduce `BookingPaymentMethod` to `CARD` and `BUSINESS_LOCATION`; add `BookingPaymentAudit` with actor, timestamp, method, status, and notes; expose payment on booking selects.
- API: make card intent creation lazy; validate Stripe intent amount/currency/metadata; add authenticated owner payment actions for `CONFIRM` and `UNPAID`; retain booking cancellation as an independent status action.
- UI: remove bank transfer, redirect both payment methods to the booking success/details page, show the exact payment status, and add owner payment controls and notes.

## Environment conclusion

`STRIPE_SECRET_KEY` must remain server-only and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` must be client-visible. Prefix validation is useful but cannot prove account/mode validity; production deployment must use a matching pair from the same Stripe account/mode and a webhook secret for that endpoint. The committed `.env` contains credentials and should be rotated outside this code change.
