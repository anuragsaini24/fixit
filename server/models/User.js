import mongoose from 'mongoose';
import { modelOptions } from './modelOptions.js';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  accountType: { type: String, enum: ['customer', 'provider', 'admin'], default: 'customer', required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
  sessionVersion: { type: Number, default: 0 },
  passwordResetTokenHash: { type: String, select: false },
  passwordResetExpiresAt: { type: Date, select: false },
}, modelOptions);

export const User = mongoose.model('User', userSchema);