import { fail } from "@/lib/api/api-response";
import { AppError } from "@/lib/api/errors";

function buildErrorDetails(error) {
  if (!error?.code) {
    return error?.details || null;
  }

  if (error.details && typeof error.details === "object") {
    return {
      code: error.code,
      ...error.details
    };
  }

  return {
    code: error.code,
    details: error.details || null
  };
}

function logApiError(error, status) {
  const logger = status >= 500 ? console.error : console.warn;

  logger("[api-error]", {
    event: "request_failed",
    status,
    code: error?.code || error?.details?.code || null,
    name: error?.name || "Error",
    message: error?.message || "Unknown error",
    details: error?.details || null
  });
}

export function handleApiError(error) {
  if (error instanceof AppError) {
    logApiError(error, error.status);

    return fail(error.message, error.status, buildErrorDetails(error));
  }

  logApiError(error, 500);

  return fail("Something went wrong.", 500);
}
