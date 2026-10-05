import { createAgentSession, getAgentSession, processAgentMessage } from '../services/agentOrchestrator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createSession = asyncHandler(async (request, response) => {
  response.status(201).json(await createAgentSession(request.user.id));
});

export const getSession = asyncHandler(async (request, response) => {
  response.json(await getAgentSession(request.user.id, request.validated.params.sessionId));
});

export const sendMessage = asyncHandler(async (request, response) => {
  response.json(await processAgentMessage(request.user.id, request.validated.params.sessionId, request.validated.body.message));
});