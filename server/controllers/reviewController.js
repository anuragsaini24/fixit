import { Booking } from '../models/Booking.js';
import { Provider } from '../models/Provider.js';
import { Review } from '../models/Review.js';
import { getProviderReviews } from '../services/providerService.js';
import { HttpError } from '../utils/httpError.js';

export async function createReview(request, response) {
  const { bookingId, rating, sentiment, comment } = request.validated.body;
  const booking = await Booking.findOne({ bookingId }).populate('customerId', 'name').populate('providerId', 'name');
  if (!booking) throw new HttpError(404, 'Booking not found.');
  if (String(booking.customerId.id) !== String(request.user.id)) throw new HttpError(403, 'You can only review your own bookings.');
  if (booking.status !== 'Service Completed') throw new HttpError(409, 'Only completed bookings can be reviewed.');

  const review = await Review.create({
    bookingId: booking.id,
    providerId: booking.providerId.id,
    customerId: request.user.id,
    providerName: booking.providerId.name,
    customerName: booking.customerId.name,
    rating,
    sentiment,
    comment,
  });
  const [aggregate] = await Review.aggregate([
    { $match: { providerId: booking.providerId._id } },
    { $group: { _id: '$providerId', rating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
  ]);
  if (aggregate) await Provider.findByIdAndUpdate(booking.providerId.id, { rating: aggregate.rating, reviewCount: aggregate.reviewCount });
  response.status(201).json({ review });
}

export async function listProviderReviews(request, response) {
  if (!(await Provider.exists({ _id: request.validated.params.providerId }))) throw new HttpError(404, 'Provider not found.');
  response.json({ reviews: await getProviderReviews(request.validated.params.providerId) });
}