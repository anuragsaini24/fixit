import { apiRequest } from './authApi';

export const smartAssistantApi = {
  async analyze(description, serviceId) {
    return apiRequest('/assistant/analyze', {
      method: 'POST',
      body: { description, ...(serviceId ? { serviceId } : {}) },
    });
  },
};