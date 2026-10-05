import mongoose from 'mongoose';
import { modelOptions } from './modelOptions.js';

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  category: { type: String, required: true, trim: true, maxlength: 100 },
  detail: { type: String, trim: true, maxlength: 500, default: '' },
  icon: { type: String, trim: true, maxlength: 50, default: '' },
  keywords: { type: [String], default: [] },
  priceFrom: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, modelOptions);

serviceSchema.index({ name: 1 }, { unique: true });
export const Service = mongoose.model('Service', serviceSchema);