import { checkoutSessionSchema } from "@/features/billing/validation/billing-schema";
import {
  ensureStripeCustomerForBusiness,
  getBillingBusinessForUser,
  getCheckoutPriceId
} from "@/features/billing/server";
import { getAppBaseUrl, getStripe } from "@/features/billing/stripe";
import { STRIPE_MANAGED_SUBSCRIPTION_STATUSES } from "@/features/billing/status";
import { isSuperAdmin } from "@/features/auth/permissions";
import { fail, ok } from "@/lib/api/api-response";
import { AppError } from "@/lib/api/errors";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { requireCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const user = await requireCurrentUser();
    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(checkoutSessionSchema, payload || {});

    if (errors) {
      return fail("Please choose a billing plan.", 422, errors);
    }

    const businessId = new URL(request.url).searchParams.get("businessId");
    const business = await getBillingBusinessForUser(user, businessId);
    const currentSubscription = business.subscriptions[0] || null;

    if (
      currentSubscription?.stripeSubscriptionId &&
      STRIPE_MANAGED_SUBSCRIPTION_STATUSES.includes(currentSubscription.status)
    ) {
      throw new AppError("Manage your current subscription from the billing portal.", 409);
    }

    const priceId = getCheckoutPriceId(data.planCode);
    const stripe = getStripe();
    const customerId = await ensureStripeCustomerForBusiness(business);
    const baseUrl = getAppBaseUrl(request);
    const returnPath = isSuperAdmin(user) ? "/admin" : "/dashboard/billing";
    const checkoutSession = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        customer: customerId,
        client_reference_id: business.id,
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        billing_address_collection: "auto",
        customer_update: {
          address: "auto",
          name: "auto"
        },
        allow_promotion_codes: true,
        success_url: `${baseUrl}${returnPath}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}${returnPath}?checkout=canceled`,
        metadata: {
          businessId: business.id,
          planCode: data.planCode
        },
        subscription_data: {
          metadata: {
            businessId: business.id,
            planCode: data.planCode
          }
        }
      },
      {
        idempotencyKey: `checkout:${business.id}:${data.idempotencyKey}`
      }
    );

    return ok({
      url: checkoutSession.url,
      sessionId: checkoutSession.id
    });
  } catch (error) {
    return handleApiError(error);
  }
}
