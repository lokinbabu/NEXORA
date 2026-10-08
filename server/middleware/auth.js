import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { unauthorized, forbidden, asyncHandler } from '../utils/ApiError.js';

function extractToken(req) {
  const cookieToken = req.cookies?.token;
  if (cookieToken) return cookieToken;
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

/** Require a valid JWT. Attaches the authenticated user document to req.user. */
export const protect = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw unauthorized();

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw unauthorized('Your session has expired. Please log in again.');
  }

  const user = await User.findById(decoded.id);
  if (!user) throw unauthorized('This account no longer exists.');

  req.user = user;
  next();
});

/** Must be used after protect. Blocks non-admin users from admin functionality. */
export function adminOnly(req, _res, next) {
  if (req.user?.role !== 'admin') return next(forbidden('Admin access required.'));
  next();
}
