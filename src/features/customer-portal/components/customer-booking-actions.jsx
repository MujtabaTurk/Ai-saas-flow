"use client";

import { useCallback, useMemo, useState } from "react";
import { useFormik } from "formik";
import {
  CalendarDays,
  Download,
  Eye,
  RefreshCcw,
  Star,
  XCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ModalError, ModalFooter } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {
  cancelCustomerPortalBooking,
  fetchCustomerBookingDetails,
  fetchCustomerBookingSlots,
  getCustomerBookingConfirmationUrl,
  rescheduleCustomerPortalBooking,
  submitCustomerPortalReview
} from "@/features/customer-portal/api";
import {
  formatCustomerBookingAppointment,
  formatCustomerBookingPrice,
  formatCustomerBookingSlot,
  formatCustomerBookingStatus,
  getCustomerBookingDateValue,
  getCustomerBookingStatusVariant
} from "@/features/customer-portal/customer-booking-formatters";
import { ReviewStars } from "@/features/reviews/components/review-stars";
import { reviewSubmissionSchema } from "@/features/reviews/validation/review-schema";
import { formatLocalizedDateTime } from "@/i18n/format";
import { cn } from "@/lib/utils";

function DetailItem({ label, value }) {
  if (!value) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-growth-border bg-white p-4">
      <p className="text-xs font-semibold uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-growth-sidebar">
        {value}
      </p>
    </div>
  );
}

function ReviewContent({ bookingId, details, language, onSaved }) {
  const { showToast } = useToast();
  const review = details.review?.review || details.booking.review;
  const canReview = details.review?.canReview;
  const formik = useFormik({
    initialValues: {
      rating: 5,
      title: "",
      comment: ""
    },
    validationSchema: reviewSubmissionSchema.omit(["token"]),
    onSubmit: async (values, helpers) => {
      try {
        const result = await submitCustomerPortalReview(bookingId, values);
        helpers.resetForm();
        showToast({
          title: "Review submitted",
          description: result.message
        });
        await onSaved();
      } catch (error) {
        helpers.setStatus(error.message);
        helpers.setErrors(error.details || {});
      }
    }
  });

  if (review) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ReviewStars rating={review.rating} />
          <Badge variant={review.status === "PUBLISHED" ? "success" : "warning"}>
            {formatCustomerBookingStatus(review.status)}
          </Badge>
        </div>
        <div>
          <p className="font-semibold text-growth-sidebar">
            {review.title || "Your review"}
          </p>
          {review.comment ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {review.comment}
            </p>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          Submitted{" "}
          {formatLocalizedDateTime(review.createdAt, details.booking.timezone, language, {
            dateStyle: "medium",
            timeStyle: "short"
          })}
        </p>
      </div>
    );
  }

  if (!canReview) {
    return (
      <p className="rounded-2xl border border-growth-border bg-growth-dashboard p-4 text-sm text-muted-foreground">
        Reviews open after the business marks the booking completed.
      </p>
    );
  }

  return (
    <form className="space-y-4" onSubmit={formik.handleSubmit}>
      {formik.status ? <ModalError>{formik.status}</ModalError> : null}

      <div className="space-y-2">
        <Label>Rating</Label>
        <div className="flex gap-2" dir="ltr">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              aria-label={`${rating} star rating`}
              className="rounded-xl p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              key={rating}
              type="button"
              onClick={() => formik.setFieldValue("rating", rating)}
            >
              <Star
                aria-hidden="true"
                className={cn(
                  "h-7 w-7",
                  rating <= formik.values.rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-300"
                )}
              />
            </button>
          ))}
        </div>
        {formik.touched.rating && formik.errors.rating ? (
          <p className="text-xs text-red-600">{formik.errors.rating}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`customer-review-title-${bookingId}`}>
          Title optional
        </Label>
        <Input
          id={`customer-review-title-${bookingId}`}
          name="title"
          value={formik.values.title}
          onBlur={formik.handleBlur}
          onChange={formik.handleChange}
        />
        {formik.touched.title && formik.errors.title ? (
          <p className="text-xs text-red-600">{formik.errors.title}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`customer-review-comment-${bookingId}`}>
          Your review
        </Label>
        <Textarea
          id={`customer-review-comment-${bookingId}`}
          name="comment"
          rows={5}
          value={formik.values.comment}
          onBlur={formik.handleBlur}
          onChange={formik.handleChange}
        />
        {formik.touched.comment && formik.errors.comment ? (
          <p className="text-xs text-red-600">{formik.errors.comment}</p>
        ) : null}
      </div>

      <Button
        isLoading={formik.isSubmitting}
        loadingLabel="Submitting..."
        type="submit"
      >
        Submit review
      </Button>
    </form>
  );
}

