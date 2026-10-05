import { HttpError } from '../utils/httpError.js';

export function notFound(request, response, next) {
  next(new HttpError(404, `Route not found: ${request.method} ${request.path}`));
}

export function errorHandler(error, request, response, next) {
  if (response.headersSent) return next(error);

  let status = error.status || 500;
  let message = status >= 500 ? 'An unexpected server error occurred.' : error.message;
  let details = error.details;

  if (error.name === 'ValidationError') {
    status = 400;
    message = 'Database validation failed.';
    details = Object.values(error.errors).map(({ path, message: issue }) => ({ path, message: issue }));
  } else if (error.code === 11000) {
    status = 409;
    message = 'A record with that value already exists.';
  } else if (error.name === 'CastError') {
    status = 400;
    message = 'The supplied identifier is invalid.';
  }

  if (status >= 500) console.error(error);
  response.status(status).json({ error: { message, ...(details ? { details } : {}) } });
}