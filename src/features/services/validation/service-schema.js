import * as Yup from "yup";
import { SUPPORTED_CURRENCIES } from "@/features/businesses/constants";
import { normalizeServiceSlug } from "@/features/services/slug";

const sharedServiceFields = {
  name: Yup.string()
    .trim()
    .min(2, "Service name must be at least 2 characters.")
    .max(80, "Service name must be 80 characters or fewer.")
    .required("Service name is required."),
  slug: Yup.string()
    .transform((value) => normalizeServiceSlug(value))
    .min(3, "Slug must be at least 3 characters.")
    .max(60, "Slug must be 60 characters or fewer.")
    .matches(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "Use lowercase letters, numbers, and hyphens.")
    .required("Service slug is required."),
  description: Yup.string().trim().max(500, "Description must be 500 characters or fewer.").nullable().default(null),
  durationMin: Yup.number()
    .typeError("Duration must be a number.")
    .integer("Duration must be a whole number.")
    .min(5, "Duration must be at least 5 minutes.")
    .max(480, "Duration must be 480 minutes or fewer.")
    .test(
      "five-minute-duration",
      "Duration must use 5-minute increments.",
      (value) => value == null || value % 5 === 0
    )
    .required("Duration is required."),
  bufferBeforeMin: Yup.number()
    .typeError("Buffer before must be a number.")
    .integer("Buffer before must be a whole number.")
    .min(0, "Buffer before cannot be negative.")
    .max(240, "Buffer before must be 240 minutes or fewer.")
    .test(
      "five-minute-buffer-before",
      "Buffer must use 5-minute increments.",
      (value) => value == null || value % 5 === 0
    )
    .required("Buffer before is required."),
  bufferAfterMin: Yup.number()
    .typeError("Buffer after must be a number.")
    .integer("Buffer after must be a whole number.")
    .min(0, "Buffer after cannot be negative.")
    .max(240, "Buffer after must be 240 minutes or fewer.")
    .test(
      "five-minute-buffer-after",
      "Buffer must use 5-minute increments.",
      (value) => value == null || value % 5 === 0
    )
    .required("Buffer after is required."),
  currency: Yup.string()
    .lowercase()
    .oneOf(SUPPORTED_CURRENCIES, "Choose a supported currency.")
    .required("Currency is required."),
  requiresPayment: Yup.boolean().default(false),
  sortOrder: Yup.number()
    .typeError("Sort order must be a number.")
    .integer("Sort order must be a whole number.")
    .min(0, "Sort order cannot be negative.")
    .max(10000, "Sort order is too high.")
    .required("Sort order is required.")
};

export const serviceFormSchema = Yup.object({
  ...sharedServiceFields,
  price: Yup.number()
    .transform((value, originalValue) => (originalValue === "" ? null : value))
    .nullable()
    .typeError("Price must be a number.")
    .min(0, "Price cannot be negative.")
    .max(999999, "Price is too high.")
}).test("payment-price-required", function validatePaymentPrice(value) {
  if (!value?.requiresPayment || Number(value.price) > 0) {
    return true;
  }

  return this.createError({
    path: "price",
    message: "Payment-required services need a price greater than 0."
  });
});

export const serviceApiSchema = Yup.object({
  ...sharedServiceFields,
  priceCents: Yup.number()
    .transform((value, originalValue) =>
      originalValue === "" || originalValue === null ? null : value
    )
    .nullable()
    .typeError("Price must be a valid amount.")
    .integer("Price must use whole cents.")
    .min(0, "Price cannot be negative.")
    .max(99999900, "Price is too high.")
}).test("payment-price-required", function validateApiPaymentPrice(value) {
  if (!value?.requiresPayment || Number(value.priceCents) > 0) {
    return true;
  }

  return this.createError({
    path: "priceCents",
    message: "Payment-required services need a price greater than 0."
  });
});

export const serviceStatusSchema = Yup.object({
  isActive: Yup.boolean().required("Status is required.")
});
