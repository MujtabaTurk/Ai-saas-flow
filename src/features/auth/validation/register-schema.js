import * as Yup from "yup";

export const registerSchema = Yup.object({
  name: Yup.string().trim().min(2, "Name must be at least 2 characters.").required("Name is required."),
  email: Yup.string().email("Enter a valid email address.").required("Email is required."),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters.")
    .required("Password is required."),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match.")
    .required("Confirm your password."),
  invitationToken: Yup.string()
    .trim()
    .min(32, "Invitation token is invalid.")
    .optional(),
  accountType: Yup.string()
    .oneOf(["BUSINESS", "CUSTOMER"], "Choose a valid account type.")
    .default("BUSINESS")
});
