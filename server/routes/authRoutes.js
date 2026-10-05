import { Router } from 'express';
import { currentUser, forgotPassword, login, register, resetPassword } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { z } from 'zod';

const router = Router();
const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  accountType: z.enum(['customer', 'provider']).default('customer'),
  profession: z.string().trim().min(2).max(100).optional(),
}).strict().refine((value) => value.accountType !== 'provider' || Boolean(value.profession), {
  message: 'Profession is required for provider accounts.', path: ['profession'],
});
const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
}).strict();
const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
}).strict();
const resetPasswordSchema = z.object({
  token: z.string().regex(/^[a-f\d]{64}$/i),
  password: z.string().min(8).max(128),
}).strict();

router.post('/register', validate({ body: registerSchema }), register);
router.post('/login', validate({ body: loginSchema }), login);
router.post('/forgot-password', validate({ body: forgotPasswordSchema }), forgotPassword);
router.post('/reset-password', validate({ body: resetPasswordSchema }), resetPassword);
router.get('/me', requireAuth, currentUser);

export default router;