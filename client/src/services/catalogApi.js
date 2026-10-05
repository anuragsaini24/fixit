import { apiRequest } from './authApi';

export const catalogApi = {
  async getServices() {
    const { services } = await apiRequest('/services');
    return services;
  },
  async getService(id) {
    const { service } = await apiRequest(`/services/${encodeURIComponent(id)}`);
    return service;
  },
  async createService(values) {
    const { service } = await apiRequest('/services', { method: 'POST', authenticated: true, body: values });
    return service;
  },
  async updateService(id, values) {
    const { service } = await apiRequest(`/services/${encodeURIComponent(id)}`, { method: 'PATCH', authenticated: true, body: values });
    return service;
  },
  async deleteService(id) {
    await apiRequest(`/services/${encodeURIComponent(id)}`, { method: 'DELETE', authenticated: true });
  },
  async getProviders(filters = {}) {
    const params = new URLSearchParams();
    for (const key of ['serviceId', 'search', 'state', 'minRating', 'maxPrice']) {
      if (filters[key] !== undefined && filters[key] !== '') params.set(key, filters[key]);
    }
    if (filters.availableToday) params.set('availableToday', 'true');
    const suffix = params.size ? `?${params}` : '';
    const { providers } = await apiRequest(`/providers${suffix}`);
    return providers;
  },
  async getProvider(id) {
    const { provider } = await apiRequest(`/providers/${encodeURIComponent(id)}`);
    return provider;
  },
  async updateMyProviderProfile(values) {
    const { provider } = await apiRequest('/providers/me', { method: 'PATCH', authenticated: true, body: values });
    return provider;
  },
};