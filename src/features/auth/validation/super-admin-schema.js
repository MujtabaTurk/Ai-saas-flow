import { registerSchema } from "@/features/auth/validation/register-schema";

// Keep super-admin creation aligned with the public registration rules without
// accepting registration-only fields such as accountType or invitationToken.
export const superAdminSchema = registerSchema.pick(["name", "email", "password"]);
