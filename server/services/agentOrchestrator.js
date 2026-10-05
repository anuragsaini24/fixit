import { AgentSession } from '../models/AgentSession.js';
import { HttpError } from '../utils/httpError.js';
import { executeAgentTool } from './agentTools.js';
import { getSafetyAdvice, matchFallbackService, rankProviders, requestAiAnalysis } from './smartAssistantService.js';

const MAX_MESSAGES = 30;
const terminalStates = new Set(['booking_confirmed', 'completed', 'cancelled', 'expired', 'awaiting_approval']);
const publicInformationKeys = ['unusualNoise', 'equipmentAge', 'additionalDetails', 'providerLocation'];

function mapGet(session, key) {
  const values = session.collectedInformation;
  return typeof values?.get === 'function' ? values.get(key) : values?.[key];
}

function mapSet(session, key, value) {
  if (typeof session.collectedInformation?.set === 'function') session.collectedInformation.set(key, value);
  else session.collectedInformation = { ...(session.collectedInformation || {}), [key]: value };
}

function mapDelete(session, key) {
  if (typeof session.collectedInformation?.delete === 'function') session.collectedInformation.delete(key);
  else if (session.collectedInformation) delete session.collectedInformation[key];
}

function getSessionMessages(session) {
  return session.messages.map(({ role, content, createdAt }) => ({ role, content, createdAt }));
}

function publicSession(session) {
  const storedInformation = Object.fromEntries(session.collectedInformation || []);
  return {
    sessionId: String(session.id || session._id),
    state: session.state,
    messages: getSessionMessages(session),
    detectedProblem: session.detectedProblem?.category ? session.detectedProblem : null,
    detectedService: session.detectedService ? String(session.detectedService._id || session.detectedService) : null,
    collectedInformation: Object.fromEntries(publicInformationKeys.filter((key) => storedInformation[key] !== undefined).map((key) => [key, storedInformation[key]])),
    proposedProvider: session.proposedProvider ? String(session.proposedProvider._id || session.proposedProvider) : null,
    proposedDate: session.proposedDate || null,
    proposedTime: session.proposedTime || null,
    estimatedCost: session.estimatedCost || null,
    expiresAt: session.expiresAt,
  };
}

function addMessage(session, role, content) {
  session.messages.push({ role, content: content.slice(0, 1200) });
  if (session.messages.length > MAX_MESSAGES) session.messages.splice(0, session.messages.length - MAX_MESSAGES);
}

async function loadOwnedSession(userId, sessionId, SessionModel = AgentSession) {
  const session = await SessionModel.findOne({ _id: sessionId, user: userId });
  if (!session) throw new HttpError(404, 'Agent session not found.');
  if (session.expiresAt <= new Date()) {
    session.state = 'expired';
    await session.save();
    throw new HttpError(410, 'Agent session expired. Start a new session.');
  }
  return session;
}

function combinedUserDescription(session) {
  return session.messages.filter((message) => message.role === 'user').map((message) => message.content).slice(-10).join('\n').slice(0, 3000);
}

function isAirConditioner(service) {
  return /\b(ac|air conditioner|air conditioning|hvac)\b/i.test(`${service.name} ${service.category}`);
}

function resolvePendingAnswer(session, message) {
  const pending = mapGet(session, 'pendingFollowUp');
  if (!pending) return;
  if (pending === 'ac_noise') {
    const negative = /\b(no|not|none|quiet|without)\b/i.test(message);
    mapSet(session, 'unusualNoise', negative ? 'no' : 'yes');
  } else if (pending === 'ac_age') {
    mapSet(session, 'equipmentAge', message.trim().slice(0, 100));
  } else if (pending === 'generic_details') {
    mapSet(session, 'additionalDetails', message.trim().slice(0, 300));
  } else if (pending === 'provider_location') {
    mapSet(session, 'providerLocation', message.trim().slice(0, 100));
  }
  mapDelete(session, 'pendingFollowUp');
}

