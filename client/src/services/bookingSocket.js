import { io } from 'socket.io-client';
import { clearAuthToken, getAccessToken } from './authApi';

export const BOOKING_EVENTS = [
  'booking:new-request',
  'booking:created',
  'booking:accepted',
  'booking:rejected',
  'booking:assigned',
  'booking:on-the-way',
  'booking:started',
  'booking:completed',
  'booking:cancelled',
];

function socketOrigin() {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  return /^https?:\/\//i.test(apiUrl) ? new URL(apiUrl).origin : undefined;
}

export function connectBookingSocket(onEvent) {
  const token = getAccessToken();
  if (!token) return () => {};

  const socket = io(socketOrigin(), {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    timeout: 10000,
  });

  for (const event of BOOKING_EVENTS) socket.on(event, (payload) => onEvent({ ...payload, event }));
  socket.on('connect', () => onEvent({ event: 'socket:connected' }));
  socket.on('connect_error', (error) => {
    if (error.message === 'unauthorized') {
      clearAuthToken();
      window.dispatchEvent(new Event('fixit:auth-expired'));
      socket.disconnect();
    }
  });
  socket.on('auth:expired', () => {
    clearAuthToken();
    window.dispatchEvent(new Event('fixit:auth-expired'));
    socket.disconnect();
  });

  return () => socket.disconnect();
}