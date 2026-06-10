import { createHmac } from "crypto";
import { hashToken } from "@/features/auth/password";

export function createCustomerAccessToken(businessId, idempotencyKey) {
  const secret = process.env.NEXTAUTH_SECRET || "serviceflow-development-secret";

  return createHmac("sha256", secret)
    .update(`${businessId}:${idempotencyKey}`)
    .digest("hex");
}

export function verifyCustomerAccessToken(token, storedHash) {
  return Boolean(token && storedHash && hashToken(token) === storedHash);
}

