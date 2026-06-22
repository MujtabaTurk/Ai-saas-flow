import * as Yup from "yup";
import { SUPPORTED_CURRENCIES } from "@/features/businesses/constants";
import {
  MEMBERSHIP_BILLING_INTERVALS,
  MEMBERSHIP_PAYMENT_PROVIDERS
} from "@/features/memberships/lifecycle";
import { normalizeMembershipSlug } from "@/features/memberships/slug";

const billingIntervals = Object.values(MEMBERSHIP_BILLING_INTERVALS);
const paymentProviders = Object.values(MEMBERSHIP_PAYMENT_PROVIDERS);

const sharedPlanFields = {
  name: Yup.string()
    .trim()
    .min(2, "Plan name must be at least 2 characters.")
    .max(80, "Plan name must be 80 characters or fewer.")
    .required("Plan name is required."),
  slug: Yup.string()
    .transform((value) => normalizeMembershipSlug(value))
    .min(3, "Slug must be at least 3 characters.")
    .max(60, "Slug must be 60 characters or fewer.")
    .matches(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "Use lowercase letters, numbers, and hyphens.")
    .required("Plan slug is required."),
  description: Yup.string().trim().max(700, "Description must be 700 characters or fewer.").nullable().default(null),
  billingInterval: Yup.string()
    .oneOf(billingIntervals, "Choose a supported billing interval.")
    .required("Billing interval is required."),
  durationDays: Yup.number()
    .typeError("Duration must be a number.")
    .integer("Duration must be a whole number.")
    .min(1, "Duration must be at least 1 day.")
    .max(3660, "Duration must be 10 years or fewer.")
    .required("Duration is required."),
  trialDays: Yup.number()
    .typeError("Trial days must be a number.")
    .integer("Trial days must be a whole number.")
    .min(0, "Trial days cannot be negative.")
    .max(365, "Trial days must be 365 days or fewer.")
    .required("Trial days are required."),
  maxActiveMembers: Yup.number()
    .transform((value, originalValue) =>
      originalValue === "" || originalValue === null ? null : value
    )
    .nullable()
    .typeError("Member cap must be a number.")
    .integer("Member cap must be a whole number.")
    .min(1, "Member cap must be at least 1.")
    .max(100000, "Member cap is too high."),
  currency: Yup.string()
    .lowercase()
    .oneOf(SUPPORTED_CURRENCIES, "Choose a supported currency.")
    .required("Currency is required."),
  requiresPayment: Yup.boolean().default(true),
  isActive: Yup.boolean().default(true),
  sortOrder: Yup.number()
    .typeError("Sort order must be a number.")
    .integer("Sort order must be a whole number.")
    .min(0, "Sort order cannot be negative.")
    .max(10000, "Sort order is too high.")
    .required("Sort order is required.")
};

export const membershipPlanFormSchema = Yup.object({
  ...sharedPlanFields,
  price: Yup.number()
    .typeError("Price must be a number.")
    .min(0, "Price cannot be negative.")
    .max(999999, "Price is too high.")
    .required("Price is required."),
  featureText: Yup.string().trim().max(1000, "Features must be 1000 characters or fewer.").default("")
}).test("payment-price-required", function validatePaymentPrice(value) {
  if (!value?.requiresPayment || Number(value.price) > 0) {
    return true;
  }

  return this.createError({
    path: "price",
    message: "Payment-required plans need a price greater than 0."
  });
});

export const membershipPlanApiSchema = Yup.object({
  ...sharedPlanFields,
  priceCents: Yup.number()
    .typeError("Price must be a valid amount.")
    .integer("Price must use whole cents.")
    .min(0, "Price cannot be negative.")
    .max(99999900, "Price is too high.")
    .required("Price is required."),
  features: Yup.array()
    .of(Yup.string().trim().max(120, "Each feature must be 120 characters or fewer."))
    .max(12, "Plans can list up to 12 features.")
    .default([])
}).test("payment-price-required", function validateApiPaymentPrice(value) {
  if (!value?.requiresPayment || Number(value.priceCents) > 0) {
    return true;
  }

  return this.createError({
    path: "priceCents",
    message: "Payment-required plans need a price greater than 0."
  });
});

export const publicMembershipEnrollmentSchema = Yup.object({
  planId: Yup.string().required("Choose a membership plan."),
  customerName: Yup.string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(120, "Name must be 120 characters or fewer.")
    .required("Name is required."),
  customerEmail: Yup.string()
    .trim()
    .email("Enter a valid email address.")
    .max(180, "Email must be 180 characters or fewer.")
    .required("Email is required."),
  customerPhone: Yup.string().trim().max(40, "Phone must be 40 characters or fewer.").nullable().default(null),
  paymentProvider: Yup.string()
    .oneOf(paymentProviders, "Choose a supported payment provider.")
    .default(MEMBERSHIP_PAYMENT_PROVIDERS.MANUAL),
  idempotencyKey: Yup.string()
    .trim()
    .min(8, "Payment token is invalid.")
    .max(120, "Payment token is invalid.")
    .required("Payment token is required.")
});

export const publicMembershipCheckoutReconciliationSchema = Yup.object({
  sessionId: Yup.string()
    .trim()
    .matches(/^cs_(test|live)_/, "Checkout Session is invalid.")
    .required("Checkout Session is required.")
});

export const customerMembershipRenewalSchema = Yup.object({
  paymentProvider: Yup.string()
    .oneOf(paymentProviders, "Choose a supported payment provider.")
    .default(MEMBERSHIP_PAYMENT_PROVIDERS.MANUAL),
  idempotencyKey: Yup.string()
    .trim()
    .min(8, "Payment token is invalid.")
    .max(120, "Payment token is invalid.")
    .required("Payment token is required.")
});

export const customerMembershipCancellationSchema = Yup.object({
  reason: Yup.string().trim().max(300, "Reason must be 300 characters or fewer.").nullable().default(null)
});
