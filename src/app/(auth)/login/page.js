import {
  googleIdentityClientId,
  isGoogleProviderEnabled
} from "@/features/auth/auth-options";
import { LoginEntry } from "@/features/auth/components/login-entry";

export const metadata = {
  title: "Login | ServiceFlow"
};

export default function LoginPage() {
  return (
    <LoginEntry
      googleEnabled={isGoogleProviderEnabled}
      googleClientId={googleIdentityClientId}
    />
  );
}
