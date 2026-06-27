import {
  googleIdentityClientId,
  isGoogleProviderEnabled
} from "@/features/auth/auth-options";
import { LoginEntry } from "@/features/auth/components/login-entry";

export const metadata = {
  title: "Customer Login | ServiceFlow"
};

export default function CustomerLoginPage() {
  return (
    <LoginEntry
      defaultCallbackUrl="/customer"
      forgotPasswordPath="/customer/forgot-password"
      googleEnabled={isGoogleProviderEnabled}
      googleClientId={googleIdentityClientId}
      registerPath="/customer/register"
    />
  );
}
