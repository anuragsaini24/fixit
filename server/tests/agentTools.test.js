import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AGENT_TOOL_NAMES, executeAgentTool } from '../services/agentTools.js';

describe('FixIt agent tool registry', () => {
  it('exposes only explicitly allow-listed read-only tools', () => {
    assert.deepEqual(AGENT_TOOL_NAMES, [
      'getActiveServices',
      'searchProviders',
      'getProviderDetails',
      'checkProviderAvailability',
      'estimateServiceCost',
      'getBookingStatus',
    ]);
    assert.equal(AGENT_TOOL_NAMES.includes('createBooking'), false);
    assert.equal(AGENT_TOOL_NAMES.includes('sendNotification'), false);
  });

  it('rejects unknown tools without executing arbitrary functions', async () => {
    await assert.rejects(executeAgentTool('createBooking', {}, { userId: '507f1f77bcf86cd799439011' }), /Unknown agent tool/);
    await assert.rejects(executeAgentTool('runJavaScript', {}, { userId: '507f1f77bcf86cd799439011' }), /Unknown agent tool/);
  });

  it('requires authenticated context before running any tool', async () => {
    await assert.rejects(executeAgentTool('getActiveServices', {}, {}), /Authenticated user context/);
  });

  it('rejects invalid or extra tool arguments before database access', async () => {
    await assert.rejects(executeAgentTool('getProviderDetails', { providerId: 'not-an-id' }, { userId: '507f1f77bcf86cd799439011' }), /Invalid arguments/);
    await assert.rejects(executeAgentTool('getActiveServices', { collection: 'users' }, { userId: '507f1f77bcf86cd799439011' }), /Invalid arguments/);
  });
});