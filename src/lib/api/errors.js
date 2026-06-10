export class AppError extends Error {
  constructor(message, status = 400, details = null) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.details = details;
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action.") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "The requested resource was not found.") {
    super(message, 404);
  }
}

