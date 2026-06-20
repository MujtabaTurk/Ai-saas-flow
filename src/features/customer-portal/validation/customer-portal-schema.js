import * as Yup from "yup";
import {
  SUPPORTED_LOCALES,
  SUPPORTED_TIMEZONES
} from "@/features/businesses/constants";

const localeValues = SUPPORTED_LOCALES.map((locale) => locale.value);

export const customerProfileSchema = Yup.object({
  name: Yup.string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name must be 80 characters or fewer.")
    .required("Name is required."),
  phone: Yup.string()
    .trim()
    .max(30, "Phone must be 30 characters or fewer.")
    .nullable()
    .default(null),
  image: Yup.string()
    .trim()
    .url("Enter a valid profile photo URL.")
    .max(500, "Profile photo URL must be 500 characters or fewer.")
    .nullable()
    .default(null)
});

export const customerSettingsSchema = Yup.object({
  customerEmailNotifications: Yup.boolean().required(),
  customerBookingReminders: Yup.boolean().required(),
  customerMarketingOptIn: Yup.boolean().required(),
  locale: Yup.string()
    .oneOf(localeValues, "Choose a supported language.")
    .nullable()
    .default(null),
  timezone: Yup.string()
    .oneOf(SUPPORTED_TIMEZONES, "Choose a supported timezone.")
    .nullable()
    .default(null)
});
