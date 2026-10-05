import { z } from 'zod';
import { Booking } from '../models/Booking.js';
import { Provider } from '../models/Provider.js';
import { Service } from '../models/Service.js';
import { getServicePriceEstimate } from '../config/servicePriceEstimates.js';
import { getProviderDetails as fetchProviderDetails, searchProviders as findProviders } from './providerService.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
});

const toolSchemas = {
  getActiveServices: z.object({}).strict(),
  searchProviders: z.object({
    serviceId: objectId.optional(),
    search: z.string().trim().max(100).optional(),
    state: z.string().trim().max(100).optional(),
    minRating: z.number().min(0).max(5).optional(),
    maxPrice: z.number().min(0).optional(),
    availableToday: z.boolean().optional(),
    limit: z.number().int().min(1).max(10).default(5),
  }).strict(),
  getProviderDetails: z.object({ providerId: objectId }).strict(),
  checkProviderAvailability: z.object({ providerId: objectId, date: dateSchema, time: z.string().trim().min(1).max(40) }).strict(),
  estimateServiceCost: z.object({ serviceId: objectId }).strict(),
  getBookingStatus: z.object({ bookingId: z.string().trim().min(5).max(50) }).strict(),
};

const tools = {
  async getActiveServices() {
    const services = await Service.find({ status: 'Active' }).select('name category detail keywords priceFrom').sort({ name: 1 }).lean();
    return services.map((service) => ({
      id: String(service._id),
      name: service.name,
      category: service.category,
      detail: service.detail,
      keywords: service.keywords,
      priceFrom: service.priceFrom,
    }));
  },

  async searchProviders(args) {
    const { limit, ...filters } = args;
    const providers = await findProviders(filters);
    return providers.slice(0, limit).map(({ id, name, profession, serviceIds, services, rating, reviewCount, experience, distance, startingPrice, availableToday, location, state }) => ({
      id, name, profession, serviceIds, services, rating, reviewCount, experience, distance, startingPrice, availableToday, location, state,
    }));
  },

  async getProviderDetails({ providerId }) {
    const provider = await fetchProviderDetails(providerId);
    if (!provider) return null;
    const { id, name, profession, serviceIds, services, rating, reviewCount, experience, distance, startingPrice, availableToday, location, state, about, verified } = provider;
    return { id, name, profession, serviceIds, services, rating, reviewCount, experience, distance, startingPrice, availableToday, location, state, about, verified };
  },

  async checkProviderAvailability({ providerId, date, time }) {
    const provider = await Provider.findOne({ _id: providerId, isActive: true, accountStatus: { $ne: 'Rejected' } }).select('availableToday').lean();
    if (!provider) return { status: 'provider_not_found', calendarAvailabilityKnown: false };

    const activeBooking = await Booking.findOne({
      providerId,
      date,
      time,
      status: { $nin: ['Booking Cancelled', 'Rejected'] },
    }).select('_id').lean();
    if (activeBooking) return { status: 'slot_conflict', calendarAvailabilityKnown: true };

    const today = new Date().toISOString().slice(0, 10);
    if (date === today) {
      return {
        status: provider.availableToday ? 'available_today' : 'not_available_today',
        calendarAvailabilityKnown: true,
        availableToday: provider.availableToday,
      };
    }
    return { status: 'no_conflict_found_calendar_unknown', calendarAvailabilityKnown: false };
  },

  async estimateServiceCost({ serviceId }) {
    const service = await Service.findOne({ _id: serviceId, status: 'Active' }).select('name category detail keywords priceFrom').lean();
    if (!service) return null;
    return {
      service: { id: String(service._id), name: service.name },
      ...getServicePriceEstimate(service),
      disclaimer: 'Estimated price only. Final price may vary after professional inspection.',
    };
  },

  async getBookingStatus({ bookingId }, { userId }) {
    const booking = await Booking.findOne({ bookingId, customerId: userId })
      .select('bookingId service date time status createdAt')
      .lean();
    if (!booking) return null;
    return {
      bookingId: booking.bookingId,
      service: booking.service,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      createdAt: booking.createdAt,
    };
  },
};

export const AGENT_TOOL_NAMES = Object.freeze(Object.keys(toolSchemas));

export async function executeAgentTool(name, input, context) {
  if (!Object.hasOwn(toolSchemas, name)) throw new Error('Unknown agent tool.');
  if (!context?.userId) throw new Error('Authenticated user context is required.');
  const parsed = toolSchemas[name].safeParse(input);
  if (!parsed.success) throw new Error('Invalid arguments for agent tool.');
  try {
    return await tools[name](parsed.data, context);
  } catch {
    throw new Error('Agent tool is temporarily unavailable.');
  }
}