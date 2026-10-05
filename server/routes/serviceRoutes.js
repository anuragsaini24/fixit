import { Router } from 'express';
import { createService, deleteService, getService, listServices, updateService } from '../controllers/serviceController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';

const router = Router();
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Must be a valid ID.');
const serviceFields = {
  name: z.string().trim().min(2).max(100),
  category: z.string().trim().min(2).max(100),
  detail: z.string().trim().max(500).optional(),
  icon: z.string().trim().max(50).optional(),
  keywords: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
  priceFrom: z.number().min(0).optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
};
const createSchema = z.object({ ...serviceFields, name: serviceFields.name, category: serviceFields.category }).strict();
const updateSchema = z.object(serviceFields).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required.');

router.get('/', validate({ query: z.object({ search: z.string().trim().max(100).optional(), category: z.string().trim().max(100).optional(), status: z.enum(['Active', 'Inactive']).optional() }) }), listServices);
router.get('/:id', validate({ params: z.object({ id: objectId }) }), getService);
router.post('/', requireAuth, requireRole('admin'), validate({ body: createSchema }), createService);
router.patch('/:id', requireAuth, requireRole('admin'), validate({ params: z.object({ id: objectId }), body: updateSchema }), updateService);
router.delete('/:id', requireAuth, requireRole('admin'), validate({ params: z.object({ id: objectId }) }), deleteService);

export default router;