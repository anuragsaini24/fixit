import { apiRequest } from './authApi';

export const agentSessionApi = {
  async create() {
    return apiRequest('/assistant/session', { method: 'POST', authenticated: true, body: {} });
  },
  async get(sessionId) {
    return apiRequest(`/assistant/session/${encodeURIComponent(sessionId)}`, { authenticated: true });
  },
  async sendMessage(sessionId, message) {
    return apiRequest(`/assistant/session/${encodeURIComponent(sessionId)}/message`, {
      method: 'POST',
      authenticated: true,
      body: { message },
    });
  },
};