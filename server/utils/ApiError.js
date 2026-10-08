/** Operational error with an HTTP status code and optional per-field validation errors. */
export class ApiError extends Error {
  constructor(status, message, errors = undefined) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

/** Wraps async route handlers so thrown errors reach the error middleware. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const badRequest = (msg, errors) => new ApiError(400, msg, errors);
export const unauthorized = (msg = 'Not authenticated. Please log in.') => new ApiError(401, msg);
export const forbidden = (msg = 'You do not have permission to do that.') => new ApiError(403, msg);
export const notFound = (msg = 'Resource not found.') => new ApiError(404, msg);
export const conflict = (msg, errors) => new ApiError(409, msg, errors);
