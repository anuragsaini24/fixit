export const AUTH_TOKEN_KEY = 'fixit.accessToken';

const apiBaseUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export function getAccessToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function apiRequest(path, { authenticated = false, ...options } = {}) {
  const headers = new Headers(options.headers);
  let body = options.body;

  if (body !== undefined && typeof body !== 'string') {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(body);
  }

  const token = getAccessToken();
  if (authenticated && token) headers.set('Authorization', `Bearer ${token}`);

  let response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers, body });
  } catch {
    throw new Error('Cannot connect to the FixIt API. Check that the backend is running.');
  }

  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    if (authenticated && response.status === 401) {
      clearAuthToken();
      window.dispatchEvent(new Event('fixit:auth-expired'));
    }
    const error = new Error(payload?.error?.message || `The request failed (${response.status}).`);
    error.status = response.status;
    error.details = payload?.error?.details;
    throw error;
  }
  return payload;
}

export const authApi = {
  async login(email, password) {
    const result = await apiRequest('/auth/login', { method: 'POST', body: { email, password } });
    localStorage.setItem(AUTH_TOKEN_KEY, result.token);
    return result.user;
  },
  async register(values) {
    const result = await apiRequest('/auth/register', { method: 'POST', body: values });
    localStorage.setItem(AUTH_TOKEN_KEY, result.token);
    return result.user;
  },
  async getCurrentUser() {
    const result = await apiRequest('/auth/me', { authenticated: true });
    return result.user;
  },
  async requestPasswordReset(email) {
    return apiRequest('/auth/forgot-password', { method: 'POST', body: { email } });
  },
  async resetPassword(token, password) {
    return apiRequest('/auth/reset-password', { method: 'POST', body: { token, password } });
  },
  getAccessToken,
  logout: clearAuthToken,
};