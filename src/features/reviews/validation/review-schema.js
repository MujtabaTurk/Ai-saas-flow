import * as Yup from "yup";

export const reviewSubmissionSchema = Yup.object({
  token: Yup.string().trim().required("Booking access token is required."),
  rating: Yup.number()
    .typeError("Choose a rating.")
    .integer("Rating must be a whole number.")
    .min(1, "Rating must be at least 1.")
    .max(5, "Rating cannot be greater than 5.")
    .required("Rating is required."),
  title: Yup.string()
    .trim()
    .max(80, "Title must be 80 characters or fewer.")
    .nullable()
    .default(null),
  comment: Yup.string()
    .trim()
    .min(10, "Review must be at least 10 characters.")
    .max(1000, "Review must be 1000 characters or fewer.")
    .required("Review is required.")
});

export const reviewModerationSchema = Yup.object({
  status: Yup.string()
    .oneOf(["PUBLISHED", "HIDDEN"], "Choose a valid review status.")
    .required("Review status is required."),
  reason: Yup.string()
    .trim()
    .max(300, "Moderation reason must be 300 characters or fewer.")
    .nullable()
    .default(null)
});
