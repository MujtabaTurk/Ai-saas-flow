import {
  linkStripeCustomerToBusiness,
  retrieveAndSyncStripeSubscription,
  syncStripeSubscription
} from "@/features/billing/server";
import { getStripe } from "@/features/billing/stripe";
import { fail, ok } from "@/lib/api/api-response";
import { AppError } from "@/lib/api/errors";
import { handleApiError } from "@/lib/api/handle-api-error";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const PROCESSING_LEASE_MS = 5 * 60 * 1000;

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

async function syncInvoiceSubscription(invoice, paymentField) {
  const subscriptionId = getStripeId(invoice.subscription);

  if (!subscriptionId) {
    return;
  }

  await retrieveAndSyncStripeSubscription(subscriptionId);
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
}

async function handleCheckoutSessionCompleted(session) {
  const businessId = session.metadata?.businessId || session.client_reference_id;
  const customerId = getStripeId(session.customer);
  const subscriptionId = getStripeId(session.subscription);

  if (businessId && customerId) {
    await linkStripeCustomerToBusiness(businessId, customerId);
  }

  if (subscriptionId) {
    await retrieveAndSyncStripeSubscription(subscriptionId);
  }
}

async function handleStripeEvent(event) {
  const object = event.data.object;

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(object);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncStripeSubscription(object);
      break;
    case "invoice.paid":
      await syncInvoiceSubscription(object, "lastPaymentAt");
      break;
    case "invoice.payment_failed":
      await syncInvoiceSubscription(object, "lastPaymentFailedAt");
      break;
    default:
      break;
  }
}

export async function POST(request) {
  const signature = request.headers.get("stripe-signature");

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return fail("Stripe webhook secret is not configured.", 500);
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
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch {
      throw new AppError("Invalid Stripe webhook signature.", 400);
    }

    const { shouldProcess, retryLater } = await createOrUpdateWebhookRecord(event);

    if (!shouldProcess) {
      if (retryLater) {
        return fail("Stripe webhook event is already being processed.", 409);
      }

      return ok({
        received: true,
        duplicate: true
      });
    }

    try {
      await handleStripeEvent(event);
      await markWebhookProcessed(event.id);
    } catch (processingError) {
      await markWebhookFailed(event.id, processingError);
      throw processingError;
    }

    return ok({
      received: true
    });
  } catch (error) {
    return handleApiError(error);
  }
}
