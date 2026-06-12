import { randomBytes } from "crypto";
import { hashToken } from "@/features/auth/password";

export function createTeamInvitationToken() {
  const token = randomBytes(32).toString("hex");

  return {
    token,
    tokenHash: hashToken(token)
  };
}
