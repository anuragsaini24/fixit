import { analyzeSmartAssistant } from '../services/smartAssistantService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const analyze = asyncHandler(async (request, response) => {
  response.json(await analyzeSmartAssistant(request.validated.body.description, request.validated.body.serviceId));
});