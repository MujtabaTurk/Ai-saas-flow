import * as Yup from "yup";
import { DAYS_OF_WEEK } from "@/features/availability/constants";

const objectIdPattern = /^[a-f\d]{24}$/i;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const dayValues = DAYS_OF_WEEK.map((day) => day.value);

export const teamInvitationSchema = Yup.object({
  email: Yup.string()
    .trim()
    .email("Enter a valid team member email.")
    .max(160, "Email must be 160 characters or fewer.")
    .required("Email is required."),
  role: Yup.string()
    .oneOf(["ADMIN", "STAFF"], "Choose a valid business role.")
    .required("Business role is required.")
});

export const teamMemberRoleSchema = Yup.object({
  role: Yup.string()
    .oneOf(["ADMIN", "STAFF"], "Choose a valid business role.")
    .required("Business role is required.")
});

export const teamServiceAssignmentSchema = Yup.object({
  serviceIds: Yup.array()
    .of(
      Yup.string()
        .matches(objectIdPattern, "Choose valid services.")
        .required()
    )
    .max(100, "Too many service assignments.")
    .required("Service assignments are required.")
});

const staffAvailabilityEntrySchema = Yup.object({
  dayOfWeek: Yup.string()
    .oneOf(dayValues, "Choose a valid working day.")
    .required("Working day is required."),
  startTime: Yup.string()
    .matches(timePattern, "Enter a valid start time.")
    .required("Start time is required."),
  endTime: Yup.string()
    .matches(timePattern, "Enter a valid end time.")
    .required("End time is required."),
  isActive: Yup.boolean().default(true)
}).test("valid-time-range", "End time must be later than start time.", (value) => {
  return !value?.startTime || !value?.endTime || value.startTime < value.endTime;
});

export const staffAvailabilitySchema = Yup.object({
  availability: Yup.array()
    .of(staffAvailabilityEntrySchema)
    .max(50, "Too many working-hour ranges.")
    .required("Availability is required.")
});

export const bookingAssignmentSchema = Yup.object({
  membershipId: Yup.string()
    .nullable()
    .default(null)
    .test(
      "membership-object-id",
      "Choose a valid team member.",
      (value) => !value || objectIdPattern.test(value)
    )
});

export const invitationAcceptanceSchema = Yup.object({
  token: Yup.string()
    .trim()
    .min(32, "Invitation token is invalid.")
    .required("Invitation token is required."),
  confirmed: Yup.boolean()
    .oneOf([true], "Confirm that you want to join this business.")
    .required("Invitation acceptance must be confirmed.")
});
