import { Provider } from '../models/Provider.js';
import { Service } from '../models/Service.js';
import { getProviderDetails, providerDto, searchProviders } from '../services/providerService.js';
import { HttpError } from '../utils/httpError.js';

export async function listProviders(request, response) {
  response.json({ providers: await searchProviders(request.validated.query) });
}

export async function getProvider(request, response) {
  const provider = await getProviderDetails(request.validated.params.id);
  if (!provider) throw new HttpError(404, 'Provider not found.');
  response.json({ provider });
}

export async function updateProviderProfile(request, response) {
  const updates = { ...request.validated.body };
  if (updates.serviceIds) {
    const services = await Service.find({ _id: { $in: updates.serviceIds }, status: 'Active' }).select('name');
    if (services.length !== updates.serviceIds.length) throw new HttpError(400, 'One or more selected services are unavailable.');
    updates.services = services.map((service) => service.name);
  }
  const provider = await Provider.findOneAndUpdate({ userId: request.user.id }, updates, { new: true, runValidators: true }).populate('serviceIds', 'name');
  if (!provider) throw new HttpError(404, 'Provider profile not found.');
  response.json({ provider: providerDto(provider) });
}
