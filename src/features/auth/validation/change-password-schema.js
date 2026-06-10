import * as Yup from "yup";

export const changePasswordSchema = Yup.object({
  currentPassword: Yup.string().required("Current password is required."),
  newPassword: Yup.string()
    .min(8, "New password must be at least 8 characters.")
    .notOneOf([Yup.ref("currentPassword")], "New password must be different.")
    .required("New password is required."),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords must match.")
    .required("Confirm your new password.")
});

