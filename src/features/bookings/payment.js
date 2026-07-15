import { verifyCustomerAccessToken } from "@/features/bookings/access-token";
import { getAppBaseUrl, getStripe } from "@/features/billing/stripe";
import { AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";

export async function getPublicBookingPaymentContext({ businessSlug, bookingNumber, token }) {
  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
    select: { id: true, name: true, logoUrl: true, slug: true, timezone: true, currency: true, settings: true }
  });
  if (!business) throw new AppError("Business not found.", 404);

  const booking = await prisma.booking.findUnique({
    where: { businessId_bookingNumber: { businessId: business.id, bookingNumber } },
    include: { payment: true }
  });
  if (!booking || !verifyCustomerAccessToken(token, booking.customerAccessTokenHash)) {
    throw new AppError("Booking not found or access token is invalid.", 404);
  }
  return { business, booking };
}

export async function createBookingCheckoutSession({ businessSlug, bookingNumber, token, request }) {
  const { booking } = await getPublicBookingPaymentContext({ businessSlug, bookingNumber, token });
  if (!booking.paymentRequiredSnapshot || !booking.servicePriceCentsSnapshot) {
    throw new AppError("Payment is not required for this booking.", 409);
  }
  if (booking.payment?.status === "SUCCEEDED") {
    return { alreadyPaid: true, booking };
  }

  const stripe = getStripe();
  const payment = booking.payment || await prisma.bookingPayment.create({
    data: {
      bookingId: booking.id,
      businessId: booking.businessId,
      customerId: booking.customerId,
      amountCents: booking.servicePriceCentsSnapshot,
      currency: booking.serviceCurrencySnapshot,
      method: "CARD"
    }
  });
  if (payment.stripeCheckoutSessionId) {
    try {
      const existing = await stripe.checkout.sessions.retrieve(payment.stripeCheckoutSessionId);
      if (["open", "complete"].includes(existing.status)) return { checkoutUrl: existing.url, booking };
    } catch (error) {
      if (error?.code !== "resource_missing") throw normalizeStripeError(error);
    }
  }
  try {
    const baseUrl = getAppBaseUrl(request);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: booking.customerEmail,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: payment.currency.toLowerCase(),
          unit_amount: payment.amountCents,
          product_data: { name: booking.serviceNameSnapshot }
        }
      }],
      metadata: { flow: "BOOKING", bookingId: booking.id, businessId: booking.businessId, bookingNumber: booking.bookingNumber },
      client_reference_id: booking.id,
      success_url: `${baseUrl}/${businessSlug}/booking/${booking.bookingNumber}?token=${encodeURIComponent(token)}&checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/${businessSlug}/checkout?booking=${encodeURIComponent(booking.bookingNumber)}&token=${encodeURIComponent(token)}&checkout=canceled`
    }, { idempotencyKey: `booking-checkout-${booking.id}` });
    await prisma.bookingPayment.update({ where: { id: payment.id }, data: { method: "CARD", stripeCheckoutSessionId: session.id, failedAt: null } });
    return { checkoutUrl: session.url, booking };
  } catch (error) {
    throw normalizeStripeError(error);
  }
}

export async function reconcileBookingCheckoutSession({ sessionId, businessId, bookingId }) {
  const stripe = getStripe();
  const bookingRecord = await prisma.booking.findUnique({ where: { id: bookingId }, select: { customerId: true, servicePriceCentsSnapshot: true, serviceCurrencySnapshot: true } });
  if (!bookingRecord) throw new AppError("Booking not found.", 404);
  let session;
  try { session = await stripe.checkout.sessions.retrieve(sessionId); } catch (error) { throw normalizeStripeError(error); }
  const metadata = session.metadata || {};
  if (metadata.flow !== "BOOKING" || metadata.businessId !== businessId || metadata.bookingId !== bookingId || session.payment_status !== "paid" || session.amount_total !== bookingRecord.servicePriceCentsSnapshot || session.currency !== bookingRecord.serviceCurrencySnapshot.toLowerCase()) return null;
  const now = new Date();
  const payment = await prisma.bookingPayment.upsert({
    where: { bookingId },
    create: { bookingId, businessId, customerId: bookingRecord.customerId, amountCents: session.amount_total || 0, currency: session.currency || "usd", method: "CARD", status: "SUCCEEDED", stripeCheckoutSessionId: session.id, paidAt: now },
    update: { method: "CARD", status: "SUCCEEDED", stripeCheckoutSessionId: session.id, paidAt: now, failedAt: null }
  });
  const booking = await prisma.booking.update({ where: { id: bookingId }, data: { status: "CONFIRMED", confirmedAt: now } });
  return { booking, payment };
}

