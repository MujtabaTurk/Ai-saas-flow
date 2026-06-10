import * as Yup from "yup";
import {
  BUSINESS_INDUSTRIES,
  SUPPORTED_COUNTRIES,
  SUPPORTED_CURRENCIES,
  SUPPORTED_LOCALES,
  SUPPORTED_TIMEZONES
} from "@/features/businesses/constants";
import {
  isReservedBusinessSlug,
  normalizeBusinessSlug
} from "@/features/businesses/slug";

const industryValues = BUSINESS_INDUSTRIES.map((industry) => industry.value);
const countryValues = SUPPORTED_COUNTRIES.map((country) => country.value);
const localeValues = SUPPORTED_LOCALES.map((locale) => locale.value);

export const businessOnboardingSchema = Yup.object({
  name: Yup.string()
    .trim()
    .min(2, "Business name must be at least 2 characters.")
    .max(80, "Business name must be 80 characters or fewer.")
    .required("Business name is required."),
  slug: Yup.string()
    .transform((value) => normalizeBusinessSlug(value))
    .min(3, "Slug must be at least 3 characters.")
    .max(50, "Slug must be 50 characters or fewer.")
    .matches(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "Use lowercase letters, numbers, and hyphens.")
    .test("reserved-business-slug", "This public slug is reserved by ServiceFlow.", (value) => {
      return !value || !isReservedBusinessSlug(value);
    })
    .required("Public slug is required."),
  industry: Yup.string().oneOf(industryValues, "Choose a supported industry.").required("Industry is required."),
  email: Yup.string().trim().email("Enter a valid business email.").nullable().default(null),
  phone: Yup.string().trim().max(30, "Phone must be 30 characters or fewer.").nullable().default(null),
  addressLine1: Yup.string()
    .trim()
    .max(120, "Address line 1 must be 120 characters or fewer.")
    .nullable()
    .default(null),
  addressLine2: Yup.string()
    .trim()
    .max(120, "Address line 2 must be 120 characters or fewer.")
    .nullable()
    .default(null),
  city: Yup.string().trim().max(80, "City must be 80 characters or fewer.").nullable().default(null),
  country: Yup.string().oneOf(countryValues, "Choose a supported country.").nullable().default(null),
  website: Yup.string()
    .trim()
    .matches(
      /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(:\d+)?(\/.*)?$/i,
      {
        message: "Enter a valid website, for example serviceflow.com.",
        excludeEmptyString: true
      }
    )
    .nullable()
    .default(null),
  timezone: Yup.string()
    .oneOf(SUPPORTED_TIMEZONES, "Choose a supported timezone.")
    .required("Timezone is required."),
  currency: Yup.string()
    .lowercase()
    .oneOf(SUPPORTED_CURRENCIES, "Choose a supported currency.")
    .required("Currency is required."),
  locale: Yup.string().oneOf(localeValues, "Choose a supported language.").required("Language is required.")
});
