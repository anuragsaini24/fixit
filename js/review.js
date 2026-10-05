(() => {
  const latestBookingKey = 'fixit.latestBooking';
  const bookingsKey = 'fixit.bookings';
  const reviewsKey = 'fixit.reviews';
  const form = document.querySelector('#review-form');
  const reviewCard = document.querySelector('#review-card');
  const emptyState = document.querySelector('#review-empty');
  const status = document.querySelector('#review-form-status');
  let booking = null;
  let existingReviews = [];

  try {
    const requestedId = new URLSearchParams(window.location.search).get('bookingId');
    const bookings = JSON.parse(localStorage.getItem(bookingsKey) || '[]');
    existingReviews = JSON.parse(localStorage.getItem(reviewsKey) || '[]');
    const latestBooking = JSON.parse(localStorage.getItem(latestBookingKey) || 'null');
    booking = requestedId && Array.isArray(bookings)
      ? bookings.find((item) => item.bookingId === requestedId) || (latestBooking?.bookingId === requestedId ? latestBooking : null)
      : latestBooking;
    if (!booking || booking.status !== 'Service Completed' || (requestedId && requestedId !== booking.bookingId)) {
      emptyState.hidden = false;
      return;
    }
    document.querySelector('#review-provider').textContent = booking.provider.name;
    reviewCard.hidden = false;
    if (Array.isArray(existingReviews) && existingReviews.some((review) => review.bookingId === booking.bookingId)) {
      form.hidden = true;
      status.textContent = 'You have already reviewed this completed booking. Thank you.';
    }
  } catch {
    emptyState.hidden = false;
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const rating = Number(new FormData(form).get('rating'));
    const sentiment = new FormData(form).get('sentiment');
    const comment = document.querySelector('#review-comment').value.trim();
    if (!rating || !sentiment || !comment) return;

    try {
      const storedReviews = JSON.parse(localStorage.getItem(reviewsKey) || '[]');
      const reviews = Array.isArray(storedReviews) ? storedReviews : [];
      if (reviews.some((review) => review.bookingId === booking.bookingId)) {
        form.hidden = true;
        status.textContent = 'You have already reviewed this completed booking. Thank you.';
        return;
      }
      reviews.push({ bookingId: booking.bookingId, providerId: booking.provider.id, providerName: booking.provider.name, rating, sentiment, comment, createdAt: new Date().toISOString() });
      localStorage.setItem(reviewsKey, JSON.stringify(reviews));
      status.textContent = 'Thanks. Your review has been saved on this device.';
      form.hidden = true;
    } catch {
      status.textContent = 'Could not save your review. Check browser storage and try again.';
    }
  });

  if (window.lucide) window.lucide.createIcons();
})();
