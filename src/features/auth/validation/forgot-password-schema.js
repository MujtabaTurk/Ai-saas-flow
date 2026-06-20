import * as Yup from "yup";

export const forgotPasswordSchema = Yup.object({
  email: Yup.string().email("Enter a valid email address.").required("Email is required."),
  resetPath: Yup.string()
    .oneOf(["/reset-password", "/customer/reset-password"], "Choose a valid reset destination.")
    .default("/reset-password")
});
