import { Router } from 'express';
import { z } from 'zod';
import { getAdminStats, listAdminUsers, updateAdminUserStatus } from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Must be a valid ID.');
const adminOnly = [requireAuth, requireRole('admin')];

router.get('/stats', ...adminOnly, getAdminStats);
router.get('/users', ...adminOnly, listAdminUsers);
router.patch('/users/:id/status', ...adminOnly, validate({
  params: z.object({ id: objectId }),
  body: z.object({ status: z.enum(['Active', 'Inactive']) }).strict(),
}), updateAdminUserStatus);

export default router;