function detectAirConditionerDetails(session, description) {
  if (!mapGet(session, 'unusualNoise') && /\b(noise|noisy|sound|rattle|rattling|buzz|buzzing|grinding)\b/i.test(description)) {
    mapSet(session, 'unusualNoise', /\b(no noise|not noisy|no unusual sound|quiet)\b/i.test(description) ? 'no' : 'yes');
  }
  if (!mapGet(session, 'equipmentAge')) {
    const age = description.match(/\b(\d{1,2})\s*(years?|yrs?|months?)\b/i);
    if (age) mapSet(session, 'equipmentAge', age[0]);
  }
}

function nextFollowUp(session, service, confidence, description, userTurnCount) {
  if (isAirConditioner(service)) {
    detectAirConditionerDetails(session, description);
    if (!mapGet(session, 'unusualNoise')) {
      mapSet(session, 'pendingFollowUp', 'ac_noise');
      return 'Is the AC making any unusual noise?';
    }
    if (mapGet(session, 'unusualNoise') === 'yes' && !mapGet(session, 'equipmentAge')) {
      mapSet(session, 'pendingFollowUp', 'ac_age');
      return 'Approximately how old is the AC?';
    }
  }
  if (confidence === 'Low' && userTurnCount === 1 && !mapGet(session, 'genericDetailsAsked')) {
    mapSet(session, 'genericDetailsAsked', 'yes');
    mapSet(session, 'pendingFollowUp', 'generic_details');
    return 'Could you share one more detail about when the problem happens?';
  }
  return '';
}

function responseFor(session, message, extra = {}) {
  return { ...publicSession(session), message, requiresApproval: false, ...extra };
}

export async function createAgentSession(userId, { SessionModel = AgentSession, now = Date.now } = {}) {
  const configuredTtl = Number(process.env.AGENT_SESSION_TTL_MINUTES || 30);
  const ttlMinutes = Number.isInteger(configuredTtl) ? Math.min(120, Math.max(5, configuredTtl)) : 30;
  const session = await SessionModel.create({
    user: userId,
    messages: [],
    collectedInformation: {},
    state: 'collecting_information',
    expiresAt: new Date(now() + ttlMinutes * 60 * 1000),
  });
  return publicSession(session);
}

export async function getAgentSession(userId, sessionId, { SessionModel = AgentSession } = {}) {
  const session = await loadOwnedSession(userId, sessionId, SessionModel);
  const result = publicSession(session);
  if (session.state !== 'awaiting_approval' || !session.proposedProvider || !session.detectedService || !session.estimatedCost) {
    return { ...result, requiresApproval: false };
  }

  const context = { userId: String(userId) };
  const [provider, services] = await Promise.all([
    executeAgentTool('getProviderDetails', { providerId: String(session.proposedProvider) }, context),
    executeAgentTool('getActiveServices', {}, context),
  ]);
  const service = services.find((item) => item.id === String(session.detectedService));
  if (!provider || !service) return { ...result, requiresApproval: true };

  return {
    ...result,
    requiresApproval: true,
    recommendation: {
      provider: { ...provider, reason: 'Recommended based on this service match and professional profile.' },
      service: { id: service.id, name: service.name, category: service.category },
      estimatedCost: { ...session.estimatedCost, disclaimer: 'Estimated price only. Final price may vary after professional inspection.' },
      availableTime: provider.availableToday
        ? 'Provider profile indicates availability today; the exact time must be confirmed in the existing booking flow.'
        : 'No same-day availability is listed; confirm a suitable date and time in the existing booking flow.',
    },
  };
}

