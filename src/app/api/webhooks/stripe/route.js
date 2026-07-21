import {
  linkStripeCustomerToBusiness,
  retrieveAndSyncStripeSubscription,
  syncStripeSubscription
} from "@/features/billing/server";
import {
  MEMBERSHIP_STRIPE_FLOW,
  activateMembershipFromStripeCheckout,
  syncStripeMembershipInvoiceFailure,
  syncStripeMembershipInvoicePayment,
  syncStripeMembershipSubscription
} from "@/features/memberships/server";
import {
  getBillingRequestId,
  logBillingEvent
} from "@/features/billing/logging";
import {
  getStripe,
  getStripeConfiguration,
  getStripeWebhookSecret
} from "@/features/billing/stripe";
import { notifySubscriptionEvent } from "@/features/notifications/events";
import { fail, ok } from "@/lib/api/api-response";
import { AppError } from "@/lib/api/errors";
import { handleApiError } from "@/lib/api/handle-api-error";
import { prisma } from "@/lib/prisma";
import { reconcileBookingCheckoutSession } from "@/features/bookings/payment";
import { creditWalletForBookingPayment } from "@/features/wallet/crediting";

export const runtime = "nodejs";
const PROCESSING_LEASE_MS = 5 * 60 * 1000;
const SUBSCRIPTION_RELATED_EVENT_TYPES = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed"
]);

function getStripeId(value) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id;
}

async function createOrUpdateWebhookRecord(event) {
  const existingEvent = await prisma.stripeWebhookEvent.findUnique({
    where: {
      stripeEventId: event.id
    }
  });

  if (existingEvent?.status === "PROCESSED") {
    return {
      shouldProcess: false,
      record: existingEvent
    };
  }

  if (existingEvent) {
    const processingLeaseIsActive =
      existingEvent.status === "PROCESSING" &&
      existingEvent.updatedAt > new Date(Date.now() - PROCESSING_LEASE_MS);

    if (processingLeaseIsActive) {
      return {
        shouldProcess: false,
        retryLater: true,
        record: existingEvent
      };
    }

    const lease = await prisma.stripeWebhookEvent.updateMany({
      where: {
        stripeEventId: event.id,
        status: existingEvent.status,
        updatedAt: existingEvent.updatedAt
      },
      data: {
        status: "PROCESSING",
        attempts: {
          increment: 1
        },
        lastError: null,
        processedAt: null,
        type: event.type,
        livemode: event.livemode
      }
    });

    if (lease.count === 0) {
      return createOrUpdateWebhookRecord(event);
    }

    const record = await prisma.stripeWebhookEvent.findUnique({
      where: {
        stripeEventId: event.id
      }
    });

    return {
      shouldProcess: true,
      retryLater: false,
      record
    };
  }

  try {
    const record = await prisma.stripeWebhookEvent.create({
      data: {
        stripeEventId: event.id,
        type: event.type,
        livemode: event.livemode,
        status: "PROCESSING"
      }
    });

    return {
      shouldProcess: true,
      retryLater: false,
      record
    };
  } catch (error) {
    if (error?.code === "P2002") {
      return createOrUpdateWebhookRecord(event);
    }

    throw error;
  }
}

async function markWebhookProcessed(eventId) {
  await prisma.stripeWebhookEvent.update({
    where: {
      stripeEventId: eventId
    },
    data: {
      status: "PROCESSED",
      processedAt: new Date(),
      lastError: null
    }
  });
}

async function markWebhookFailed(eventId, error) {
  await prisma.stripeWebhookEvent.update({
    where: {
      stripeEventId: eventId
    },
    data: {
      status: "FAILED",
      processedAt: null,
      lastError: error?.message || "Webhook processing failed."
    }
  });
}

