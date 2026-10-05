import { accountSeed, providerSeed, reviewSeed, serviceSeed } from '../data/mockData';
import { catalogApi as backendCatalogApi } from './catalogApi';

export const STORAGE_KEYS = {
  accounts: 'fixit.accounts',
  user: 'fixit.currentUser',
  users: 'fixit.admin.users',
  providers: 'fixit.admin.providers',
  services: 'fixit.admin.services',
  reviews: 'fixit.reviews',
  favorites: 'fixit.favoriteProviderIds',
  messages: 'fixit.messageDrafts',
  customerName: 'fixit.customerName',
  recommendation: 'fixit.recommendedService',
  selectedProvider: 'fixit.selectedProviderId',
};

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

function ensureSeed(key, seed) {
  if (localStorage.getItem(key) === null) writeJson(key, seed);
  return readJson(key, seed);
}

export function initializeMockData() {
  ensureSeed(STORAGE_KEYS.accounts, accountSeed);
  const accounts = all(STORAGE_KEYS.accounts, accountSeed).map(({ password, passwordHash, ...account }) => account);
  writeJson(STORAGE_KEYS.accounts, accounts);
  ensureSeed(STORAGE_KEYS.users, accountSeed.map(({ password, ...user }) => user));
  ensureSeed(STORAGE_KEYS.providers, providerSeed.map((provider, index) => ({ ...provider, accountStatus: index === 0 ? 'Pending' : 'Verified', isActive: true, joinedAt: '2026-01-10' })));
  ensureSeed(STORAGE_KEYS.services, serviceSeed.map((service) => ({ ...service, status: 'Active' })));
  ensureSeed(STORAGE_KEYS.reviews, reviewSeed);
  localStorage.removeItem(STORAGE_KEYS.user);
  ensureSeed(STORAGE_KEYS.favorites, []);
  ensureSeed(STORAGE_KEYS.messages, []);
  ensureSeed('fixit.admin.settings', { platformName: 'FixIt', supportEmail: 'support@fixit.demo', maintenanceMode: false, providerVerificationRequired: true });
}

const pause = (ms = 80) => new Promise((resolve) => setTimeout(resolve, ms));
const all = (key, fallback = []) => readJson(key, fallback);
const save = (key, value) => writeJson(key, value);

export const catalogApi = {
  async getServices() { await pause(); return all(STORAGE_KEYS.services, serviceSeed); },
  async getProviders(filters = {}) {
    await pause();
    const providers = all(STORAGE_KEYS.providers, providerSeed);
    const services = all(STORAGE_KEYS.services, serviceSeed);
    const serviceId = filters.serviceId || '';
    return providers.filter((provider) => {
      const serviceMatch = !serviceId || (provider.serviceIds || []).includes(serviceId) || (provider.services || []).some((name) => name.toLowerCase().includes(filters.serviceName?.toLowerCase() || ''));
      const searchMatch = !filters.search || `${provider.name} ${provider.profession} ${provider.location}`.toLowerCase().includes(filters.search.toLowerCase());
      const stateMatch = !filters.state || provider.state === filters.state;
      const priceMatch = !filters.maxPrice || Number(provider.startingPrice) <= Number(filters.maxPrice);
      const ratingMatch = !filters.minRating || Number(provider.rating) >= Number(filters.minRating);
      const availableMatch = !filters.availableToday || provider.availableToday;
      const activeMatch = provider.isActive !== false && provider.accountStatus !== 'Rejected';
      return serviceMatch && searchMatch && stateMatch && priceMatch && ratingMatch && availableMatch && activeMatch;
    }).map((provider) => ({ ...provider, services: provider.services || services.filter((service) => (provider.serviceIds || []).includes(service.id)).map((service) => service.name) }));
  },
  async getProvider(id) { await pause(); return all(STORAGE_KEYS.providers, providerSeed).find((provider) => provider.id === id) || null; },
  async getService(id) { await pause(); return all(STORAGE_KEYS.services, serviceSeed).find((service) => service.id === id) || null; },
};

export const reviewApi = {
  async getAll() { await pause(); return all(STORAGE_KEYS.reviews, reviewSeed); },
  async create({ booking, rating, sentiment, comment, customerId }) {
    await pause();
    const reviews = all(STORAGE_KEYS.reviews, reviewSeed);
    if (reviews.some((review) => review.bookingId === booking.bookingId)) throw new Error('This booking already has a review.');
    const review = { id: `rev-${Date.now().toString(36)}`, bookingId: booking.bookingId, providerId: booking.provider.id, providerName: booking.provider.name, customerId, customerName: booking.customer?.name || 'Guest Customer', rating: Number(rating), sentiment, comment: comment.trim(), createdAt: new Date().toISOString(), flagged: false };
    save(STORAGE_KEYS.reviews, [...reviews, review]);
    return review;
  },
};

export const recommendationApi = {
  async recommend(description) {
    const text = description.toLowerCase();
    const services = await backendCatalogApi.getServices();
    const match = services.map((service) => ({ service, matches: (service.keywords || []).filter((keyword) => text.includes(keyword.toLowerCase())) })).sort((a, b) => b.matches.length - a.matches.length)[0];
    if (!match?.matches.length) return null;
    return { ...match.service, matchedKeywords: match.matches, possibleIssues: ['Inspection and diagnosis', 'Parts or component repair', 'Safety and function check'], minCost: match.service.priceFrom, maxCost: match.service.priceFrom * 4, professionalsCount: (await backendCatalogApi.getProviders({ serviceId: match.service.id })).length };
  },
};

export const adminApi = {
  async getUsers() { await pause(); return all(STORAGE_KEYS.users, []); },
  async getProviders() { await pause(); return all(STORAGE_KEYS.providers, providerSeed); },
  async getReviews() { return reviewApi.getAll(); },
  async updateUser(id, patch) {
    const rows = all(STORAGE_KEYS.users, []);
    const next = rows.map((row) => row.id === id ? { ...row, ...patch } : row);
    save(STORAGE_KEYS.users, next);
    const accounts = all(STORAGE_KEYS.accounts, accountSeed);
    save(STORAGE_KEYS.accounts, accounts.map((account) => account.id === id ? { ...account, ...patch } : account));
    return next;
  },
  async updateProvider(id, patch) { const rows = all(STORAGE_KEYS.providers, providerSeed); const next = rows.map((row) => row.id === id ? { ...row, ...patch } : row); save(STORAGE_KEYS.providers, next); return next; },
};
