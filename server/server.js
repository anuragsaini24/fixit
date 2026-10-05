import 'dotenv/config';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { ensureAdminAccount } from './services/authService.js';
import { optionalAuth, requireAuth } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { HttpError } from './utils/httpError.js';
import { attachSocketServer } from './realtime/socketServer.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import providerRoutes from './routes/providerRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import smartAssistantRoutes from './routes/smartAssistantRoutes.js';

export const app = express();
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((origin) => origin.trim()).filter(Boolean);
const configuredAuthRateLimit = Number(process.env.AUTH_RATE_LIMIT);
const defaultAuthRateLimit = process.env.NODE_ENV === 'production' ? 30 : 100;
const authRateLimit = Number.isInteger(configuredAuthRateLimit) && configuredAuthRateLimit > 0
  ? configuredAuthRateLimit
  : defaultAuthRateLimit;

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new HttpError(403, 'This origin is not allowed.'));
  },
}));
app.use(express.json({ limit: '100kb' }));
app.get('/api/health', (request, response) => {
  const connected = mongoose.connection.readyState === 1;
  response.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'unavailable',
    database: connected ? 'connected' : 'disconnected',
  });
});
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: authRateLimit, standardHeaders: true, legacyHeaders: false }), authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/services', optionalAuth, serviceRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/bookings', requireAuth, bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/assistant', smartAssistantRoutes);
app.use(notFound);
app.use(errorHandler);

export async function startServer() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters.');
  }
  await connectDatabase();
  await ensureAdminAccount();
  const port = Number(process.env.PORT || 4000);
  const server = createServer(app);
  attachSocketServer(server, allowedOrigins);
  server.listen(port, () => console.info(`FixIt API listening on port ${port}.`));

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, async () => {
      server.close();
      await disconnectDatabase();
      process.exit(0);
    });
  }
  return server;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  startServer().catch(async (error) => {
    console.error('FixIt API failed to start.', error.message);
    await disconnectDatabase();
    process.exitCode = 1;
  });
}