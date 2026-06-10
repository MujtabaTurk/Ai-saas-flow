import {
  getBillingBusinessForUser,
  linkStripeCustomerToBusiness
} from "@/features/billing/server";
import { getAppBaseUrl, getStripe } from "@/features/billing/stripe";
import { isSuperAdmin } from "@/features/auth/permissions";
import { ok } from "@/lib/api/api-response";
import { AppError } from "@/lib/api/errors";
import { handleApiError } from "@/lib/api/handle-api-error";
import { requireCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const user = await requireCurrentUser();
    const businessId = new URL(request.url).searchParams.get("businessId");
    const business = await getBillingBusinessForUser(user, businessId);
    const customerId =
      business.stripeCustomerId || business.subscriptions[0]?.stripeCustomerId;

    if (!customerId) {
      throw new AppError("No Stripe customer exists for this business yet.", 409);
    }

    await linkStripeCustomerToBusiness(business.id, customerId);

    const stripe = getStripe();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getAppBaseUrl(request)}${
        isSuperAdmin(user) ? "/admin" : "/dashboard/billing"
      }`
    });

    return ok({
      url: portalSession.url
    });
  } catch (error) {
    return handleApiError(error);
  }
}
