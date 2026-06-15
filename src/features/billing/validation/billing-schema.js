import * as Yup from "yup";
import { BILLING_PLAN_CODES } from "@/features/billing/plan-catalog";

export const checkoutSessionSchema = Yup.object({
  planCode: Yup.string()
    .oneOf(BILLING_PLAN_CODES, "Choose a valid paid plan.")
    .required("Plan is required."),
  idempotencyKey: Yup.string()
    .trim()
    .min(8, "The checkout request identifier is invalid.")
    .max(100, "The checkout request identifier is too long.")
    .required("The checkout request identifier is required.")
});

export const checkoutReconciliationSchema = Yup.object({
  sessionId: Yup.string()
    .trim()
    .matches(/^cs_(test_|live_)?[A-Za-z0-9]+$/, "The Checkout Session ID is invalid.")
    .required("Checkout Session ID is required.")
});
