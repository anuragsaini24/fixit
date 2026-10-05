function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function renderEmail({ preheader, title, greeting, paragraphs, details = [], buttonLabel, buttonUrl, footer = 'Good help, close to home.' }) {
  const safeDetails = details.map(([label, value]) => `<tr><td style="padding:8px 12px 8px 0;color:#5d7075;font-size:14px;vertical-align:top">${escapeHtml(label)}</td><td style="padding:8px 0;color:#172b35;font-size:14px;font-weight:600;vertical-align:top">${escapeHtml(value)}</td></tr>`).join('');
  const safeParagraphs = paragraphs.map((paragraph) => `<p style="margin:0 0 14px;color:#40565d;font-size:15px;line-height:1.65">${escapeHtml(paragraph)}</p>`).join('');
  const action = buttonLabel && buttonUrl
    ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0"><tr><td bgcolor="#16745d" style="border-radius:6px"><a href="${escapeHtml(buttonUrl)}" style="display:inline-block;padding:13px 20px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none">${escapeHtml(buttonLabel)}</a></td></tr></table>`
    : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(title)}</title></head><body style="margin:0;padding:0;background:#f1f5f3;font-family:Arial,Helvetica,sans-serif"><span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;color:transparent">${escapeHtml(preheader)}</span><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f3;padding:28px 12px"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #d8e2df;border-radius:8px;overflow:hidden"><tr><td style="padding:20px 28px;background:#173b36;color:#ffffff;font-size:20px;font-weight:700">FixIt<span style="color:#76d4ae">.</span></td></tr><tr><td style="padding:30px 28px 18px"><h1 style="margin:0 0 20px;color:#172b35;font-size:23px;line-height:1.3">${escapeHtml(title)}</h1><p style="margin:0 0 14px;color:#172b35;font-size:15px;line-height:1.5">Hi ${escapeHtml(greeting)},</p>${safeParagraphs}${safeDetails ? `<table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;margin:16px 0;border-top:1px solid #e5ece9;border-bottom:1px solid #e5ece9">${safeDetails}</table>` : ''}${action}</td></tr><tr><td style="padding:17px 28px;background:#f7faf8;color:#607278;font-size:12px;line-height:1.6">${escapeHtml(footer)}<br>This is an automated message from FixIt.</td></tr></table></td></tr></table></body></html>`;
}

export function welcomeEmailTemplate(user) {
  const isProvider = user.accountType === 'provider';
  return renderEmail({
    preheader: 'Your FixIt account is ready.',
    title: 'Welcome to FixIt',
    greeting: user.name,
    paragraphs: [isProvider
      ? 'Your professional account is ready. Complete your profile and add the services you offer so customers can find you.'
      : 'Your customer account is ready. Browse services and local professionals whenever you need a hand.'],
  });
}

export function passwordResetEmailTemplate({ user, resetUrl }) {
  return renderEmail({
    preheader: 'Use your one-time password reset link.',
    title: 'Reset your password',
    greeting: user.name,
    paragraphs: ['We received a request to reset your FixIt password.', 'This one-time link expires soon. If you did not request a reset, you can ignore this email.'],
    buttonLabel: 'Choose a new password',
    buttonUrl: resetUrl,
  });
}

export function bookingConfirmationEmailTemplate({ booking, customer, provider, bookingsUrl }) {
  return renderEmail({
    preheader: `Your ${booking.service} booking is confirmed.`,
    title: 'Booking confirmed',
    greeting: customer.name,
    paragraphs: [`Your ${booking.service} service booking has been confirmed.`, `Professional: ${provider.name}`],
    details: [['Booking reference', booking.bookingId], ['Service', booking.service], ['Date', booking.date], ['Time', booking.time]],
    buttonLabel: 'View your bookings',
    buttonUrl: bookingsUrl,
  });
}

export function providerRequestEmailTemplate({ booking, customer, provider, requestUrl }) {
  return renderEmail({
    preheader: `A new ${booking.service} request is waiting for you.`,
    title: 'New service request',
    greeting: provider.name,
    paragraphs: [`You have received a new ${booking.service} service request.`, `Customer: ${customer.name}`],
    details: [['Booking reference', booking.bookingId], ['Service', booking.service], ['Date', booking.date], ['Time', booking.time]],
    buttonLabel: 'Review request',
    buttonUrl: requestUrl,
  });
}

export function bookingStatusEmailTemplate({ booking, customer, status, bookingUrl }) {
  return renderEmail({
    preheader: `Your ${booking.service} booking status changed.`,
    title: 'Booking update',
    greeting: customer.name,
    paragraphs: [`Your ${booking.service} booking status is now: ${status}.`],
    details: [['Booking reference', booking.bookingId], ['Service', booking.service], ['Date', booking.date], ['Time', booking.time], ['Status', status]],
    buttonLabel: 'View booking',
    buttonUrl: bookingUrl,
  });
}

export function bookingCancelledEmailTemplate({ booking, recipient, bookingUrl }) {
  return renderEmail({
    preheader: `Booking ${booking.bookingId} was cancelled.`,
    title: 'Booking cancelled',
    greeting: recipient.name,
    paragraphs: [`The ${booking.service} booking has been cancelled. If you need help, sign in to your FixIt account.`],
    details: [['Booking reference', booking.bookingId], ['Service', booking.service], ['Date', booking.date], ['Time', booking.time]],
    buttonLabel: 'View booking details',
    buttonUrl: bookingUrl,
  });
}

export function serviceCompletedEmailTemplate({ booking, customer, reviewUrl }) {
  return renderEmail({
    preheader: `Your ${booking.service} service is marked complete.`,
    title: 'Service completed',
    greeting: customer.name,
    paragraphs: ['Your professional has marked the service as completed. Thank you for choosing FixIt.', 'Please share feedback about your experience.'],
    details: [['Booking reference', booking.bookingId], ['Service', booking.service]],
    buttonLabel: 'Leave a review',
    buttonUrl: reviewUrl,
  });
}

export function reviewReminderEmailTemplate({ booking, customer, reviewUrl }) {
  return renderEmail({
    preheader: 'Share feedback about your completed FixIt service.',
    title: 'How was your service?',
    greeting: customer.name,
    paragraphs: ['Your service is complete. Your feedback helps other customers choose a professional.'],
    details: [['Booking reference', booking.bookingId], ['Service', booking.service]],
    buttonLabel: 'Write a review',
    buttonUrl: reviewUrl,
  });
}