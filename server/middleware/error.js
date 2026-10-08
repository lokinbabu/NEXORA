import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';

/** 404 for unknown /api routes. */
export function notFound(req, res, next) {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: `API route not found: ${req.method} ${req.originalUrl}` });
  }
  next();
}

/** Central error handler — converts anything thrown into a clean JSON response. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (res.headersSent) return;

  // Mongoose duplicate key (e.g. registering an email twice)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ message: `That ${field} is already in use.` });
  }

  // Mongoose validation errors
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = {};
    for (const [key, e] of Object.entries(err.errors)) errors[key] = e.message;
    return res.status(400).json({ message: 'Please fix the highlighted fields.', errors });
  }

  // Mongoose bad ObjectId
  if (err instanceof mongoose.Error.CastError) {
    return res.status(404).json({ message: 'The requested item does not exist.' });
  }

  // Malformed JSON body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid request body.' });
  }

  const status = err instanceof ApiError ? err.status : 500;
  const message = err instanceof ApiError ? err.message : 'Something went wrong on our end. Please try again.';

  if (status >= 500) console.error('✖ Error:', err.stack || err);
  res.status(status).json({ message, ...(err.errors ? { errors: err.errors } : {}) });
}
