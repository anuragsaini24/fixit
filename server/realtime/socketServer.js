import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { User } from '../models/User.js';

let io;

const eventByStatus = {
  'Professional Assigned': ['booking:accepted', 'booking:assigned'],
  'Professional On The Way': ['booking:on-the-way'],
  'Service Started': ['booking:started'],
  'Service Completed': ['booking:completed'],
  'Booking Cancelled': ['booking:cancelled'],
  Rejected: ['booking:rejected'],
};

const flowStatusByStatus = {
  'Booking Confirmed': 'CONFIRMED',
  'Professional Assigned': 'ASSIGNED',
  'Professional On The Way': 'ON_THE_WAY',
  'Service Started': 'STARTED',
  'Service Completed': 'COMPLETED',
  'Booking Cancelled': 'CANCELLED',
  Rejected: 'REJECTED',
};

export function attachSocketServer(httpServer, allowedOrigins) {
  io = new Server(httpServer, {
    cors: { origin: allowedOrigins, credentials: false },
    connectionStateRecovery: { maxDisconnectionDuration: 2 * 60 * 1000 },
  });

  io.use(async (socket, next) => {
    const header = socket.handshake.headers.authorization || '';
    const token = socket.handshake.auth?.token || (header.startsWith('Bearer ') ? header.slice(7) : '');
    if (!token || !process.env.JWT_SECRET) return next(new Error('unauthorized'));

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.sub).select('_id accountType status providerId');
      if (!user || user.status !== 'Active') return next(new Error('unauthorized'));
      socket.data.userId = String(user.id);
      socket.data.accountType = user.accountType;
      socket.data.providerId = user.providerId ? String(user.providerId) : null;
      socket.data.expiresAt = payload.exp ? payload.exp * 1000 : null;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.data.userId}`);
    if (socket.data.accountType === 'provider' && socket.data.providerId) {
      socket.join(`provider:${socket.data.providerId}`);
    }
    if (socket.data.accountType === 'admin') socket.join('admins');
    if (socket.data.expiresAt) {
      const remaining = socket.data.expiresAt - Date.now();
      if (remaining <= 0) {
        socket.emit('auth:expired');
        socket.disconnect(true);
      }
      else {
        const expiryTimer = setTimeout(() => {
          socket.emit('auth:expired');
          socket.disconnect(true);
        }, remaining);
        socket.once('disconnect', () => clearTimeout(expiryTimer));
      }
    }
  });

  return io;
}

export function newBookingPayload(booking) {
  return {
    bookingId: booking.bookingId,
    status: 'Booking Confirmed',
    flowStatus: 'CONFIRMED',
    service: booking.service,
    date: booking.date,
    time: booking.time,
  };
}

export function bookingStatusPayload(booking, updatedAt = new Date().toISOString()) {
  return {
    bookingId: booking.bookingId,
    status: booking.status,
    flowStatus: flowStatusByStatus[booking.status] || 'CONFIRMED',
    updatedAt,
  };
}

export function emitBookingCreated(booking) {
  if (!io) return;
  const payload = newBookingPayload(booking);
  io.to(`provider:${String(booking.providerId)}`).emit('booking:new-request', payload);
  io.to(`provider:${String(booking.providerId)}`).emit('booking:created', payload);
}

export function emitBookingStatusChanged(booking) {
  if (!io) return;
  const payload = bookingStatusPayload(booking);
  const rooms = [`user:${String(booking.customerId)}`, `provider:${String(booking.providerId)}`];
  for (const event of eventByStatus[booking.status] || []) {
    for (const room of rooms) io.to(room).emit(event, payload);
  }
}