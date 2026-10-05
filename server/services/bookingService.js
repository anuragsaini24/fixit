import { randomBytes } from 'node:crypto';
import { Booking } from '../models/Booking.js';

export function populateBooking(query) {
  return query
    .populate('customerId', 'name')
    .populate('providerId', 'name')
    .populate('serviceId', 'name');
}

export function bookingDto(booking) {
  return {
    bookingId: booking.bookingId,
    customer: { customerId: String(booking.customerId.id), name: booking.customerId.name },
    provider: { id: String(booking.providerId.id), name: booking.providerId.name },
    service: booking.service,
    serviceId: String(booking.serviceId.id),
    problem: booking.problem,
    date: booking.date,
    time: booking.time,
    visitCharge: booking.visitCharge,
    estimatedCost: booking.estimatedCost,
    status: booking.status,
    statusHistory: booking.statusHistory,
    createdAt: booking.createdAt,
  };
}

export function createBookingId() {
  return `FIX-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`;
}