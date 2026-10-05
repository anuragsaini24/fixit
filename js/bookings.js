(() => {
  const BOOKINGS_KEY = 'fixit.bookings';
  const LATEST_BOOKING_KEY = 'fixit.latestBooking';
  const LATEST_BOOKING_ID_KEY = 'fixit.latestBookingId';
  const REVIEWS_KEY = 'fixit.reviews';
  const grid = document.querySelector('#customer-bookings-grid');
  const emptyState = document.querySelector('#customer-bookings-empty');
  const resultsCount = document.querySelector('#bookings-results-count');
  const emptyTitle = document.querySelector('#bookings-empty-title');
  const emptyCopy = document.querySelector('#bookings-empty-copy');
  const storageError = document.querySelector('#bookings-storage-error');
  let bookings = [];
  let reviews = [];
  let activeFilter = 'all';

  function formatMoney(value) {
    return `₹${Number(value || 0).toLocaleString('en-IN')}`;
  }

  function formatDate(value) {
    if (!value) return 'Date not set';
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  function bookingCategory(booking) {
    if (booking.status === 'Service Completed') return 'completed';
    if (booking.status === 'Booking Cancelled') return 'cancelled';
    return 'upcoming';
  }

  function getCounts() {
    return {
      all: bookings.length,
      upcoming: bookings.filter((booking) => bookingCategory(booking) === 'upcoming').length,
      completed: bookings.filter((booking) => bookingCategory(booking) === 'completed').length,
      cancelled: bookings.filter((booking) => bookingCategory(booking) === 'cancelled').length
    };
  }

  function createBookingCard(booking) {
    const article = document.createElement('article');
    article.className = 'customer-booking-card';
    article.dataset.bookingId = booking.bookingId;

    const heading = document.createElement('div');
    heading.className = 'customer-booking-card-heading';
    const service = document.createElement('h2');
    service.textContent = booking.service || 'Service booking';
    const status = document.createElement('span');
    const category = bookingCategory(booking);
    status.className = `customer-booking-status status-${category}`;
    status.textContent = booking.status || 'Status unavailable';
    heading.append(service, status);

    const id = document.createElement('p');
    id.className = 'customer-booking-id';
    id.textContent = `Booking ID ${booking.bookingId}`;

    const details = document.createElement('dl');
    details.className = 'customer-booking-details';
    const detailRows = [
      ['Provider', booking.provider?.name || 'Professional'],
      ['Date', formatDate(booking.date)],
      ['Time', booking.time || 'Time not set'],
      ['Price', formatMoney(Number(booking.visitCharge || 0) + Number(booking.estimatedCost || 0))]
    ];
    detailRows.forEach(([label, value]) => {
      const row = document.createElement('div');
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = label;
      description.textContent = value;
      row.append(term, description);
      details.append(row);
    });

    const actions = document.createElement('div');
    actions.className = 'customer-booking-actions';
    if (category === 'completed' && !reviews.some((review) => review.bookingId === booking.bookingId)) {
      const reviewLink = document.createElement('a');
      reviewLink.className = 'booking-review-link';
      reviewLink.href = `review.html?bookingId=${encodeURIComponent(booking.bookingId)}`;
      reviewLink.textContent = 'Write Review';
      actions.append(reviewLink);
    } else if (category === 'completed') {
      const reviewed = document.createElement('span');
      reviewed.className = 'booking-reviewed-label';
      reviewed.textContent = 'Reviewed';
      actions.append(reviewed);
    }
    const viewButton = document.createElement('button');
    viewButton.className = 'booking-details-button';
    viewButton.type = 'button';
    viewButton.dataset.viewBooking = booking.bookingId;
    viewButton.innerHTML = 'View Details <i data-lucide="arrow-right" aria-hidden="true"></i>';
    actions.append(viewButton);

    article.append(heading, id, details, actions);
    return article;
  }

  function getVisibleBookings() {
    if (activeFilter === 'all') return bookings;
    return bookings.filter((booking) => bookingCategory(booking) === activeFilter);
  }

  function render() {
    const counts = getCounts();
    Object.entries(counts).forEach(([filter, count]) => {
      document.querySelector(`#count-${filter}`).textContent = String(count);
    });
    const visibleBookings = getVisibleBookings();
    grid.replaceChildren(...visibleBookings.map(createBookingCard));
    resultsCount.textContent = `${visibleBookings.length} ${visibleBookings.length === 1 ? 'booking' : 'bookings'}`;
    grid.hidden = visibleBookings.length === 0;
    emptyState.hidden = visibleBookings.length > 0;
    if (!bookings.length) {
      emptyTitle.textContent = 'No bookings yet';
      emptyCopy.textContent = 'Find a local professional and your service bookings will appear here.';
    } else if (!visibleBookings.length) {
      emptyTitle.textContent = `No ${activeFilter} bookings`;
      emptyCopy.textContent = 'Your bookings in this category will appear here.';
    }
    if (window.lucide) window.lucide.createIcons();
  }

  try {
    const storedBookings = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]');
    const latestBooking = JSON.parse(localStorage.getItem(LATEST_BOOKING_KEY) || 'null');
    const uniqueBookings = new Map((Array.isArray(storedBookings) ? storedBookings : []).filter((booking) => booking?.bookingId).map((booking) => [booking.bookingId, booking]));
    if (latestBooking?.bookingId && !uniqueBookings.has(latestBooking.bookingId)) uniqueBookings.set(latestBooking.bookingId, latestBooking);
    bookings = [...uniqueBookings.values()].sort((first, second) => (second.date || '').localeCompare(first.date || ''));
    const storedReviews = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]');
    reviews = Array.isArray(storedReviews) ? storedReviews : [];
  } catch {
    storageError.textContent = 'Could not read saved bookings. Check browser storage and refresh this page.';
  }

  document.querySelectorAll('[data-booking-filter]').forEach((tab) => {
    tab.addEventListener('click', () => {
      activeFilter = tab.dataset.bookingFilter;
      document.querySelectorAll('[data-booking-filter]').forEach((item) => item.setAttribute('aria-selected', String(item === tab)));
      render();
    });
  });

  grid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-view-booking]');
    if (!button) return;
    const booking = bookings.find((item) => item.bookingId === button.dataset.viewBooking);
    if (!booking) return;
    try {
      localStorage.setItem(LATEST_BOOKING_KEY, JSON.stringify(booking));
      localStorage.setItem(LATEST_BOOKING_ID_KEY, booking.bookingId);
      window.location.href = 'tracking.html';
    } catch {
      storageError.textContent = 'Could not open this booking. Check browser storage and try again.';
    }
  });

  render();
})();
