import { Router } from 'express';
import { createReview, listProviderReviews } from '../controllers/reviewController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';

const router = Router();
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Must be a valid ID.');

router.post('/', requireAuth, requireRole('customer'), validate({ body: z.object({
  bookingId: z.string().trim().min(5).max(50),
  rating: z.number().int().min(1).max(5),
  sentiment: z.enum(['Excellent', 'Good', 'Average', 'Poor']),
  comment: z.string().trim().min(3).max(1000),
}).strict() }), createReview);
router.get('/provider/:providerId', validate({ params: z.object({ providerId: objectId }) }), listProviderReviews);

export default router;