async function syncInvoiceSubscription(invoice, paymentField, context = {}) {
  const subscriptionId = getStripeId(
    invoice.subscription ||
      invoice.parent?.subscription_details?.subscription
  );

  if (!subscriptionId) {
    logBillingEvent(
      "stripe.invoice.subscription_missing",
      {
        ...context,
        stripeCustomerId: getStripeId(invoice.customer),
        invoiceId: invoice.id
      },
      "warn"
    );

    return null;
  }

  const subscription = await retrieveAndSyncStripeSubscription(
    subscriptionId,
    {
      context: {
        ...context,
        subscriptionId
      }
    }
  );
  await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: subscriptionId
    },
    data: {
      latestInvoiceId: invoice.id,
      [paymentField]: new Date(),
      ...(paymentField === "lastPaymentAt"
        ? {
            lastPaymentFailedAt: null
          }
        : {})
    }
  });

  return subscription;
}

async function handleCheckoutSessionCompleted(session, context = {}) {
  if (session.metadata?.flow === "BOOKING") {
    await reconcileBookingCheckoutSession({ sessionId: session.id, businessId: session.metadata.businessId, bookingId: session.metadata.bookingId });
    return null;
  }
  const bookingPayment = await prisma.bookingPayment.findFirst({
    where: { stripeCheckoutSessionId: session.id },
    select: { bookingId: true, businessId: true }
  });
  if (bookingPayment) {
    await reconcileBookingCheckoutSession({ sessionId: session.id, businessId: bookingPayment.businessId, bookingId: bookingPayment.bookingId });
    return null;
  }
  const businessId = session.metadata?.businessId || session.client_reference_id;
  const customerId = getStripeId(session.customer);
  const subscriptionId = getStripeId(session.subscription);
  const checkoutContext = {
    ...context,
    businessId,
    stripeCustomerId: customerId,
    checkoutSessionId: session.id,
    subscriptionId
  };

  if (subscriptionId) {
    return retrieveAndSyncStripeSubscription(subscriptionId, {
      context: checkoutContext,
      expectedBusinessId: businessId,
      expectedCustomerId: customerId
    });
  }

  if (businessId && customerId) {
    await linkStripeCustomerToBusiness(businessId, customerId, {
      replaceExisting: true,
      context: checkoutContext
    });
  }

  return null;
}

async function handleMembershipStripeEvent(event, context = {}) {
  const object = event.data.object;

  if (
    event.type === "checkout.session.completed" &&
    object.metadata?.flow === MEMBERSHIP_STRIPE_FLOW
  ) {
    const result = await activateMembershipFromStripeCheckout(object, context);

    return {
      handled: true,
      membership: result.membership,
      payment: result.payment
    };
  }

  if (
    event.type.startsWith("customer.subscription.") &&
    object.metadata?.flow === MEMBERSHIP_STRIPE_FLOW
  ) {
    const membership = await syncStripeMembershipSubscription(object, context);

    return {
      handled: true,
      membership
    };
  }

  if (event.type === "invoice.paid") {
    const result = await syncStripeMembershipInvoicePayment(object, context);

    if (result) {
      return {
        handled: true,
        membership: result.membership,
        payment: result.payment
      };
    }
  }

  if (event.type === "invoice.payment_failed") {
    const result = await syncStripeMembershipInvoiceFailure(object, context);

    if (result) {
      return {
        handled: true,
        membership: result.membership,
        payment: result.payment
      };
    }
  }

  return {
    handled: false
  };
}

function getSubscriptionNotification(eventType, subscription) {
  if (!subscription) {
    return null;
  }

  const planLabel = subscription.planCode.toLowerCase();

  if (eventType === "invoice.paid") {
    return {
      type: "PAYMENT_SUCCEEDED",
      title: "Subscription payment received",
      message: `Payment for the ${planLabel} plan was received successfully.`
    };
  }

  if (eventType === "invoice.payment_failed") {
    return {
      type: "PAYMENT_FAILED",
      title: "Subscription payment failed",
      message: `Payment for the ${planLabel} plan failed. Update the billing method to prevent service interruption.`
    };
  }

  if (
    eventType === "customer.subscription.deleted" ||
    subscription.status === "CANCELED"
  ) {
    return {
      type: "SUBSCRIPTION_CANCELED",
      title: "Subscription canceled",
      message: `The ${planLabel} subscription was canceled.`
    };
  }

  if (subscription.status === "PAST_DUE") {
    return {
      type: "SUBSCRIPTION_PAST_DUE",
      title: "Subscription payment is past due",
      message: `The ${planLabel} subscription is past due. Review the billing details to restore full access.`
    };
  }

  if (["ACTIVE", "TRIALING"].includes(subscription.status)) {
    return {
      type: "SUBSCRIPTION_ACTIVE",
      title: "Subscription active",
      message: `The ${planLabel} plan is ${subscription.status.toLowerCase()}.`
    };
  }

  return null;
}

