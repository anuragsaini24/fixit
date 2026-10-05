import { Router } from 'express';
import { getProvider, listProviders, updateProviderProfile } from '../controllers/providerController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';

const router = Router();
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Must be a valid ID.');
const querySchema = z.object({
  search: z.string().trim().max(100).optional(),
  serviceId: objectId.optional(),
  state: z.string().trim().max(100).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  availableToday: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
});
const profileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  profession: z.string().trim().min(2).max(100).optional(),
  serviceIds: z.array(objectId).max(30).optional(),
  experience: z.number().min(0).max(80).optional(),
  startingPrice: z.number().min(0).max(10000000).optional(),
  availableToday: z.boolean().optional(),
  location: z.string().trim().max(200).optional(),
  state: z.string().trim().max(100).optional(),
  about: z.string().trim().max(2000).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one profile field is required.');

router.get('/', validate({ query: querySchema }), listProviders);
router.get('/:id', validate({ params: z.object({ id: objectId }) }), getProvider);
router.patch('/me', requireAuth, requireRole('provider'), validate({ body: profileSchema }), updateProviderProfile);

export default router;