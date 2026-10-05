import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Provider } from '../models/Provider.js';
import { User } from '../models/User.js';
import { HttpError } from '../utils/httpError.js';
import { userDto } from '../utils/userDto.js';

function createToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.accountType, ver: user.sessionVersion || 0 }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export async function registerAccount(values) {
  const passwordHash = await bcrypt.hash(values.password, 12);
  const user = await User.create({
    name: values.name,
    email: values.email,
    passwordHash,
    accountType: values.accountType,
  });

  try {
    if (values.accountType === 'provider') {
      const provider = await Provider.create({ userId: user.id, name: user.name, profession: values.profession });
      user.providerId = provider.id;
      await user.save();
    }
  } catch (error) {
    await User.deleteOne({ _id: user.id });
    throw error;
  }

  return { user: userDto(user), token: createToken(user) };
}

export async function loginAccount(email, password) {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'Email or password is incorrect.');
  }
  if (user.status !== 'Active') throw new HttpError(403, 'This account is inactive.');
  return { user: userDto(user), token: createToken(user) };
}

export async function ensureAdminAccount() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = 'FixIt Admin' } = process.env;
  if (!ADMIN_EMAIL && !ADMIN_PASSWORD) return;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
    throw new Error('Set ADMIN_EMAIL and an ADMIN_PASSWORD of at least 12 characters, or unset both.');
  }

  const email = ADMIN_EMAIL.trim().toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    if (existing.accountType !== 'admin') throw new Error('ADMIN_EMAIL is already assigned to a non-admin account.');
    return;
  }

  await User.create({
    name: ADMIN_NAME.trim(),
    email,
    passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12),
    accountType: 'admin',
  });
}

export function isObjectId(value) {
  return mongoose.isValidObjectId(value);
}