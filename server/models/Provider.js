import mongoose from 'mongoose';
import { modelOptions } from './modelOptions.js';

const providerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  profession: { type: String, required: true, trim: true, maxlength: 100 },
  serviceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  services: { type: [String], default: [] },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  reviewCount: { type: Number, min: 0, default: 0 },
  experience: { type: Number, min: 0, default: 0 },
  distance: { type: Number, min: 0, default: 0 },
  startingPrice: { type: Number, min: 0, default: 0 },
  verified: { type: Boolean, default: false },
  availableToday: { type: Boolean, default: false },
  location: { type: String, trim: true, maxlength: 200, default: '' },
  state: { type: String, trim: true, maxlength: 100, default: '' },
  about: { type: String, trim: true, maxlength: 2000, default: '' },
  avatarTone: { type: String, trim: true, maxlength: 30, default: 'blue' },
  accountStatus: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },
  isActive: { type: Boolean, default: true },
}, modelOptions);

export const Provider = mongoose.model('Provider', providerSchema);