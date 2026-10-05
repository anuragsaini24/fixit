export function userDto(user) {
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    accountType: user.accountType,
    status: user.status,
    ...(user.providerId ? { providerId: String(user.providerId._id || user.providerId) } : {}),
  };
}