export async function createBookingPaymentIntent(args) {
  throw new AppError("PaymentIntent booking flow is deprecated. Use Stripe Checkout.", 410);
}

export async function chooseBookingPaymentMethod({ businessSlug, bookingNumber, token, method }) {
  const { booking } = await getPublicBookingPaymentContext({ businessSlug, bookingNumber, token });
  if (method !== "BUSINESS_LOCATION") throw new AppError("Choose a supported payment method.", 422);
  const now = new Date();
  const payment = await prisma.bookingPayment.upsert({
    where: { bookingId: booking.id },
    create: { bookingId: booking.id, businessId: booking.businessId, customerId: booking.customerId, amountCents: booking.servicePriceCentsSnapshot || 0, currency: booking.serviceCurrencySnapshot, method, status: "PENDING" },
    update: { method, status: "PENDING", failedAt: null, paidAt: null }
  });
  const updatedBooking = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CONFIRMED", confirmedAt: booking.confirmedAt || now }
  });
  return { booking: updatedBooking, payment };
}

export async function finalizeBookingCardPayment({ businessSlug, bookingNumber, token, paymentIntentId }) {
  const { booking } = await getPublicBookingPaymentContext({ businessSlug, bookingNumber, token });
  const stripe = getStripe();
  let intent;
  try {
    intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    throw normalizeStripeError(error);
  }
  if (
    intent.metadata?.bookingId !== booking.id ||
    intent.status !== "succeeded" ||
    intent.amount !== booking.servicePriceCentsSnapshot ||
    intent.currency !== booking.serviceCurrencySnapshot.toLowerCase()
  ) throw new AppError("Card payment could not be verified for this booking.", 402);
  const now = new Date();
  const payment = await prisma.bookingPayment.upsert({
    where: { bookingId: booking.id },
    create: { bookingId: booking.id, businessId: booking.businessId, customerId: booking.customerId, amountCents: intent.amount, currency: intent.currency, method: "CARD", status: "SUCCEEDED", stripePaymentIntentId: intent.id, paidAt: now },
    update: { method: "CARD", status: "SUCCEEDED", stripePaymentIntentId: intent.id, paidAt: now, failedAt: null }
  });
  const updatedBooking = await prisma.booking.update({ where: { id: booking.id }, data: { status: "CONFIRMED", confirmedAt: now } });
  return { booking: updatedBooking, payment };
}

export async function updateOwnerBookingPayment({ bookingId, businessId, actorUserId, action, notes }) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, businessId },
    include: { payment: true }
  });
  if (!booking) throw new AppError("Booking not found.", 404);
  if (!booking.payment) throw new AppError("This booking has no payment record.", 409);
  if (!["CONFIRM", "UNPAID"].includes(action)) throw new AppError("Choose a valid payment action.", 422);
  const now = new Date();
  const status = action === "CONFIRM" ? "SUCCEEDED" : "PENDING";
  const updated = await prisma.$transaction(async (transaction) => {
    const payment = await transaction.bookingPayment.update({
      where: { id: booking.payment.id },
      data: { status, paidAt: action === "CONFIRM" ? now : null, failedAt: null }
    });
    await transaction.bookingPaymentAudit.create({
      data: {
        bookingId: booking.id,
        bookingPaymentId: payment.id,
        businessId,
        actorUserId,
        action: action === "CONFIRM" ? "CONFIRMED" : "MARKED_UNPAID",
        paymentStatus: status,
        paymentMethod: payment.method,
        notes: notes?.trim() || null
      }
    });
    return payment;
  });
  return { booking: await prisma.booking.findFirst({ where: { id: booking.id, businessId }, include: { payment: { include: { audits: { orderBy: { createdAt: "desc" }, take: 10, include: { actor: { select: { name: true, email: true } } } } } } } }), payment: updated };
}

function normalizeStripeError(error) {
  const message = error?.type === "StripeAuthenticationError"
    ? "Stripe authentication failed. Verify that STRIPE_SECRET_KEY is a valid server secret for the configured Stripe account."
    : error?.message || "Stripe could not process this payment.";
  return new AppError(message, 502, { code: error?.code || error?.type || "stripe_error" });
}
