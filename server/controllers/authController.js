import { loginAccount, registerAccount } from '../services/authService.js';
import { notifyAccountRegistered } from '../services/emailNotificationService.js';
import { requestPasswordReset, resetAccountPassword } from '../services/passwordResetService.js';
import { userDto } from '../utils/userDto.js';

export async function register(request, response) {
  const result = await registerAccount(request.validated.body);
  void notifyAccountRegistered(result.user).catch((error) => {
    console.warn('FixIt signup email notification could not be sent:', error.message);
  });
  response.status(201).json(result);
}

export async function login(request, response) {
  const { email, password } = request.validated.body;
  response.json(await loginAccount(email, password));
}

export function currentUser(request, response) {
  response.json({ user: userDto(request.user) });
}

export async function forgotPassword(request, response) {
  await requestPasswordReset(request.validated.body.email);
  response.json({ message: 'If an active customer or provider account exists for that email, a reset link has been sent.' });
}

export async function resetPassword(request, response) {
  await resetAccountPassword(request.validated.body.token, request.validated.body.password);
  response.json({ message: 'Password updated. You can now sign in with your new password.' });
}