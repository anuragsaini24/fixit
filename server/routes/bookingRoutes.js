import { Router } from 'express';
import { cancelBooking, createBooking, getBooking, getCustomerBookings, getProviderBookings, updateBookingStatus } from '../controllers/bookingController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';

const router = Router();
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Must be a valid ID.');
const bookingId = z.string().trim().min(5).max(50);
const createSchema = z.object({
  providerId: objectId,
  serviceId: objectId,
  problem: z.string().trim().min(5).max(2000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value && date >= new Date(new Date().toISOString().slice(0, 10));
  }, 'Booking date must be today or later.'),
  time: z.string().trim().min(1).max(40),
}).strict();
const adminQuery = z.object({ customerId: objectId.optional(), providerId: objectId.optional() });

router.post('/', requireAuth, requireRole('customer'), validate({ body: createSchema }), createBooking);
router.get('/customer', requireAuth, requireRole('customer', 'admin'), validate({ query: adminQuery }), getCustomerBookings);
router.get('/provider', requireAuth, requireRole('provider', 'admin'), validate({ query: adminQuery }), getProviderBookings);
router.get('/:id', requireAuth, validate({ params: z.object({ id: bookingId }) }), getBooking);
router.patch('/:id/status', requireAuth, requireRole('provider', 'admin'), validate({ params: z.object({ id: bookingId }), body: z.object({ status: z.enum(['Professional Assigned', 'Professional On The Way', 'Service Started', 'Service Completed', 'Rejected']) }).strict() }), updateBookingStatus);
router.patch('/:id/cancel', requireAuth, validate({ params: z.object({ id: bookingId }) }), cancelBooking);

export default router;