import { Router } from 'express';
import { z } from 'zod';
import { analyze } from '../controllers/smartAssistantController.js';
import { createSession, getSession, sendMessage } from '../controllers/agentController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const schema = z.object({
  description: z.string().trim().min(3).max(500),
  serviceId: z.string().regex(/^[a-f\d]{24}$/i, 'Must be a valid ID.').optional(),
}).strict();

router.post('/analyze', validate({ body: schema }), analyze);

const sessionIdSchema = z.object({ sessionId: z.string().regex(/^[a-f\d]{24}$/i) });
const customerOnly = [requireAuth, requireRole('customer')];

router.post('/session', ...customerOnly, validate({ body: z.object({}).strict() }), createSession);
router.post('/session/:sessionId/message', ...customerOnly, validate({
  params: sessionIdSchema,
  body: z.object({ message: z.string().trim().min(1).max(1000) }).strict(),
}), sendMessage);
router.get('/session/:sessionId', ...customerOnly, validate({ params: sessionIdSchema }), getSession);

export default router;