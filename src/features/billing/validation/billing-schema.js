import * as Yup from "yup";
export const checkoutSessionSchema = Yup.object({
  planCode: Yup.string()
    .trim()
    .matches(/^[A-Z0-9_-]+$/, "Choose a valid paid plan.")
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