export function CustomerBookingActions({ bookingId, language = "en" }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("details");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slotsData, setSlotsData] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(null);

  const loadDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextDetails = await fetchCustomerBookingDetails(bookingId);
      setDetails(nextDetails);
      return nextDetails;
    } catch (loadError) {
      setError(loadError.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  const booking = details?.booking;
  const appointmentLabel = useMemo(() => {
    if (!booking) {
      return "";
    }

    return formatCustomerBookingAppointment(booking, language);
  }, [booking, language]);
  const priceLabel = useMemo(() => {
    return formatCustomerBookingPrice(booking, language);
  }, [booking, language]);

  async function refreshAfterAction() {
    await loadDetails();
    router.refresh();
  }

  async function openReschedulePanel() {
    if (!booking) {
      return;
    }

    const nextDate = getCustomerBookingDateValue(
      booking.startsAt,
      booking.timezone
    );
    setMode("reschedule");
    setActionError(null);
    setSelectedSlot("");
    setRescheduleDate(nextDate);
    await loadSlots(nextDate);
  }

  async function loadSlots(dateValue) {
    if (!dateValue) {
      setSlotsData(null);
      return;
    }

    setSlotsLoading(true);
    setSlotsError(null);

    try {
      setSlotsData(await fetchCustomerBookingSlots(bookingId, dateValue));
    } catch (slotError) {
      setSlotsError(slotError.message);
      setSlotsData(null);
    } finally {
      setSlotsLoading(false);
    }
  }

  async function submitCancel(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setActionError(null);

    try {
      const result = await cancelCustomerPortalBooking(bookingId, {
        reason: cancelReason
      });
      setCancelReason("");
      setMode("details");
      showToast({
        title: "Booking canceled",
        description: result.message
      });
      await refreshAfterAction();
    } catch (cancelError) {
      setActionError(cancelError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitReschedule(event) {
    event.preventDefault();

    if (!selectedSlot) {
      setActionError("Choose an available time.");
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      const result = await rescheduleCustomerPortalBooking(bookingId, {
        startsAt: selectedSlot
      });
      setSelectedSlot("");
      setMode("details");
      showToast({
        title: "Booking rescheduled",
        description: result.message
      });
      await refreshAfterAction();
    } catch (rescheduleError) {
      setActionError(rescheduleError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderActionPanel() {
    if (!booking) {
      return null;
    }

    if (mode === "cancel") {
      return (
        <form
          className="space-y-4 rounded-2xl border border-red-100 bg-red-50/50 p-4"
          onSubmit={submitCancel}
        >
          <div>
            <h3 className="font-semibold text-growth-sidebar">
              Cancel booking
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              This follows the business cancellation window.
            </p>
          </div>
          <ModalError>{actionError}</ModalError>
          <div className="space-y-2">
            <Label htmlFor={`customer-cancel-reason-${bookingId}`}>
              Reason optional
            </Label>
            <Textarea
              id={`customer-cancel-reason-${bookingId}`}
              maxLength={300}
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
            />
          </div>
          <ModalFooter>
            <Button
              disabled={isSubmitting}
              type="button"
              variant="outline"
              onClick={() => setMode("details")}
            >
              Keep booking
            </Button>
            <Button
              isLoading={isSubmitting}
              loadingLabel="Canceling..."
              type="submit"
              variant="destructive"
            >
              Cancel booking
            </Button>
          </ModalFooter>
        </form>
      );
    }

    if (mode === "reschedule") {
      return (
        <form
          className="space-y-4 rounded-2xl border border-growth-border bg-growth-dashboard/60 p-4"
          onSubmit={submitReschedule}
        >
          <div>
            <h3 className="font-semibold text-growth-sidebar">
              Reschedule booking
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose a new time within the business booking window.
            </p>
          </div>
          <ModalError>{actionError || slotsError}</ModalError>
          <div className="space-y-2">
            <Label htmlFor={`customer-reschedule-date-${bookingId}`}>
              New date
            </Label>
            <Input
              id={`customer-reschedule-date-${bookingId}`}
              type="date"
              value={rescheduleDate}
              onChange={async (event) => {
                const nextDate = event.target.value;
                setRescheduleDate(nextDate);
                setSelectedSlot("");
                await loadSlots(nextDate);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Available times</Label>
            {slotsLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading available times...
              </p>
            ) : slotsData?.slots?.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {slotsData.slots.map((slot) => (
                  <Button
                    key={slot.startsAt}
                    size="sm"
                    type="button"
                    variant={
                      selectedSlot === slot.startsAt ? "default" : "outline"
                    }
                    onClick={() => setSelectedSlot(slot.startsAt)}
                  >
                    {formatCustomerBookingSlot(slot, language)}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-growth-border bg-white p-4 text-sm text-muted-foreground">
                No available times for this date.
              </p>
            )}
          </div>
          <ModalFooter>
            <Button
              disabled={isSubmitting}
              type="button"
              variant="outline"
              onClick={() => setMode("details")}
            >
              Back
            </Button>
            <Button
              disabled={!selectedSlot}
              isLoading={isSubmitting}
              loadingLabel="Rescheduling..."
              type="submit"
            >
              Reschedule
            </Button>
          </ModalFooter>
        </form>
      );
    }

    if (mode === "review") {
      return (
        <div className="space-y-4 rounded-2xl border border-growth-border bg-white p-4">
          <div>
            <h3 className="font-semibold text-growth-sidebar">
              Review your appointment
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Reviews are submitted to the business for moderation.
            </p>
          </div>
          <ReviewContent
            bookingId={bookingId}
            details={details}
            language={language}
            onSaved={async () => {
              setMode("details");
              await refreshAfterAction();
            }}
          />
        </div>
      );
    }

    return null;
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={async () => {
          setOpen(true);
          setMode("details");
          setActionError(null);
          await loadDetails();
        }}
      >
        <Eye className="me-2 size-4" aria-hidden="true" />
        Details
      </Button>

      <Modal
        description={booking ? `Reference ${booking.bookingNumber}` : undefined}
        onOpenChange={setOpen}
        open={open}
        size="xl"
        title={booking?.serviceNameSnapshot || "Booking details"}
      >
        {isLoading && !details ? (
          <p className="text-sm text-muted-foreground">
            Loading booking details...
          </p>
        ) : null}

        {error ? <ModalError>{error}</ModalError> : null}

        {booking ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary">
                  {booking.business.name}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-growth-sidebar">
                  {booking.serviceNameSnapshot}
                </h2>
              </div>
              <Badge variant={getCustomerBookingStatusVariant(booking.status)}>
                {formatCustomerBookingStatus(booking.status)}
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Appointment" value={appointmentLabel} />
              <DetailItem
                label="Duration"
                value={`${booking.serviceDurationMinSnapshot} minutes`}
              />
              <DetailItem label="Price" value={priceLabel} />
              <DetailItem
                label="Cancellation deadline"
                value={formatLocalizedDateTime(
                  details.cancellationDeadline,
                  booking.timezone,
                  language,
                  {
                    dateStyle: "medium",
                    timeStyle: "short"
                  }
                )}
              />
              <DetailItem label="Business email" value={booking.business.email} />
              <DetailItem label="Business phone" value={booking.business.phone} />
            </div>

            {booking.notes ? (
              <div className="rounded-2xl border border-growth-border bg-growth-dashboard p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Your notes
                </p>
                <p className="mt-2 text-sm leading-6 text-growth-sidebar">
                  {booking.notes}
                </p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2 border-y border-growth-border py-4">
              <Button asChild variant="outline">
                <a
                  download
                  href={getCustomerBookingConfirmationUrl(booking.id)}
                >
                  <Download className="me-2 size-4" aria-hidden="true" />
                  Download confirmation
                </a>
              </Button>
              <Button
                disabled={!details.canReschedule}
                variant="outline"
                onClick={openReschedulePanel}
              >
                <RefreshCcw className="me-2 size-4" aria-hidden="true" />
                Reschedule
              </Button>
              <Button
                disabled={!details.canCancel}
                variant="destructive"
                onClick={() => {
                  setMode("cancel");
                  setActionError(null);
                }}
              >
                <XCircle className="me-2 size-4" aria-hidden="true" />
                Cancel
              </Button>
              {booking.status === "COMPLETED" ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setMode("review");
                    setActionError(null);
                  }}
                >
                  <Star className="me-2 size-4" aria-hidden="true" />
                  {booking.review ? "View review" : "Leave review"}
                </Button>
              ) : null}
            </div>

            {!details.canCancel && !details.canReschedule ? (
              <p className="flex gap-2 rounded-2xl border border-growth-border bg-growth-dashboard p-4 text-sm text-muted-foreground">
                <CalendarDays
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-primary"
                />
                Canceling and rescheduling are unavailable after the business
                cancellation window closes or after the booking leaves an active
                status.
              </p>
            ) : null}

            {renderActionPanel()}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
