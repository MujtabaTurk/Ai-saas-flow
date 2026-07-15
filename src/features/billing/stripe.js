import Stripe from "stripe";
import { AppError } from "@/lib/api/errors";

let stripeClient = null;
let stripeClientKey = null;

function getStripeKeyMode(key, name) {
  const mode = String(key || "").match(/^sk_(test|live)_/)?.[1];
  if (!mode) {
    throw new AppError(
      `Stripe server configuration is invalid: ${name} must be a Stripe secret key (sk_test_* or sk_live_*).`,
      500
    );
  }
  return mode;
}

export function getStripeConfiguration() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();

  if (!secretKey) {
    throw new AppError("Stripe is not configured on this server.", 500);
  }

  const mode = getStripeKeyMode(secretKey, "STRIPE_SECRET_KEY");
  const publishableMode = publishableKey?.match(/^pk_(test|live)_/)?.[1];
  if (!publishableMode) {
    throw new AppError(
      "Stripe client configuration is invalid: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must be a Stripe publishable key (pk_test_* or pk_live_*).",
      500
    );
  }
  if (mode !== publishableMode) {
    throw new AppError(
      `Stripe configuration is inconsistent: STRIPE_SECRET_KEY is ${mode} mode but NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is ${publishableMode} mode.`,
      500
    );
  }

  return { secretKey, publishableKey, mode };
}

export function getStripeWebhookSecret() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    throw new AppError("Stripe webhook configuration is missing STRIPE_WEBHOOK_SECRET.", 500);
  }
  return webhookSecret;
}

export function getStripe() {
  const { secretKey } = getStripeConfiguration();

  if (!stripeClient || stripeClientKey !== secretKey) {
    stripeClient = new Stripe(secretKey);
    stripeClientKey = secretKey;
  }

  return stripeClient;
}

export function getAppBaseUrl(request) {
  return (process.env.NEXTAUTH_URL || request.nextUrl.origin).replace(/\/+$/, "");
}
