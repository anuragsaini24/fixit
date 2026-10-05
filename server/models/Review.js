import mongoose from 'mongoose';
import { modelOptions } from './modelOptions.js';

const reviewSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  providerName: { type: String, required: true },
  customerName: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  sentiment: { type: String, enum: ['Excellent', 'Good', 'Average', 'Poor'], required: true },
  comment: { type: String, required: true, trim: true, maxlength: 1000 },
  flagged: { type: Boolean, default: false },
}, modelOptions);

export const Review = mongoose.model('Review', reviewSchema);