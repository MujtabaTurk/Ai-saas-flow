import Stripe from "stripe";
import { AppError } from "@/lib/api/errors";

let stripeClient = null;

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new AppError("Stripe is not configured on this server.", 500);
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  return stripeClient;
}

export function getAppBaseUrl(request) {
  return (process.env.NEXTAUTH_URL || request.nextUrl.origin).replace(/\/+$/, "");
}
