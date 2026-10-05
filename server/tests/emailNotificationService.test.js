import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildAccountWelcomeEmail, buildBookingCreatedEmails, buildPasswordResetEmail, buildServiceCompletedEmail, deliverEmailNotifications } from '../services/emailNotificationService.js';

const booking = { bookingId: 'FIX-ABC-123', service: 'AC Repair', date: '2026-10-10', time: '10:00 AM' };
const customer = { name: 'Customer Example', email: 'customer@example.test' };
const provider = { name: 'Provider Example', email: 'provider@example.test' };

describe('FixIt email notifications', () => {
  it('builds booking confirmation and provider request emails', () => {
    const emails = buildBookingCreatedEmails({ booking, customer, provider });
    assert.deepEqual(emails.map((email) => email.to), [customer.email, provider.email]);
    assert.match(emails[0].text, /FIX-ABC-123/);
    assert.match(emails[1].subject, /New FixIt service request/);
    assert.match(emails[0].html, /viewport/);
    assert.match(emails[0].html, /View your bookings/);
  });

  it('builds a completion notification for the customer', () => {
    const email = buildServiceCompletedEmail({ booking, customer });
    assert.equal(email.to, customer.email);
    assert.match(email.text, /marked the service as completed/);
  });

  it('builds a signup welcome email addressed to the new customer', () => {
    const email = buildAccountWelcomeEmail({ name: customer.name, email: customer.email, accountType: 'customer' });
    assert.equal(email.to, customer.email);
    assert.match(email.subject, /Welcome to FixIt/);
    assert.match(email.text, /customer account is ready/i);
  });

  it('gives providers role-specific signup next steps', () => {
    const email = buildAccountWelcomeEmail({ name: provider.name, email: provider.email, accountType: 'provider' });
    assert.match(email.text, /professional account is ready/i);
    assert.match(email.text, /complete your profile/i);
  });

  it('builds a one-time password reset link for the account email', () => {
    const email = buildPasswordResetEmail(customer, 'a'.repeat(64));
    assert.equal(email.to, customer.email);
    assert.match(email.text, /reset-password\?token=a{64}/);
    assert.match(email.text, /within 30 minutes/i);
    assert.match(email.html, /Choose a new password/);
  });

  it('does not fail booking workflows when mail delivery is not configured', async () => {
    assert.equal(await deliverEmailNotifications([{ to: customer.email }], null, ''), false);
  });

  it('sends notifications through the provided transport', async () => {
    const sent = [];
    const transport = { async sendMail(message) { sent.push(message); } };
    const result = await deliverEmailNotifications([{ to: customer.email, subject: 'Confirmed', text: 'Done' }], transport, 'FixIt <fixit@example.test>');
    assert.equal(result, true);
    assert.equal(sent[0].to, customer.email);
    assert.equal(sent[0].from, 'FixIt <fixit@example.test>');
  });
});