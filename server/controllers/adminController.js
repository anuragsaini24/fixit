import { User } from '../models/User.js';
import { HttpError } from '../utils/httpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const userFields = 'name email accountType status createdAt';

function toAdminUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    accountType: user.accountType,
    status: user.status,
    joinedAt: user.createdAt,
  };
}

export const getAdminStats = asyncHandler(async (request, response) => {
  response.json({ totalUsers: await User.countDocuments() });
});

export const listAdminUsers = asyncHandler(async (request, response) => {
  const users = await User.find().select(userFields).sort({ createdAt: -1 }).lean();
  response.json({ users: users.map(toAdminUser) });
});

export const updateAdminUserStatus = asyncHandler(async (request, response) => {
  const user = await User.findByIdAndUpdate(request.validated.params.id, { status: request.validated.body.status }, { new: true, runValidators: true }).select(userFields).lean();
  if (!user) throw new HttpError(404, 'User not found.');
  response.json({ user: toAdminUser(user) });
});