import * as Yup from "yup";

export const bookingRequestSchema = Yup.object({
  serviceId: Yup.string()
    .matches(/^[a-f\d]{24}$/i, "Choose a valid service.")
    .required("Service is required."),
  startsAt: Yup.string().datetime("Choose a valid booking time.").required("Booking time is required."),
  customerName: Yup.string()
    .trim()
    .min(2, "Customer name must be at least 2 characters.")
    .max(80, "Customer name must be 80 characters or fewer.")
    .required("Customer name is required."),
  customerEmail: Yup.string().trim().email("Enter a valid customer email.").required("Customer email is required."),
  customerPhone: Yup.string().trim().max(30, "Phone must be 30 characters or fewer.").nullable().default(null),
  notes: Yup.string().trim().max(500, "Notes must be 500 characters or fewer.").nullable().default(null),
  idempotencyKey: Yup.string()
    .trim()
    .min(8, "The booking request identifier is invalid.")
    .max(100, "The booking request identifier is too long.")
    .required("The booking request identifier is required.")
});

export const publicBookingFormSchema = bookingRequestSchema.omit([
  "idempotencyKey"
]);

export const bookingStatusSchema = Yup.object({
  status: Yup.string()
    .oneOf(["CONFIRMED", "CANCELED", "COMPLETED", "NO_SHOW"], "Choose a valid booking status.")
    .required("Booking status is required."),
  cancellationReason: Yup.string()
    .trim()
    .max(300, "Cancellation reason must be 300 characters or fewer.")
    .nullable()
    .default(null),
  internalNotes: Yup.string().trim().max(1000, "Internal notes must be 1000 characters or fewer.").nullable()
});

export const bookingNotesSchema = Yup.object({
  internalNotes: Yup.string()
    .trim()
    .max(1000, "Internal notes must be 1000 characters or fewer.")
    .nullable()
    .default(null)
});

export const customerCancellationSchema = Yup.object({
  token: Yup.string().trim().required("Booking access token is required."),
  reason: Yup.string()
    .trim()
    .max(300, "Cancellation reason must be 300 characters or fewer.")
    .nullable()
    .default(null)
});

export const bookingSettingsSchema = Yup.object({
  bookingLeadTimeMin: Yup.number()
    .integer("Lead time must be a whole number.")
    .min(0, "Lead time cannot be negative.")
    .max(43200, "Lead time cannot exceed 30 days.")
    .required("Lead time is required."),
  bookingWindowDays: Yup.number()
    .integer("Booking window must be a whole number.")
    .min(1, "Booking window must be at least 1 day.")
    .max(365, "Booking window cannot exceed 365 days.")
    .required("Booking window is required."),
  cancellationWindowMin: Yup.number()
    .integer("Cancellation window must be a whole number.")
    .min(0, "Cancellation window cannot be negative.")
    .max(43200, "Cancellation window cannot exceed 30 days.")
    .required("Cancellation window is required."),
  allowGuestBookings: Yup.boolean().required(),
  autoConfirmBookings: Yup.boolean().required()
});
