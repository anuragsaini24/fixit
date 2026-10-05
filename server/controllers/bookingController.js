import { Booking, statusValues } from '../models/Booking.js';
import { Provider } from '../models/Provider.js';
import { Service } from '../models/Service.js';
import { bookingDto, createBookingId, populateBooking } from '../services/bookingService.js';
import { notifyBookingCreated, notifyServiceCompleted } from '../services/emailNotificationService.js';
import { emitBookingCreated, emitBookingStatusChanged } from '../realtime/socketServer.js';
import { HttpError } from '../utils/httpError.js';

const statusOrder = statusValues.slice(0, 5);

export async function createBooking(request, response) {
  const { providerId, serviceId, problem, date, time } = request.validated.body;
  const [provider, service] = await Promise.all([
    Provider.findOne({ _id: providerId, isActive: true, accountStatus: { $ne: 'Rejected' } }),
    Service.findOne({ _id: serviceId, status: 'Active' }),
  ]);
  if (!provider) throw new HttpError(404, 'Provider not found.');
  if (!service) throw new HttpError(404, 'Service not found.');
  if (!provider.serviceIds.some((id) => String(id) === serviceId)) throw new HttpError(400, 'This provider does not offer the selected service.');

  const booking = await Booking.create({
    bookingId: createBookingId(),
    customerId: request.user.id,
    providerId: provider.id,
    serviceId: service.id,
    service: service.name,
    problem,
    date,
    time,
    visitCharge: 99,
    estimatedCost: provider.startingPrice,
    statusHistory: [{ status: 'Booking Confirmed' }],
  });
  emitBookingCreated(booking);
  void notifyBookingCreated({ booking, customer: request.user, provider }).catch((error) => {
    console.warn('FixIt booking email notification could not be sent:', error.message);
  });
  const savedBooking = await populateBooking(Booking.findById(booking.id));
  response.status(201).json({ booking: bookingDto(savedBooking) });
}

export async function getCustomerBookings(request, response) {
  const filter = request.user.accountType === 'admin' && request.validated.query.customerId
    ? { customerId: request.validated.query.customerId }
    : request.user.accountType === 'admin' ? {} : { customerId: request.user.id };
  const bookings = await populateBooking(Booking.find(filter).sort({ createdAt: -1 }));
  response.json({ bookings: bookings.map(bookingDto) });
}

export async function getProviderBookings(request, response) {
  const providerId = request.user.accountType === 'admin' ? request.validated.query.providerId : request.user.providerId;
  if (!providerId) throw new HttpError(404, 'Provider profile not found.');
  const bookings = await populateBooking(Booking.find({ providerId }).sort({ createdAt: -1 }));
  response.json({ bookings: bookings.map(bookingDto) });
}

export async function getBooking(request, response) {
  const booking = await populateBooking(Booking.findOne({ bookingId: request.validated.params.id }));
  if (!booking) throw new HttpError(404, 'Booking not found.');
  ensureCanAccessBooking(request.user, booking);
  response.json({ booking: bookingDto(booking) });
}

export async function updateBookingStatus(request, response) {
  const { status } = request.validated.body;
  const booking = await Booking.findOne({ bookingId: request.validated.params.id });
  if (!booking) throw new HttpError(404, 'Booking not found.');
  if (request.user.accountType !== 'admin' && String(booking.providerId) !== String(request.user.providerId)) {
    throw new HttpError(403, 'You can only update bookings assigned to your provider profile.');
  }
  if (status === 'Rejected') {
    if (booking.status !== 'Booking Confirmed') throw new HttpError(409, 'Only new booking requests can be rejected.');
  } else {
    const currentIndex = statusOrder.indexOf(booking.status);
    const nextIndex = statusOrder.indexOf(status);
    if (nextIndex !== currentIndex + 1) throw new HttpError(409, 'Booking status must advance one step at a time.');
  }
  booking.status = status;
  booking.statusHistory.push({ status });
  await booking.save();
  emitBookingStatusChanged(booking);
  if (status === 'Service Completed') {
    void notifyServiceCompleted(booking).catch((error) => {
      console.warn('FixIt completion email notification could not be sent:', error.message);
    });
  }
  const savedBooking = await populateBooking(Booking.findById(booking.id));
  response.json({ booking: bookingDto(savedBooking) });
}

export async function cancelBooking(request, response) {
  const booking = await Booking.findOne({ bookingId: request.validated.params.id });
  if (!booking) throw new HttpError(404, 'Booking not found.');
  const isAdmin = request.user.accountType === 'admin';
  const ownsBooking = String(booking.customerId) === String(request.user.id);
  const assignedProvider = request.user.accountType === 'provider' && String(booking.providerId) === String(request.user.providerId);
  if (!isAdmin && !ownsBooking && !assignedProvider) throw new HttpError(403, 'You cannot cancel this booking.');
  if (!['Booking Confirmed', 'Professional Assigned'].includes(booking.status)) {
    throw new HttpError(409, 'This booking can no longer be cancelled.');
  }
  booking.status = 'Booking Cancelled';
  booking.cancelledAt = new Date();
  booking.statusHistory.push({ status: booking.status });
  await booking.save();
  emitBookingStatusChanged(booking);
  const savedBooking = await populateBooking(Booking.findById(booking.id));
  response.json({ booking: bookingDto(savedBooking) });
}

function ensureCanAccessBooking(user, booking) {
  const isCustomer = String(booking.customerId.id) === String(user.id);
  const isProvider = user.accountType === 'provider' && String(booking.providerId.id) === String(user.providerId);
  if (user.accountType !== 'admin' && !isCustomer && !isProvider) {
    throw new HttpError(403, 'You cannot access this booking.');
  }
}