async function handleStripeEvent(event, context = {}) {
  const object = event.data.object;
  let subscription = null;
  const membershipResult = await handleMembershipStripeEvent(event, context);

  if (membershipResult.handled) {
    logBillingEvent("stripe.membership.event_processed", {
      ...context,
      stripeObjectId: object.id,
      membershipId: membershipResult.membership?.id,
      paymentId: membershipResult.payment?.id
    });

    return {
      subscription: null,
      notification: null,
      membership: membershipResult.membership,
      payment: membershipResult.payment
    };
  }

  if (SUBSCRIPTION_RELATED_EVENT_TYPES.has(event.type)) {
    logBillingEvent("stripe.subscription.event_processing", {
      ...context,
      stripeCustomerId: getStripeId(object.customer),
      checkoutSessionId:
        event.type === "checkout.session.completed" ? object.id : null,
      subscriptionId:
        event.type.startsWith("customer.subscription.")
          ? object.id
          : getStripeId(
              object.subscription ||
                object.parent?.subscription_details?.subscription
            )
    });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const payment = await prisma.bookingPayment.findFirst({
        where: { stripePaymentIntentId: object.id }
      });
      if (payment) {
        const now = new Date();
        const updatedPayment = await prisma.bookingPayment.update({ where: { id: payment.id }, data: { status: "SUCCEEDED", paidAt: now } });
        const booking = await prisma.booking.update({ where: { id: payment.bookingId }, data: { status: "CONFIRMED", confirmedAt: now } });
        console.info(JSON.stringify({ event: "PAYMENT_SUCCEEDED", paymentId: updatedPayment.id, bookingId: booking.id, businessId: booking.businessId }));
        await creditWalletForBookingPayment({ booking, payment: updatedPayment });
      }
      break;
    }
    case "payment_intent.payment_failed":
    case "payment_intent.canceled": {
      const payment = await prisma.bookingPayment.findFirst({ where: { stripePaymentIntentId: object.id } });
      if (payment) {
        await prisma.bookingPayment.update({ where: { id: payment.id }, data: { status: "FAILED", failedAt: new Date() } });
      }
      break;
    }
    case "charge.refunded": {
      const paymentIntentId = getStripeId(object.payment_intent);
      if (paymentIntentId) {
        const payment = await prisma.bookingPayment.findFirst({ where: { stripePaymentIntentId: paymentIntentId } });
        if (payment) await prisma.bookingPayment.update({ where: { id: payment.id }, data: { status: "REFUNDED" } });
      }
      break;
    }
    case "checkout.session.completed":
      subscription = await handleCheckoutSessionCompleted(object, context);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      try {
        subscription = await retrieveAndSyncStripeSubscription(object.id, {
          context
        });
      } catch (error) {
        const subscriptionWasDeleted =
          event.type === "customer.subscription.deleted";
        const stripeResourceIsMissing =
          error?.code === "resource_missing" || error?.statusCode === 404;

        if (!subscriptionWasDeleted || !stripeResourceIsMissing) {
          throw error;
        }

        subscription = await syncStripeSubscription(object, {
          context
        });
      }
      break;
    case "invoice.paid":
      subscription = await syncInvoiceSubscription(
        object,
        "lastPaymentAt",
        context
      );
      break;
    case "invoice.payment_failed":
      subscription = await syncInvoiceSubscription(
        object,
        "lastPaymentFailedAt",
        context
      );
      break;
    default:
      logBillingEvent("stripe.webhook.event_ignored", {
        ...context,
        stripeObjectId: object.id
      });
      break;
  }

  if (SUBSCRIPTION_RELATED_EVENT_TYPES.has(event.type)) {
    logBillingEvent("stripe.subscription.event_processed", {
      ...context,
      businessId: subscription?.businessId,
      stripeCustomerId: subscription?.stripeCustomerId,
      subscriptionId:
        subscription?.stripeSubscriptionId || getStripeId(object.subscription),
      localSubscriptionId: subscription?.id,
      planCode: subscription?.planCode,
      subscriptionStatus: subscription?.status
    });
  }

  return {
    subscription,
    notification:
      event.type === "checkout.session.completed"
        ? null
        : getSubscriptionNotification(event.type, subscription)
  };
}

