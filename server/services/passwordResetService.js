import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { HttpError } from '../utils/httpError.js';
import { notifyPasswordReset } from './emailNotificationService.js';

const RESET_TTL_MS = 30 * 60 * 1000;
const RECOVERABLE_ACCOUNT_TYPES = ['customer', 'provider'];

export function hashResetToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export async function requestPasswordReset(email) {
  const user = await User.findOne({ email, status: 'Active', accountType: { $in: RECOVERABLE_ACCOUNT_TYPES } });
  if (!user) return;

  const token = randomBytes(32).toString('hex');
  user.passwordResetTokenHash = hashResetToken(token);
  user.passwordResetExpiresAt = new Date(Date.now() + RESET_TTL_MS);
  await user.save();
  void notifyPasswordReset(user, token).catch((error) => {
    console.warn('FixIt password reset email could not be sent:', error.message);
  });
}

export async function resetAccountPassword(token, password) {
  const tokenHash = hashResetToken(token);
  const now = new Date();
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: now },
    status: 'Active',
    accountType: { $in: RECOVERABLE_ACCOUNT_TYPES },
  }).select('+passwordResetTokenHash +passwordResetExpiresAt');
  if (!user) throw new HttpError(400, 'This password reset link is invalid or expired. Request a new one.');

  const passwordHash = await bcrypt.hash(password, 12);
  const updated = await User.findOneAndUpdate({
    _id: user.id,
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: new Date() },
  }, {
    $set: { passwordHash },
    $unset: { passwordResetTokenHash: 1, passwordResetExpiresAt: 1 },
    $inc: { sessionVersion: 1 },
  }, { new: true, runValidators: true });
  if (!updated) throw new HttpError(400, 'This password reset link is invalid or expired. Request a new one.');
}