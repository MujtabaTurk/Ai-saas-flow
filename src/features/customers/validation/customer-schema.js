import * as Yup from "yup";
import {
  SUPPORTED_LOCALES,
  SUPPORTED_TIMEZONES
} from "@/features/businesses/constants";

const localeValues = SUPPORTED_LOCALES.map((locale) => locale.value);

export const customerSchema = Yup.object({
  name: Yup.string()
    .trim()
    .min(2, "Customer name must be at least 2 characters.")
    .max(80, "Customer name must be 80 characters or fewer.")
    .required("Customer name is required."),
  email: Yup.string()
    .trim()
    .email("Enter a valid customer email.")
    .max(160, "Email must be 160 characters or fewer.")
    .required("Customer email is required."),
  phone: Yup.string()
    .trim()
    .max(30, "Phone must be 30 characters or fewer.")
    .nullable()
    .default(null),
  notes: Yup.string()
    .trim()
    .max(2000, "Notes must be 2000 characters or fewer.")
    .nullable()
    .default(null),
  locale: Yup.string()
    .oneOf(localeValues, "Choose a supported language.")
    .nullable()
    .default(null),
  timezone: Yup.string()
    .oneOf(SUPPORTED_TIMEZONES, "Choose a supported timezone.")
    .nullable()
    .default(null),
  marketingOptIn: Yup.boolean().required(
    "Marketing consent selection is required."
  )
});
