import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { after, before, describe, it } from 'node:test';
import jwt from 'jsonwebtoken';
import { io as createSocketClient } from 'socket.io-client';
import { app } from '../server.js';
import { requireRole } from '../middleware/auth.js';
import { attachSocketServer, bookingStatusPayload, emitBookingCreated, emitBookingStatusChanged, newBookingPayload } from '../realtime/socketServer.js';
import { userDto } from '../utils/userDto.js';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { AgentSession } from '../models/AgentSession.js';

let server;
let socketServer;
let baseUrl;

before(async () => {
  server = createServer(app);
  socketServer = attachSocketServer(server, ['*']);
  server.listen(0);
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (socketServer) await new Promise((resolve) => socketServer.close(resolve));
});

describe('FixIt API', () => {
  it('serializes provider references as stable string IDs', () => {
    const providerId = new mongoose.Types.ObjectId();
    const user = userDto({
      id: 'user-id',
      name: 'Provider',
      email: 'provider@example.com',
      accountType: 'provider',
      status: 'Active',
      providerId,
    });
    assert.equal(user.providerId, providerId.toHexString());
  });

  it('reports MongoDB readiness accurately', async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    const body = await response.json();
    assert.ok([200, 503].includes(response.status));
    assert.equal(body.database, response.status === 200 ? 'connected' : 'disconnected');
  });

  it('validates registration before attempting database access', async () => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: 'short' }),
    });
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.error.message, 'Request validation failed.');
    assert.ok(body.error.details.length >= 3);
  });

  it('validates assistant descriptions before attempting database access', async () => {
    const response = await fetch(`${baseUrl}/api/assistant/analyze`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ description: 'x' }),
    });
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.error.message, 'Request validation failed.');
  });

  it('validates password recovery requests before database access', async () => {
    const forgotResponse = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    });
    const resetResponse = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'bad-token', password: 'short' }),
    });
    assert.equal(forgotResponse.status, 400);
    assert.equal(resetResponse.status, 400);
  });

  it('requires authentication for all agent session endpoints', async () => {
    const requests = [
      ['POST', '/api/assistant/session', {}],
      ['POST', '/api/assistant/session/507f1f77bcf86cd799439011/message', { message: 'My AC is not cooling.' }],
      ['GET', '/api/assistant/session/507f1f77bcf86cd799439011'],
    ];
    for (const [method, path, payload] of requests) {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        ...(payload ? { headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) } : {}),
      });
      assert.equal(response.status, 401, `${method} ${path} should require authentication`);
    }
  });

  it('creates an agent session for a customer identity from the auth token only', async () => {
    const previousSecret = process.env.JWT_SECRET;
    const originalFindById = User.findById;
    const originalCreate = AgentSession.create;
    const secret = randomBytes(32).toString('hex');
    const customerId = '507f1f77bcf86cd799439021';
    const providerId = '507f1f77bcf86cd799439022';
    let capturedSession;
    process.env.JWT_SECRET = secret;
    User.findById = async (id) => ({
      id: String(id),
      accountType: String(id) === providerId ? 'provider' : 'customer',
      status: 'Active',
      sessionVersion: 0,
    });
    AgentSession.create = async (values) => {
      capturedSession = values;
      return { ...values, id: '507f1f77bcf86cd799439023', messages: [], collectedInformation: new Map() };
    };
    try {
      const customerToken = jwt.sign({ sub: customerId }, secret, { expiresIn: '1m' });
      const created = await fetch(`${baseUrl}/api/assistant/session`, {
        method: 'POST',
        headers: { authorization: `Bearer ${customerToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.equal(created.status, 201);
      const session = await created.json();
      assert.equal(session.sessionId, '507f1f77bcf86cd799439023');
      assert.equal(String(capturedSession.user), customerId);

      const spoofed = await fetch(`${baseUrl}/api/assistant/session`, {
        method: 'POST',
        headers: { authorization: `Bearer ${customerToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ user: providerId }),
      });
      assert.equal(spoofed.status, 400);

      const providerToken = jwt.sign({ sub: providerId }, secret, { expiresIn: '1m' });
      const providerRequest = await fetch(`${baseUrl}/api/assistant/session`, {
        method: 'POST',
        headers: { authorization: `Bearer ${providerToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.equal(providerRequest.status, 403);
    } finally {
      User.findById = originalFindById;
      AgentSession.create = originalCreate;
      if (previousSecret === undefined) delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = previousSecret;
    }
  });

  it('protects the current-user endpoint', async () => {
    const response = await fetch(`${baseUrl}/api/auth/me`);
    const body = await response.json();
    assert.equal(response.status, 401);
    assert.equal(body.error.message, 'Authentication is required.');
  });

  it('protects admin user data from unauthenticated users', async () => {
    for (const path of ['/api/admin/stats', '/api/admin/users']) {
      const response = await fetch(`${baseUrl}${path}`);
      const body = await response.json();
      assert.equal(response.status, 401);
      assert.equal(body.error.message, 'Authentication is required.');
    }
  });

  it('rejects expired bearer tokens before reading user data', async () => {
    const previousSecret = process.env.JWT_SECRET;
    const secret = randomBytes(32).toString('hex');
    process.env.JWT_SECRET = secret;
    try {
      const token = jwt.sign({ sub: '507f1f77bcf86cd799439011' }, secret, { expiresIn: -1 });
      const response = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const body = await response.json();
      assert.equal(response.status, 401);
      assert.equal(body.error.message, 'The access token is invalid or expired.');
    } finally {
      if (previousSecret === undefined) delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = previousSecret;
    }
  });

  it('rejects unauthenticated Socket.io connections', async () => {
    const client = createSocketClient(baseUrl, { reconnection: false, transports: ['websocket'] });
    try {
      const issue = await new Promise((resolve) => client.once('connect_error', resolve));
      assert.equal(issue.message, 'unauthorized');
    } finally {
      client.disconnect();
    }
  });

  it('routes booking events only to the authenticated customer and provider', async () => {
    const previousSecret = process.env.JWT_SECRET;
    const originalFindById = User.findById;
    const secret = randomBytes(32).toString('hex');
    process.env.JWT_SECRET = secret;
    const customerId = '507f1f77bcf86cd799439011';
    const providerUserId = '507f1f77bcf86cd799439012';
    const otherUserId = '507f1f77bcf86cd799439013';
    const providerId = '507f1f77bcf86cd799439014';
    const fakeUsers = {
      [customerId]: { id: customerId, accountType: 'customer', status: 'Active' },
      [providerUserId]: { id: providerUserId, accountType: 'provider', status: 'Active', providerId },
      [otherUserId]: { id: otherUserId, accountType: 'customer', status: 'Active' },
    };
    User.findById = (id) => ({ select: async () => fakeUsers[String(id)] || null });
    const makeClient = (userId) => createSocketClient(baseUrl, {
      auth: { token: jwt.sign({ sub: userId }, secret, { expiresIn: '1m' }) },
      reconnection: false,
      transports: ['websocket'],
    });
    const customer = makeClient(customerId);
    const provider = makeClient(providerUserId);
    const other = makeClient(otherUserId);
    let unrelatedEventReceived = false;
    other.onAny(() => { unrelatedEventReceived = true; });

    try {
      await Promise.all([once(customer, 'connect'), once(provider, 'connect'), once(other, 'connect')]);
      const newRequestPromise = once(provider, 'booking:new-request');
      const createdPromise = once(provider, 'booking:created');
      emitBookingCreated({ bookingId: 'FIX-LIVE-1', providerId, service: 'Plumbing', date: '2026-10-04', time: '10:00 AM' });
      const [newRequest, created] = await Promise.all([newRequestPromise, createdPromise]);
      assert.equal(newRequest[0].bookingId, 'FIX-LIVE-1');
      assert.equal(created[0].service, 'Plumbing');

      const customerUpdatePromise = once(customer, 'booking:completed');
      const providerUpdatePromise = once(provider, 'booking:completed');
      emitBookingStatusChanged({ bookingId: 'FIX-LIVE-1', status: 'Service Completed', customerId, providerId });
      const [customerUpdate, providerUpdate] = await Promise.all([customerUpdatePromise, providerUpdatePromise]);
      assert.equal(customerUpdate[0].flowStatus, 'COMPLETED');
      assert.deepEqual(customerUpdate[0], providerUpdate[0]);
      await new Promise((resolve) => setTimeout(resolve, 30));
      assert.equal(unrelatedEventReceived, false);
    } finally {
      customer.disconnect();
      provider.disconnect();
      other.disconnect();
      User.findById = originalFindById;
      if (previousSecret === undefined) delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = previousSecret;
    }
  });

  it('keeps realtime booking payloads free of customer and problem details', () => {
    const booking = {
      bookingId: 'FIX-12345',
      status: 'Professional On The Way',
      service: 'Plumbing',
      date: '2026-10-04',
      time: '10:00 AM',
      customerName: 'Private Customer',
      customerEmail: 'private@example.com',
      problem: 'Private description',
    };
    assert.deepEqual(Object.keys(newBookingPayload(booking)).sort(), ['bookingId', 'date', 'flowStatus', 'service', 'status', 'time'].sort());
    assert.deepEqual(bookingStatusPayload(booking, 'now'), {
      bookingId: 'FIX-12345',
      status: 'Professional On The Way',
      flowStatus: 'ON_THE_WAY',
      updatedAt: 'now',
    });
  });

  it('rejects protected mutations without a token', async () => {
    const requests = [
      ['POST', '/api/services', { name: 'Plumbing', category: 'Home repair' }],
      ['POST', '/api/bookings', { providerId: 'invalid', serviceId: 'invalid', problem: 'Leak', date: '2026-10-04', time: '10:00 AM' }],
      ['PATCH', '/api/providers/me', { about: 'Updated profile' }],
      ['POST', '/api/reviews', { bookingId: 'FIX-12345', rating: 5, sentiment: 'Excellent', comment: 'Great service.' }],
    ];
    for (const [method, path, payload] of requests) {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      assert.equal(response.status, 401, `${method} ${path} should require authentication`);
    }
  });

  it('allows only the explicitly authorized account roles', () => {
    for (const role of ['customer', 'provider', 'admin']) {
      let issue;
      requireRole(role)({ user: { accountType: role } }, {}, (error) => { issue = error; });
      assert.equal(issue, undefined, `${role} should pass its matching role check`);

      requireRole('admin')({ user: { accountType: role } }, {}, (error) => { issue = error; });
      assert.equal(issue?.status, role === 'admin' ? undefined : 403);
    }
  });

  it('rejects malformed service identifiers before querying MongoDB', async () => {
    const response = await fetch(`${baseUrl}/api/services/not-an-object-id`);
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.error.message, 'Request validation failed.');
  });

  it('returns a JSON 404 for unknown API routes', async () => {
    const response = await fetch(`${baseUrl}/api/unknown`);
    const body = await response.json();
    assert.equal(response.status, 404);
    assert.match(body.error.message, /Route not found/);
  });
});