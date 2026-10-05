import { apiRequest } from './authApi';

async function requestBooking(path, options = {}) {
  const result = await apiRequest(path, { ...options, authenticated: true });
  return result?.booking ?? result?.bookings ?? result;
}

export const bookingApi = {
  async getAll() {
    return requestBooking('/bookings/customer');
  },
  async getForCustomer() {
    return requestBooking('/bookings/customer');
  },
  async getForProvider() {
    return requestBooking('/bookings/provider');
  },
  async getById(id) {
    return requestBooking(`/bookings/${encodeURIComponent(id)}`);
  },
  async create({ providerId, serviceId, problem, date, time, provider }) {
    return requestBooking('/bookings', {
      method: 'POST',
      body: {
        providerId: providerId || provider?.id,
        serviceId,
        problem,
        date,
        time,
      },
    });
  },
  async updateStatus(id, status) {
    return requestBooking(`/bookings/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status } });
  },
  async cancel(id) {
    return requestBooking(`/bookings/${encodeURIComponent(id)}/cancel`, { method: 'PATCH', body: {} });
  },
};