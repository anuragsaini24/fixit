import { apiRequest } from './authApi';

export const adminUsersApi = {
  async getStats() {
    return apiRequest('/admin/stats', { authenticated: true });
  },
  async getAll() {
    const { users } = await apiRequest('/admin/users', { authenticated: true });
    return users;
  },
  async updateStatus(id, status) {
    const { user } = await apiRequest(`/admin/users/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      authenticated: true,
      body: { status },
    });
    return user;
  },
};