import { fail } from "@/lib/api/api-response";
import { AppError } from "@/lib/api/errors";

export function handleApiError(error) {
  if (error instanceof AppError) {
    return fail(error.message, error.status, error.details);
  }

  return fail("Something went wrong.", 500);
}

