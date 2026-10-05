import { Review } from '../models/Review.js';
import { Provider } from '../models/Provider.js';

export function buildProviderFilter({ search, serviceId, state, minRating, maxPrice, availableToday } = {}) {
  const filter = { isActive: true, accountStatus: { $ne: 'Rejected' } };
  if (serviceId) filter.serviceIds = serviceId;
  if (state) filter.state = new RegExp(`^${escapeRegex(state)}$`, 'i');
  if (minRating !== undefined) filter.rating = { $gte: minRating };
  if (maxPrice !== undefined) filter.startingPrice = { $lte: maxPrice };
  if (availableToday !== undefined) filter.availableToday = availableToday;
  if (search) {
    const expression = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: expression }, { profession: expression }, { location: expression }];
  }
  return filter;
}

export async function searchProviders(filters = {}) {
  const providers = await Provider.find(buildProviderFilter(filters))
    .populate('serviceIds', 'name')
    .sort({ rating: -1, reviewCount: -1 });
  return providers.map((provider) => providerDto(provider));
}

export async function getProviderDetails(providerId) {
  const provider = await Provider.findOne({ _id: providerId, isActive: true, accountStatus: { $ne: 'Rejected' } })
    .populate('serviceIds', 'name');
  if (!provider) return null;
  return providerDto(provider, await getProviderReviews(provider.id));
}

export function providerDto(provider, reviews = []) {
  return {
    id: String(provider.id),
    name: provider.name,
    profession: provider.profession,
    serviceIds: provider.serviceIds.map((service) => String(service._id || service)),
    services: provider.services.length
      ? provider.services
      : provider.serviceIds.filter((service) => service.name).map((service) => service.name),
    rating: provider.rating,
    reviewCount: provider.reviewCount,
    experience: provider.experience,
    distance: provider.distance,
    startingPrice: provider.startingPrice,
    verified: provider.verified,
    availableToday: provider.availableToday,
    location: provider.location,
    state: provider.state,
    about: provider.about,
    avatarTone: provider.avatarTone,
    accountStatus: provider.accountStatus,
    isActive: provider.isActive,
    ...(reviews.length ? { reviews } : {}),
  };
}

export async function getProviderReviews(providerId) {
  const reviews = await Review.find({ providerId }).sort({ createdAt: -1 }).limit(100).lean();
  return reviews.map((review) => ({
    id: String(review._id),
    reviewer: review.customerName,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
  }));
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}