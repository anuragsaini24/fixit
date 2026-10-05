import nodemailer from 'nodemailer';
import {
  bookingCancelledEmailTemplate,
  bookingConfirmationEmailTemplate,
  bookingStatusEmailTemplate,
  passwordResetEmailTemplate,
  providerRequestEmailTemplate,
  reviewReminderEmailTemplate,
  serviceCompletedEmailTemplate,
  welcomeEmailTemplate,
} from './emailTemplates.js';
import { User } from '../models/User.js';

let cachedTransport;
let cachedTransportKey = '';

function frontendUrl(path) {
  const base = (process.env.FRONTEND_URL || process.env.PUBLIC_APP_URL || (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',')[0]).replace(/\/$/, '');
  return new URL(path, base).toString();
}

function getMailConfiguration() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;
  const port = Number(process.env.SMTP_PORT || 587);
  const from = EMAIL_FROM || SMTP_USER;
  if (!SMTP_HOST || !from || !Number.isInteger(port) || port < 1 || port > 65535) return null;

  const transportKey = JSON.stringify({ host: SMTP_HOST, port, secure: process.env.SMTP_SECURE, user: SMTP_USER, pass: SMTP_PASS });
  if (transportKey !== cachedTransportKey) {
    cachedTransport = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      ...(SMTP_USER && SMTP_PASS ? { auth: { user: SMTP_USER, pass: SMTP_PASS } } : {}),
      connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS) || 10000,
      greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS) || 10000,
      socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS) || 15000,
    });
    cachedTransportKey = transportKey;
  }

  return { from, transport: cachedTransport };
}

export function buildBookingCreatedEmails({ booking, customer, provider }) {
  const bookingDetails = `Booking ID: ${booking.bookingId}\nService: ${booking.service}\nDate: ${booking.date}\nTime: ${booking.time}`;
  const emails = [];
  if (customer.email) {
    emails.push({
      to: customer.email,
      subject: `FixIt booking confirmed: ${booking.service}`,
      text: `Hi ${customer.name},\n\nYour service booking has been confirmed.\n\n${bookingDetails}\nProfessional: ${provider.name}\n\nYou can track your booking from your FixIt account.`,
      html: bookingConfirmationEmailTemplate({ booking, customer, provider, bookingsUrl: frontendUrl('/bookings') }),
    });
  }
  if (provider.email) {
    emails.push({
      to: provider.email,
      subject: `New FixIt service request: ${booking.service}`,
      text: `Hi ${provider.name},\n\nYou have received a new service request.\n\n${bookingDetails}\nCustomer: ${customer.name}\n\nSign in to FixIt to review the request.`,
      html: providerRequestEmailTemplate({ booking, customer, provider, requestUrl: frontendUrl('/provider/requests') }),
    });
  }
  return emails;
}

export function buildServiceCompletedEmail({ booking, customer }) {
  if (!customer.email) return null;
  return {
    to: customer.email,
    subject: `FixIt service completed: ${booking.service}`,
    text: `Hi ${customer.name},\n\nYour professional has marked the service as completed.\n\nBooking ID: ${booking.bookingId}\nService: ${booking.service}\n\nThank you for choosing FixIt. You can sign in to review your booking and leave feedback.`,
    html: serviceCompletedEmailTemplate({ booking, customer, reviewUrl: frontendUrl(`/review?bookingId=${encodeURIComponent(booking.bookingId)}`) }),
  };
}

export function buildAccountWelcomeEmail(user) {
  if (!user.email) return null;
  const roleMessage = user.accountType === 'provider'
    ? 'Your professional account is ready. Complete your profile and add the services you offer so customers can find you.'
    : 'Your customer account is ready. Browse services and local professionals whenever you need a hand.';
  return {
    to: user.email,
    subject: 'Welcome to FixIt',
    text: `Hi ${user.name},\n\nWelcome to FixIt. ${roleMessage}\n\nYou can sign in to your account to get started.`,
    html: welcomeEmailTemplate(user),
  };
}

export function buildPasswordResetEmail(user, token) {
  if (!user.email || !token) return null;
  const resetUrl = new URL('/reset-password', frontendUrl('/'));
  resetUrl.searchParams.set('token', token);
  return {
    to: user.email,
    subject: 'Reset your FixIt password',
    text: `Hi ${user.name},\n\nWe received a request to reset your FixIt password. Use this one-time link within 30 minutes:\n\n${resetUrl.toString()}\n\nIf you did not request this, you can ignore this email.`,
    html: passwordResetEmailTemplate({ user, resetUrl: resetUrl.toString() }),
  };
}

export async function deliverEmailNotifications(emails, transport, from) {
  if (!transport || !from || !emails.length) return false;
  const results = await Promise.allSettled(emails.map((email) => transport.sendMail({ ...email, from })));
  for (const result of results) {
    if (result.status === 'rejected') console.warn('FixIt email notification failed:', result.reason?.message || 'Unknown mail error.');
  }
  return results.some((result) => result.status === 'fulfilled');
}

async function sendEmails(emails) {
  const configuration = getMailConfiguration();
  if (!configuration) {
    console.info('FixIt email notifications skipped: configure SMTP_HOST and EMAIL_FROM to enable delivery.');
    return false;
  }
  return deliverEmailNotifications(emails, configuration.transport, configuration.from);
}

export async function notifyBookingCreated({ booking, customer, provider }) {
  const providerAccount = await User.findById(provider.userId).select('email').lean();
  return sendEmails(buildBookingCreatedEmails({ booking, customer, provider: { ...provider.toObject(), email: providerAccount?.email } }));
}

export async function notifyServiceCompleted(booking) {
  const customer = await User.findById(booking.customerId).select('name email').lean();
  if (!customer) return false;
  const email = buildServiceCompletedEmail({ booking, customer });
  return email ? sendEmails([email]) : false;
}

export async function notifyAccountRegistered(user) {
  const email = buildAccountWelcomeEmail(user);
  return email ? sendEmails([email]) : false;
}

export async function notifyPasswordReset(user, token) {
  const email = buildPasswordResetEmail(user, token);
  return email ? sendEmails([email]) : false;
}