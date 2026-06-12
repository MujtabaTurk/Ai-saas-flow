import * as Yup from "yup";
import { DAYS_OF_WEEK } from "@/features/availability/constants";
import { isValidDateValue } from "@/features/availability/time";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const dayValues = DAYS_OF_WEEK.map((day) => day.value);

function usesFiveMinuteIncrement(value) {
  if (!value || !timePattern.test(value)) {
    return true;
  }

  return Number(value.split(":")[1]) % 5 === 0;
}

export const availabilitySchema = Yup.object({
  serviceId: Yup.string()
    .nullable()
    .default(null)
    .test(
      "service-object-id",
      "Choose a valid service.",
      (value) => !value || /^[a-f\d]{24}$/i.test(value)
    ),
  dayOfWeek: Yup.string().oneOf(dayValues, "Choose a valid working day.").required("Working day is required."),
  startTime: Yup.string()
    .matches(timePattern, "Enter a valid start time.")
    .test("five-minute-start", "Use a 5-minute time increment.", usesFiveMinuteIncrement)
    .required("Start time is required."),
  endTime: Yup.string()
    .matches(timePattern, "Enter a valid end time.")
    .test("five-minute-end", "Use a 5-minute time increment.", usesFiveMinuteIncrement)
    .required("End time is required."),
  slotDurationMin: Yup.number()
    .typeError("Slot duration must be a number.")
    .integer("Slot duration must be a whole number.")
    .min(5, "Slot duration must be at least 5 minutes.")
    .max(240, "Slot duration must be 240 minutes or fewer.")
    .test(
      "five-minute-slot",
      "Slot duration must use 5-minute increments.",
      (value) => value == null || value % 5 === 0
    )
    .required("Slot duration is required."),
  bufferBeforeMin: Yup.number()
    .typeError("Buffer before must be a number.")
    .integer("Buffer before must be a whole number.")
    .min(0, "Buffer before cannot be negative.")
    .max(240, "Buffer before must be 240 minutes or fewer.")
    .test(
      "five-minute-before",
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
      "five-minute-after",
      "Buffer must use 5-minute increments.",
      (value) => value == null || value % 5 === 0
    )
    .required("Buffer after is required.")
}).test("valid-time-range", function validateTimeRange(value) {
  if (!value?.startTime || !value?.endTime || value.startTime < value.endTime) {
    return true;
  }

  return this.createError({
    path: "endTime",
    message: "End time must be later than start time."
  });
});

export const availabilityStatusSchema = Yup.object({
  isActive: Yup.boolean().required("Status is required.")
});

export const unavailableDateSchema = Yup.object({
  serviceId: Yup.string()
    .nullable()
    .default(null)
    .test(
      "service-object-id",
      "Choose a valid service.",
      (value) => !value || /^[a-f\d]{24}$/i.test(value)
    ),
  date: Yup.string()
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid date.")
    .test("real-calendar-date", "Choose a real calendar date.", isValidDateValue)
    .required("Date is required."),
  isFullDay: Yup.boolean().default(true),
  startTime: Yup.string().matches(timePattern, {
    message: "Enter a valid start time.",
    excludeEmptyString: true
  }).test("five-minute-start", "Use a 5-minute time increment.", usesFiveMinuteIncrement),
  endTime: Yup.string().matches(timePattern, {
    message: "Enter a valid end time.",
    excludeEmptyString: true
  }).test("five-minute-end", "Use a 5-minute time increment.", usesFiveMinuteIncrement),
  reason: Yup.string().trim().max(200, "Reason must be 200 characters or fewer.").nullable().default(null)
}).test("partial-time-required", function validatePartialTime(value) {
  if (value?.isFullDay) {
    return true;
  }

  if (!value?.startTime) {
    return this.createError({
      path: "startTime",
      message: "Start time is required for partial-day unavailability."
    });
  }

  if (!value?.endTime) {
    return this.createError({
      path: "endTime",
      message: "End time is required for partial-day unavailability."
    });
  }

  if (value.startTime >= value.endTime) {
    return this.createError({
      path: "endTime",
      message: "End time must be later than start time."
    });
  }

  return true;
});