export async function POST(request) {
  const signature = request.headers.get("stripe-signature");
  let requestId = request.headers.get("stripe-request-id");

  let webhookSecret;
  let stripeMode;
  try {
    ({ mode: stripeMode } = getStripeConfiguration());
    webhookSecret = getStripeWebhookSecret();
  } catch (error) {
    return handleApiError(error);
  }

  if (!signature) {
    return fail("Stripe signature is missing.", 400);
  }

  try {
    const rawBody = await request.text();
    let event;

    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
    } catch {
      throw new AppError("Invalid Stripe webhook signature.", 400);
    }

    if (event.livemode !== (stripeMode === "live")) {
      throw new AppError("Stripe webhook mode does not match the configured Stripe keys.", 400);
    }

    requestId = getBillingRequestId(
      request,
      event.request?.id || event.id
    );
    const context = {
      requestId,
      stripeEventId: event.id,
      stripeEventType: event.type
    };
    const eventObject = event.data.object;

    logBillingEvent("stripe.webhook.received", {
      ...context,
      stripeCustomerId: getStripeId(eventObject.customer),
      checkoutSessionId:
        event.type === "checkout.session.completed" ? eventObject.id : null,
      subscriptionId:
        event.type.startsWith("customer.subscription.")
          ? eventObject.id
          : getStripeId(eventObject.subscription)
    });

    const { shouldProcess, retryLater } = await createOrUpdateWebhookRecord(event);

    if (!shouldProcess) {
      logBillingEvent(
        retryLater
          ? "stripe.webhook.processing_lease_active"
          : "stripe.webhook.duplicate",
        context,
        retryLater ? "warn" : "info"
      );

      if (retryLater) {
        const response = fail(
          "Stripe webhook event is already being processed.",
          409
        );
        response.headers.set("x-request-id", requestId);

        return response;
      }

      const response = ok({
        received: true,
        duplicate: true
      });
      response.headers.set("x-request-id", requestId);

      return response;
    }

    try {
      const result = await handleStripeEvent(event, context);

      if (result.subscription && result.notification) {
        await notifySubscriptionEvent({
          businessId: result.subscription.businessId,
          subscriptionId: result.subscription.id,
          eventId: event.id,
          ...result.notification
        });
      }

      const subscriptionBusiness = result.subscription
        ? await prisma.business.findUnique({
            where: {
              id: result.subscription.businessId
            },
            select: {
              ownerId: true
            }
          })
        : null;
      await markWebhookProcessed(event.id);

      logBillingEvent("stripe.webhook.processed", {
        ...context,
        userId: subscriptionBusiness?.ownerId,
        businessId: result.subscription?.businessId,
        stripeCustomerId: result.subscription?.stripeCustomerId,
        subscriptionId:
          result.subscription?.stripeSubscriptionId ||
          result.subscription?.id
      });
    } catch (processingError) {
      await markWebhookFailed(event.id, processingError);

      logBillingEvent(
        "stripe.webhook.failed",
        {
          ...context,
          errorMessage: processingError?.message
        },
        "error"
      );

      throw processingError;
    }

    const response = ok({
      received: true
    });
    response.headers.set("x-request-id", requestId);

    return response;
  } catch (error) {
    requestId ||= getBillingRequestId(request);

    logBillingEvent(
      "stripe.webhook.request_failed",
      {
        requestId,
        errorMessage: error?.message
      },
      "error"
    );

    const response = handleApiError(error);
    response.headers.set("x-request-id", requestId);

    return response;
  }
}
