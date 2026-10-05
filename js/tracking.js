(() => {
  const STATUS_KEY = 'fixit.latestBooking';
  const BOOKINGS_KEY = 'fixit.bookings';
  const MESSAGES_KEY = 'fixit.messageDrafts';
  const STATUSES = [
    'Booking Confirmed',
    'Professional Assigned',
    'Professional On The Way',
    'Service Started',
    'Service Completed'
  ];
  const layout = document.querySelector('#tracking-layout');
  const emptyState = document.querySelector('#tracking-empty');
  const trackingMessage = document.querySelector('#tracking-message');
  const simulateButton = document.querySelector('#simulate-status');
  const chatDialog = document.querySelector('#chat-dialog');
  const cancelDialog = document.querySelector('#cancel-dialog');
  const chatForm = document.querySelector('#chat-form');
  const chatMessage = document.querySelector('#chat-message');
  let booking = null;
  let provider = null;

  function formatMoney(value) {
    return `₹${Number(value).toLocaleString('en-IN')}`;
  }

  function formatDate(value) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  function saveBooking() {
    const storedBookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]');
    const bookings = Array.isArray(storedBookings) ? storedBookings : [];
    const bookingIndex = bookings.findIndex((item) => item.bookingId === booking.bookingId);
    if (bookingIndex < 0) bookings.push(booking);
    else bookings[bookingIndex] = booking;
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
    localStorage.setItem(STATUS_KEY, JSON.stringify(booking));
  }

  function renderStatusTracker() {
    const cancelled = booking.status === 'Booking Cancelled';
    const currentStatus = cancelled ? booking.previousStatus : booking.status;
    const activeIndex = Math.max(0, STATUSES.indexOf(currentStatus));

    document.querySelectorAll('[data-status-index]').forEach((step) => {
      const stepIndex = Number(step.dataset.statusIndex);
      let state = 'pending';
      if (stepIndex < activeIndex || (cancelled && stepIndex === activeIndex)) state = 'completed';
      else if (stepIndex === activeIndex && !cancelled) state = 'active';
      step.dataset.state = state;
      step.classList.toggle('is-completed', state === 'completed');
      step.classList.toggle('is-active', state === 'active');
      step.classList.toggle('is-pending', state === 'pending');
      if (state === 'active') step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });

    document.querySelector('#tracking-status').textContent = booking.status;
    document.querySelector('#tracking-status').classList.toggle('is-cancelled', cancelled);
    document.querySelector('#cancelled-banner').hidden = !cancelled;
    const completed = booking.status === 'Service Completed';
    simulateButton.hidden = completed || cancelled;
    document.querySelector('#cancel-booking').hidden = completed || cancelled;
    document.querySelector('#rate-service-panel').hidden = !completed;
    document.querySelector('#write-review').href = `review.html?bookingId=${encodeURIComponent(booking.bookingId)}`;
    trackingMessage.textContent = cancelled
      ? 'This booking has been cancelled.'
      : completed
        ? 'Your service is complete.'
        : 'Status updates are simulated for this prototype.';
  }

  function renderProvider() {
    const name = provider?.name || booking.provider?.name || 'Your professional';
    document.querySelector('#provider-name').textContent = name;
    document.querySelector('#provider-profession').textContent = provider?.profession || 'Service professional';
    document.querySelector('#provider-rating').textContent = provider ? `${provider.rating.toFixed(1)} (${provider.reviewCount} reviews)` : 'Rating unavailable';
    const avatar = document.querySelector('#tracking-avatar');
    avatar.textContent = name.split(' ').map((part) => part[0]).slice(0, 2).join('');
    if (provider) {
      avatar.classList.add(`avatar-${provider.avatarTone}`);
      document.querySelector('#provider-call').href = `tel:${provider.phone.replace(/\s+/g, '')}`;
    } else {
      document.querySelector('#provider-call').hidden = true;
    }
    document.querySelector('#chat-provider-name').textContent = name;
  }

  try {
    booking = JSON.parse(localStorage.getItem(STATUS_KEY) || 'null');
    if (!booking || typeof booking.bookingId !== 'string' || !booking.provider) {
      emptyState.hidden = false;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    provider = window.FixItMarketplace?.providers.find((item) => item.id === booking.provider.id) || null;
    document.querySelector('#tracking-booking-id').textContent = booking.bookingId;
    document.querySelector('#tracking-service').textContent = booking.service;
    document.querySelector('#tracking-provider').textContent = booking.provider.name;
    document.querySelector('#tracking-date').textContent = formatDate(booking.date);
    document.querySelector('#tracking-time').textContent = booking.time;
    document.querySelector('#tracking-cost').textContent = formatMoney(booking.estimatedCost);
    renderProvider();
    renderStatusTracker();
    layout.hidden = false;
  } catch {
    emptyState.hidden = false;
  }

  simulateButton.addEventListener('click', () => {
    const currentIndex = STATUSES.indexOf(booking.status);
    if (currentIndex < 0 || currentIndex >= STATUSES.length - 1) return;
    booking.status = STATUSES[currentIndex + 1];
    try {
      saveBooking();
      renderStatusTracker();
    } catch {
      trackingMessage.textContent = 'Could not save this status. Check browser storage and try again.';
    }
  });

  document.querySelector('#cancel-booking').addEventListener('click', () => cancelDialog.showModal());
  document.querySelector('#confirm-cancel').addEventListener('click', () => {
    booking.previousStatus = booking.status;
    booking.status = 'Booking Cancelled';
    try {
      saveBooking();
      cancelDialog.close();
      renderStatusTracker();
    } catch {
      trackingMessage.textContent = 'Could not cancel this booking. Check browser storage and try again.';
    }
  });

  document.querySelector('#provider-chat').addEventListener('click', () => {
    chatMessage.value = '';
    document.querySelector('#chat-status').textContent = '';
    chatDialog.showModal();
    chatMessage.focus();
  });
  document.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => button.closest('dialog').close());
  });
  chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!chatMessage.value.trim()) {
      chatMessage.setCustomValidity('Write a message before saving.');
      chatMessage.reportValidity();
      return;
    }
    chatMessage.setCustomValidity('');
    try {
      const storedMessages = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
      const messages = Array.isArray(storedMessages) ? storedMessages : [];
      messages.push({ bookingId: booking.bookingId, providerId: booking.provider.id, providerName: booking.provider.name, content: chatMessage.value.trim(), savedAt: new Date().toISOString() });
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
      chatDialog.close();
      trackingMessage.textContent = 'Message draft saved on this device. It was not sent.';
    } catch {
      document.querySelector('#chat-status').textContent = 'Could not save your message. Check browser storage and try again.';
    }
  });

  chatMessage.addEventListener('input', () => chatMessage.setCustomValidity(''));
  if (window.lucide) window.lucide.createIcons();
})();
