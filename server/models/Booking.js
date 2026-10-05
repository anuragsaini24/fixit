import mongoose from 'mongoose';
import { modelOptions } from './modelOptions.js';

const statusValues = ['Booking Confirmed', 'Professional Assigned', 'Professional On The Way', 'Service Started', 'Service Completed', 'Booking Cancelled', 'Rejected'];
const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  service: { type: String, required: true, trim: true },
  problem: { type: String, required: true, trim: true, maxlength: 2000 },
  date: { type: String, required: true },
  time: { type: String, required: true, trim: true },
  visitCharge: { type: Number, min: 0, default: 0 },
  estimatedCost: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: statusValues, default: 'Booking Confirmed' },
  statusHistory: [{ status: { type: String, enum: statusValues, required: true }, at: { type: Date, default: Date.now } }],
  cancelledAt: Date,
}, modelOptions);

bookingSchema.index({ customerId: 1, createdAt: -1 });
bookingSchema.index({ providerId: 1, createdAt: -1 });
export const Booking = mongoose.model('Booking', bookingSchema);
export { statusValues };