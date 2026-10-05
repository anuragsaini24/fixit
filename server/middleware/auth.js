import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';

export const requireAuth = asyncHandler(async (request, response, next) => {
  const [scheme, token] = (request.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new HttpError(401, 'Authentication is required.');

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, 'The access token is invalid or expired.');
  }

  const user = await User.findById(payload.sub);
  if (!user || user.status !== 'Active') throw new HttpError(401, 'The account is unavailable.');
  if ((payload.ver ?? 0) !== (user.sessionVersion || 0)) throw new HttpError(401, 'The access token is invalid or expired.');
  request.user = user;
  next();
});

export const optionalAuth = asyncHandler(async (request, response, next) => {
  if (!request.headers.authorization) return next();
  return requireAuth(request, response, next);
});

export function requireRole(...roles) {
  return function checkRole(request, response, next) {
    if (!request.user || !roles.includes(request.user.accountType)) {
      return next(new HttpError(403, 'You do not have permission to perform this action.'));
    }
    next();
  };
}