export async function processAgentMessage(userId, sessionId, content, { SessionModel = AgentSession, runTool = executeAgentTool, analyze = requestAiAnalysis } = {}) {
  const session = await loadOwnedSession(userId, sessionId, SessionModel);
  if (terminalStates.has(session.state)) throw new HttpError(409, 'This agent session is no longer accepting messages. Start a new session.');

  const message = content.trim();
  resolvePendingAnswer(session, message);
  addMessage(session, 'user', message);
  session.state = 'analyzing';
  await session.save();

  const context = { userId: String(userId) };
  const services = await runTool('getActiveServices', {}, context);
  if (!services.length) {
    session.state = 'collecting_information';
    const reply = 'There are no active FixIt services to match yet. Please ask an administrator to add services.';
    addMessage(session, 'assistant', reply);
    await session.save();
    return responseFor(session, reply);
  }

  const description = combinedUserDescription(session);
  let analysis = null;
  try {
    analysis = await analyze(description, services);
  } catch {
    analysis = null;
  }
  const fallback = analysis ? null : matchFallbackService(description, services);
  const selected = analysis || (fallback ? {
    service: fallback.service,
    problemSummary: description,
    possibleIssues: [],
    urgency: getSafetyAdvice(description) ? 'High' : 'Medium',
    recommendedProviderType: `${fallback.service.name} Specialist`,
    confidence: fallback.matchedKeywords.length > 1 ? 'Medium' : 'Low',
  } : null);

  if (!selected) {
    session.state = 'collecting_information';
    const reply = 'I could not confidently identify a FixIt service yet. What device or home system is affected?';
    addMessage(session, 'assistant', reply);
    await session.save();
    return responseFor(session, reply);
  }

  const service = selected.service;
  const serviceId = String(service.id || service._id);
  session.detectedService = serviceId;
  session.detectedProblem = {
    category: service.category || service.name,
    description: (selected.problemSummary || description).slice(0, 500),
  };

  const userTurnCount = session.messages.filter((entry) => entry.role === 'user').length;
  const question = nextFollowUp(session, service, selected.confidence, description, userTurnCount);
  if (question) {
    session.state = 'collecting_information';
    addMessage(session, 'assistant', question);
    await session.save();
    return responseFor(session, question, { detectedProblem: session.detectedProblem });
  }

  const estimate = await runTool('estimateServiceCost', { serviceId }, context);
  if (!estimate) {
    session.state = 'collecting_information';
    const reply = 'I identified the service, but its price estimate is unavailable. Please try again later.';
    addMessage(session, 'assistant', reply);
    await session.save();
    return responseFor(session, reply);
  }

  const location = mapGet(session, 'providerLocation');
  const providers = await runTool('searchProviders', { serviceId, ...(location ? { search: location } : {}), limit: 5 }, context);
  if (!providers.length && !location) {
    session.state = 'searching_providers';
    mapSet(session, 'pendingFollowUp', 'provider_location');
    const reply = 'I identified the service, but could not find a matching professional yet. Which city or area should I search?';
    addMessage(session, 'assistant', reply);
    await session.save();
    return responseFor(session, reply, { detectedProblem: session.detectedProblem });
  }
  if (!providers.length) {
    session.state = 'searching_providers';
    const reply = 'I could not find a matching professional in that area. You can try another nearby area.';
    mapSet(session, 'pendingFollowUp', 'provider_location');
    addMessage(session, 'assistant', reply);
    await session.save();
    return responseFor(session, reply);
  }

  const rankedProviders = rankProviders(providers, service, estimate);
  const provider = await runTool('getProviderDetails', { providerId: rankedProviders[0].id }, context);
  session.proposedProvider = rankedProviders[0].id;
  session.estimatedCost = { min: estimate.min, max: estimate.max, currency: estimate.currency };
  session.state = 'awaiting_approval';
  const availability = rankedProviders[0].availableToday
    ? 'Provider profile indicates availability today; the exact time must be confirmed in the existing booking flow.'
    : 'No same-day availability is listed; confirm a suitable date and time in the existing booking flow.';
  const reply = `Based on the symptoms you described, ${service.name} is the most suitable service. I found a matching professional; please review this recommendation before continuing.`;
  addMessage(session, 'assistant', reply);
  await session.save();
  return responseFor(session, reply, {
    requiresApproval: true,
    recommendation: {
      provider: { ...(provider || rankedProviders[0]), reason: rankedProviders[0].reason },
      service: { id: serviceId, name: service.name, category: service.category },
      estimatedCost: estimate,
      availableTime: availability,
      possibleIssues: selected.possibleIssues || [],
      urgency: getSafetyAdvice(description) ? 'High' : selected.urgency || 'Medium',
      confidence: selected.confidence || 'Medium',
      safetyAdvice: getSafetyAdvice(description),
    },
  });
}