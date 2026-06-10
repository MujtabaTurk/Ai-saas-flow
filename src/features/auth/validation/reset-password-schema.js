import * as Yup from "yup";

export const resetPasswordSchema = Yup.object({
  token: Yup.string().trim().required("Reset token is required."),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters.")
    .required("Password is required."),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match.")
    .required("Confirm your password.")
});

