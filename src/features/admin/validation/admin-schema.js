import * as Yup from "yup";

export const businessStatusSchema = Yup.object({
  status: Yup.string()
    .oneOf(["ACTIVE", "SUSPENDED", "ARCHIVED"], "Choose a valid business status.")
    .required("Business status is required."),
  reason: Yup.string()
    .trim()
    .max(500, "Reason must be 500 characters or fewer.")
    .nullable()
    .when("status", {
      is: (status) => ["SUSPENDED", "ARCHIVED"].includes(status),
      then: (schema) =>
        schema
          .min(3, "Provide a short reason for restricting this business.")
          .required("A reason is required when restricting a business.")
    })
    .default(null)
});

export const userPlatformRoleSchema = Yup.object({
  platformRole: Yup.string()
    .oneOf(["USER", "ADMIN", "SUPER_ADMIN"], "Choose a valid platform role.")
    .required("Platform role is required."),
  reason: Yup.string()
    .trim()
    .max(500, "Reason must be 500 characters or fewer.")
    .nullable()
    .min(3, "Provide a short reason for changing this platform role.")
    .required("A reason is required when changing a platform role.")
    .default(null)
});
