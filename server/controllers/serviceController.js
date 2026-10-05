import { Service } from '../models/Service.js';
import { HttpError } from '../utils/httpError.js';

export async function listServices(request, response) {
  const { search, category, status } = request.validated.query;
  const filter = {};
  if (request.user?.accountType === 'admin' && status) filter.status = status;
  else filter.status = 'Active';
  if (category) filter.category = new RegExp(`^${escapeRegex(category)}$`, 'i');
  if (search) filter.$or = [
    { name: new RegExp(escapeRegex(search), 'i') },
    { category: new RegExp(escapeRegex(search), 'i') },
    { keywords: new RegExp(escapeRegex(search), 'i') },
  ];
  response.json({ services: await Service.find(filter).sort({ name: 1 }) });
}

export async function getService(request, response) {
  const filter = { _id: request.validated.params.id };
  if (request.user?.accountType !== 'admin') filter.status = 'Active';
  const service = await Service.findOne(filter);
  if (!service) throw new HttpError(404, 'Service not found.');
  response.json({ service });
}

export async function createService(request, response) {
  const service = await Service.create(request.validated.body);
  response.status(201).json({ service });
}

export async function updateService(request, response) {
  const service = await Service.findByIdAndUpdate(request.validated.params.id, request.validated.body, { new: true, runValidators: true });
  if (!service) throw new HttpError(404, 'Service not found.');
  response.json({ service });
}

export async function deleteService(request, response) {
  const service = await Service.findByIdAndUpdate(request.validated.params.id, { status: 'Inactive' }, { new: true });
  if (!service) throw new HttpError(404, 'Service not found.');
  response.status(204).end();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}