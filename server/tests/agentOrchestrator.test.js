import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createAgentSession, getAgentSession, processAgentMessage } from '../services/agentOrchestrator.js';
import { AgentSession } from '../models/AgentSession.js';

const customerId = '507f1f77bcf86cd799439011';
const sessionId = '507f1f77bcf86cd799439012';
const service = { id: '507f1f77bcf86cd799439013', name: 'AC Repair', category: 'Home repair', keywords: ['ac', 'cooling'], priceFrom: 500 };

function fakeSession(overrides = {}) {
  return {
    id: sessionId,
    _id: sessionId,
    user: customerId,
    messages: [],
    detectedProblem: {},
    collectedInformation: new Map(),
    state: 'collecting_information',
    expiresAt: new Date(Date.now() + 60_000),
    async save() {},
    ...overrides,
  };
}

describe('FixIt agent sessions', () => {
  it('creates sessions owned by the authenticated user with expiration', async () => {
    let created;
    const session = fakeSession();
    const SessionModel = { async create(values) { created = values; return session; } };
    const now = Date.now();
    await createAgentSession(customerId, { SessionModel, now: () => now });
    assert.equal(String(created.user), customerId);
    assert.equal(created.state, 'collecting_information');
    assert.equal(created.expiresAt.getTime(), now + 30 * 60 * 1000);
  });

  it('queries sessions by both id and authenticated owner', async () => {
    let query;
    const SessionModel = { async findOne(value) { query = value; return null; } };
    await assert.rejects(getAgentSession(customerId, sessionId, { SessionModel }), { status: 404 });
    assert.equal(query._id, sessionId);
    assert.equal(query.user, customerId);
  });

  it('marks expired sessions and rejects their use', async () => {
    let saved = false;
    const session = fakeSession({ expiresAt: new Date(Date.now() - 1), async save() { saved = true; } });
    const SessionModel = { async findOne() { return session; } };
    await assert.rejects(getAgentSession(customerId, sessionId, { SessionModel }), { status: 410 });
    assert.equal(session.state, 'expired');
    assert.equal(saved, true);
  });

  it('persists multi-turn follow-up messages and keeps LLM input separate from tools', async () => {
    const session = fakeSession();
    const calls = [];
    const SessionModel = { async findOne(query) { assert.equal(query.user, customerId); return session; } };
    const runTool = async (name, args, context) => {
      calls.push({ name, args, context });
      if (name === 'getActiveServices') return [service];
      throw new Error(`Unexpected tool ${name} during clarification.`);
    };
    const analyze = async (description, availableServices) => {
      assert.equal(availableServices[0].id, service.id);
      assert.doesNotMatch(JSON.stringify(availableServices), /password|connection/i);
      return { service, problemSummary: description, possibleIssues: [], confidence: 'Medium' };
    };

    const first = await processAgentMessage(customerId, sessionId, 'My AC is not cooling.', { SessionModel, runTool, analyze });
    assert.equal(first.state, 'collecting_information');
    assert.match(first.message, /unusual noise/i);
    const second = await processAgentMessage(customerId, sessionId, 'Yes, there is a strange noise.', { SessionModel, runTool, analyze });
    assert.equal(second.state, 'collecting_information');
    assert.match(second.message, /how old/i);
    assert.equal(session.messages.filter((message) => message.role === 'user').length, 2);
    assert.equal(session.messages.filter((message) => message.role === 'assistant').length, 2);
    assert.equal(session.collectedInformation.get('unusualNoise'), 'yes');
    assert.ok(calls.every((call) => call.context.userId === customerId));
    assert.equal(AgentSession.modelName, 'AgentSession');
  });

  it('returns an approval-required recommendation without invoking booking writes', async () => {
    const plumbing = { id: service.id, name: 'Plumbing', category: 'Home repair', keywords: ['plumbing', 'leak'], priceFrom: 250 };
    const provider = { id: '507f1f77bcf86cd799439014', name: 'Ravi Kumar', profession: 'Plumber', rating: 4.9, reviewCount: 80, experience: 10, distance: 2, startingPrice: 350, availableToday: true };
    const session = fakeSession();
    const calledTools = [];
    const runTool = async (name) => {
      calledTools.push(name);
      if (name === 'getActiveServices') return [plumbing];
      if (name === 'estimateServiceCost') return { service: { id: plumbing.id, name: plumbing.name }, min: 250, max: 2500, currency: 'INR', disclaimer: 'Estimate only.' };
      if (name === 'searchProviders') return [provider];
      if (name === 'getProviderDetails') return provider;
      throw new Error(`Unexpected agent tool: ${name}`);
    };
    const SessionModel = { async findOne() { return session; } };
    const response = await processAgentMessage(customerId, sessionId, 'There is a water leak under my kitchen sink.', {
      SessionModel,
      runTool,
      analyze: async () => ({ service: plumbing, problemSummary: 'A leak under the kitchen sink.', possibleIssues: ['Pipe or fitting leak'], confidence: 'High', urgency: 'Medium' }),
    });

    assert.equal(response.state, 'awaiting_approval');
    assert.equal(response.requiresApproval, true);
    assert.equal(response.recommendation.provider.id, provider.id);
    assert.ok(calledTools.includes('searchProviders'));
    assert.ok(calledTools.includes('estimateServiceCost'));
    assert.equal(calledTools.includes('createBooking'), false);
    assert.equal(session.proposedProvider, provider.id);
  });
});