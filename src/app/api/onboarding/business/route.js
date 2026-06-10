import {
  buildTrialSubscription,
  DEFAULT_BUSINESS_AVAILABILITY,
  DEFAULT_BUSINESS_SETTINGS
} from "@/features/businesses/onboarding-defaults";
import {
  mapOnboardingBusiness,
  onboardingBusinessSelect
} from "@/features/businesses/onboarding-mapper";
import { normalizeBusinessSlug } from "@/features/businesses/slug";
import { normalizeWebsiteUrl } from "@/features/businesses/url";
import { businessOnboardingSchema } from "@/features/businesses/validation/onboarding-schema";
import { isSuperAdmin } from "@/features/auth/permissions";
import { created, fail } from "@/lib/api/api-response";
import { handleApiError } from "@/lib/api/handle-api-error";
import { validateRequest } from "@/lib/api/validate-request";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function optionalText(value) {
  return value?.trim() || null;
}

export async function POST(request) {
  try {
    const session = await requireSession();
    const user = session.user;
    const payload = await request.json().catch(() => null);
    const { data, errors } = await validateRequest(businessOnboardingSchema, payload || {});

    if (errors) {
      return fail("Please check the business onboarding form.", 422, errors);
    }

    if (isSuperAdmin(user)) {
      return fail("Super admins should create platform records from the admin workspace.", 403);
    }

    const existingBusiness = await prisma.business.findFirst({
      where: {
        ownerId: user.id,
        status: {
          not: "ARCHIVED"
        }
      },
      select: {
        id: true
      }
    });

    if (existingBusiness) {
      return fail("You already have an active business workspace.", 409);
    }

    const slug = normalizeBusinessSlug(data.slug);
    const existingSlug = await prisma.business.findUnique({
      where: { slug },
      select: {
        id: true
      }
    });

    if (existingSlug) {
      return fail("This public booking slug is already taken.", 409, {
        slug: "This public booking slug is already taken."
      });
    }

    const now = new Date();

    const business = await prisma.business.create({
      data: {
        ownerId: user.id,
        name: data.name.trim(),
        slug,
        industry: data.industry,
        email: optionalText(data.email),
        phone: optionalText(data.phone),
        website: normalizeWebsiteUrl(data.website),
        addressLine1: optionalText(data.addressLine1),
        addressLine2: optionalText(data.addressLine2),
        city: optionalText(data.city),
        country: data.country || null,
        timezone: data.timezone,
        currency: data.currency,
        locale: data.locale,
        settings: {
          create: DEFAULT_BUSINESS_SETTINGS
        },
        subscriptions: {
          create: buildTrialSubscription(now)
        },
        availabilities: {
          create: DEFAULT_BUSINESS_AVAILABILITY
        }
      },
      select: onboardingBusinessSelect
    });

    return created({
      business: mapOnboardingBusiness(business),
      message: "Business workspace created successfully."
    });
  } catch (error) {
    if (error?.code === "P2002") {
      return fail("This public booking slug is already taken.", 409, {
        slug: "This public booking slug is already taken."
      });
    }

    return handleApiError(error);
  }
}
