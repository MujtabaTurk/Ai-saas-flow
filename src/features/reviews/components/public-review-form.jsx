"use client";

import { Star } from "lucide-react";
import { useFormik } from "formik";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitPublicBookingReview } from "@/features/reviews/hooks/use-reviews";
import { reviewSubmissionSchema } from "@/features/reviews/validation/review-schema";
import { ReviewStars } from "./review-stars";

export function PublicReviewForm({
  businessSlug,
  bookingNumber,
  token,
  review
}) {
  const { t } = useTranslation(["public", "bookings"]);
  const mutation = useSubmitPublicBookingReview(
    businessSlug,
    bookingNumber,
    token
  );
  const formik = useFormik({
    initialValues: {
      rating: 5,
      title: "",
      comment: ""
    },
    validationSchema: reviewSubmissionSchema.omit(["token"]),
    onSubmit: async (values, helpers) => {
      try {
        await mutation.mutateAsync(values);
        helpers.resetForm();
      } catch (error) {
        helpers.setStatus(error.message);
        helpers.setErrors(error.details || {});
      }
    }
  });

  if (review) {
    return (
      <div className="space-y-3 rounded-2xl border border-growth-border bg-growth-dashboard p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ReviewStars rating={review.rating} />
          <Badge
            variant={review.status === "PUBLISHED" ? "success" : "warning"}
          >
            {review.status}
          </Badge>
        </div>
        <p className="font-semibold text-growth-sidebar">
          {review.title || t("review.yourReview")}
        </p>
        <p className="text-sm text-muted-foreground">{review.comment}</p>
        <p className="text-xs text-muted-foreground">
          {t("review.immutable")}
        </p>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={formik.handleSubmit}>
      {formik.status ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formik.status}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label>{t("review.rating")}</Label>
        <div className="flex gap-2" dir="ltr">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              aria-label={t("review.stars", { count: rating })}
              className="rounded-xl p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              key={rating}
              type="button"
              onClick={() => formik.setFieldValue("rating", rating)}
            >
              <Star
                className={`h-7 w-7 ${
                  rating <= formik.values.rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
        {formik.touched.rating && formik.errors.rating ? (
          <p className="text-xs text-red-600">{formik.errors.rating}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-title">{t("review.titleOptional")}</Label>
        <Input
          id="review-title"
          name="title"
          placeholder={t("review.titlePlaceholder")}
          value={formik.values.title}
          onBlur={formik.handleBlur}
          onChange={formik.handleChange}
        />
        {formik.touched.title && formik.errors.title ? (
          <p className="text-xs text-red-600">{formik.errors.title}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-comment">{t("review.yourReview")}</Label>
        <Textarea
          id="review-comment"
          name="comment"
          placeholder={t("review.reviewPlaceholder")}
          value={formik.values.comment}
          onBlur={formik.handleBlur}
          onChange={formik.handleChange}
        />
        {formik.touched.comment && formik.errors.comment ? (
          <p className="text-xs text-red-600">{formik.errors.comment}</p>
        ) : null}
      </div>

      <Button disabled={formik.isSubmitting} type="submit">
        {formik.isSubmitting ? t("review.submitting") : t("review.submit")}
      </Button>
    </form>
  );
}
