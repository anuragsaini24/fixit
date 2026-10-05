(() => {
  const user = window.FixItAuth?.getCurrentUser();
  if (!user || user.accountType !== 'provider') return;

  const marketplace = window.FixItMarketplace;
  const providers = marketplace?.providers || [];
  const bookingsKey = 'fixit.bookings';
  const latestBookingKey = 'fixit.latestBooking';
  const message = document.querySelector('#provider-notice');
  const provider = providers.find((item) => item.id === user.providerId)
    || providers.find((item) => item.id === localStorage.getItem('fixit.selectedProviderId'));
  const providerId = provider?.id || user.providerId;
  const page = document.body.dataset.providerPage || 'dashboard';
  const providerName = provider?.name || user.name || 'Provider';
  const providerInitials = providerName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  document.querySelectorAll('#provider-account-name').forEach((element) => { element.textContent = providerName; });
  document.querySelectorAll('#provider-account-avatar, #provider-topbar-avatar').forEach((element) => { element.textContent = providerInitials; });
  const greetingName = document.querySelector('#provider-greeting-name');
  if (greetingName) greetingName.textContent = providerName.split(' ')[0];

  function readBookings() {
    try {
      const saved = JSON.parse(localStorage.getItem(bookingsKey) || '[]');
      const map = new Map((Array.isArray(saved) ? saved : []).filter((booking) => booking?.bookingId).map((booking) => [booking.bookingId, booking]));
      const latest = JSON.parse(localStorage.getItem(latestBookingKey) || 'null');
      if (latest?.bookingId) map.set(latest.bookingId, latest);
      return [...map.values()].filter((booking) => booking.provider?.id === providerId);
    } catch {
      return [];
    }
  }

  function writeBooking(updatedBooking) {
    const allBookings = JSON.parse(localStorage.getItem(bookingsKey) || '[]');
    const bookings = Array.isArray(allBookings) ? allBookings : [];
    const index = bookings.findIndex((booking) => booking.bookingId === updatedBooking.bookingId);
    if (index === -1) bookings.push(updatedBooking);
    else bookings[index] = updatedBooking;
    localStorage.setItem(bookingsKey, JSON.stringify(bookings));
    if (JSON.parse(localStorage.getItem(latestBookingKey) || 'null')?.bookingId === updatedBooking.bookingId) {
      localStorage.setItem(latestBookingKey, JSON.stringify(updatedBooking));
    }
  }

  function money(amount) {
    return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  }

  function dateLabel(value) {
    if (!value) return 'Date not set';
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  function normalizeStatus(status) {
    if (status === 'Service Completed') return 'completed';
    if (status === 'Booking Cancelled' || status === 'Rejected') return 'cancelled';
    if (status === 'Booking Confirmed') return 'request';
    return 'active';
  }

  function createRequestCard(booking) {
    const article = document.createElement('article');
    article.className = 'provider-request-card';
    const heading = document.createElement('div');
    heading.className = 'provider-card-heading';
    const title = document.createElement('h2');
    title.textContent = booking.service;
    const status = document.createElement('span');
    status.className = 'provider-status status-request';
    status.textContent = 'New request';
    heading.append(title, status);

    const details = document.createElement('dl');
    details.className = 'provider-request-details';
    [
      ['Customer', booking.customer?.name || 'Guest Customer'],
      ['Distance', `${provider?.distance ?? 0} km`],
      ['Estimated price', money(booking.estimatedCost)],
      ['Date', dateLabel(booking.date)],
      ['Time', booking.time || 'Time not set']
    ].forEach(([label, value]) => {
      const row = document.createElement('div');
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = label;
      description.textContent = value;
      row.append(term, description);
      details.append(row);
    });

    const problem = document.createElement('p');
    problem.className = 'provider-problem';
    problem.textContent = booking.problem || 'No problem details were provided.';
    const actions = document.createElement('div');
    actions.className = 'provider-request-actions';
    const reject = document.createElement('button');
    reject.type = 'button';
    reject.className = 'provider-reject-button';
    reject.dataset.requestAction = 'reject';
    reject.dataset.bookingId = booking.bookingId;
    reject.textContent = 'Reject';
    const accept = document.createElement('button');
    accept.type = 'button';
    accept.className = 'provider-accept-button';
    accept.dataset.requestAction = 'accept';
    accept.dataset.bookingId = booking.bookingId;
    accept.innerHTML = 'Accept <i data-lucide="check" aria-hidden="true"></i>';
    actions.append(reject, accept);
    article.append(heading, details, problem, actions);
    return article;
  }

  function createJobCard(booking) {
    const article = document.createElement('article');
    article.className = 'provider-job-card';
    const top = document.createElement('div');
    top.className = 'provider-card-heading';
    const title = document.createElement('h2');
    title.textContent = booking.service;
    const status = document.createElement('span');
    status.className = `provider-status status-${normalizeStatus(booking.status)}`;
    status.textContent = booking.status;
    top.append(title, status);
    const details = document.createElement('p');
    details.textContent = `${booking.customer?.name || 'Guest Customer'} · ${dateLabel(booking.date)} · ${booking.time || 'Time not set'}`;
    const price = document.createElement('strong');
    price.className = 'provider-job-price';
    price.textContent = money(booking.estimatedCost);
    article.append(top, details, price);
    return article;
  }

  function showEmpty(container, empty, hasItems) {
    container.hidden = !hasItems;
    empty.hidden = hasItems;
  }

  function renderDashboard(bookings) {
    const requests = bookings.filter((booking) => booking.status === 'Booking Confirmed');
    const activeJobs = bookings.filter((booking) => ['Professional Assigned', 'Professional On The Way', 'Service Started'].includes(booking.status));
    const completed = bookings.filter((booking) => booking.status === 'Service Completed');
    const earnings = completed.reduce((sum, booking) => sum + Number(booking.estimatedCost || 0), 0);
    document.querySelector('#provider-stat-requests').textContent = requests.length.toLocaleString('en-IN');
    document.querySelector('#provider-stat-active').textContent = activeJobs.length.toLocaleString('en-IN');
    document.querySelector('#provider-stat-completed').textContent = completed.length.toLocaleString('en-IN');
    document.querySelector('#provider-stat-earnings').textContent = money(earnings);
    document.querySelector('#provider-request-count').textContent = requests.length.toLocaleString('en-IN');
    const container = document.querySelector('#dashboard-request-list');
    const empty = document.querySelector('#dashboard-request-empty');
    container.replaceChildren(...requests.slice(0, 3).map(createRequestCard));
    showEmpty(container, empty, requests.length > 0);
  }

  function renderRequests(bookings) {
    const requests = bookings.filter((booking) => booking.status === 'Booking Confirmed');
    const container = document.querySelector('#request-list');
    const empty = document.querySelector('#request-empty');
    container.replaceChildren(...requests.map(createRequestCard));
    document.querySelector('#request-count').textContent = `${requests.length} ${requests.length === 1 ? 'request' : 'requests'}`;
    showEmpty(container, empty, requests.length > 0);
  }

  function renderJobs(bookings) {
    const jobs = bookings.filter((booking) => ['Professional Assigned', 'Professional On The Way', 'Service Started', 'Service Completed'].includes(booking.status));
    const container = document.querySelector('#job-list');
    const empty = document.querySelector('#job-empty');
    container.replaceChildren(...jobs.map(createJobCard));
    document.querySelector('#job-count').textContent = `${jobs.length} ${jobs.length === 1 ? 'job' : 'jobs'}`;
    showEmpty(container, empty, jobs.length > 0);
  }

  function renderEarnings(bookings) {
    const completed = bookings.filter((booking) => booking.status === 'Service Completed');
    const earnings = completed.reduce((sum, booking) => sum + Number(booking.estimatedCost || 0), 0);
    document.querySelector('#earnings-total').textContent = money(earnings);
    document.querySelector('#earnings-job-count').textContent = `${completed.length} completed ${completed.length === 1 ? 'job' : 'jobs'}`;
    const list = document.querySelector('#earnings-list');
    const empty = document.querySelector('#earnings-empty');
    list.replaceChildren(...completed.map((booking) => {
      const row = document.createElement('article');
      row.className = 'provider-earning-row';
      const summary = document.createElement('div');
      const service = document.createElement('strong');
      const date = document.createElement('span');
      service.textContent = booking.service;
      date.textContent = `${booking.customer?.name || 'Guest Customer'} · ${dateLabel(booking.date)}`;
      summary.append(service, date);
      const amount = document.createElement('strong');
      amount.textContent = money(booking.estimatedCost);
      row.append(summary, amount);
      return row;
    }));
    showEmpty(list, empty, completed.length > 0);
  }

  function renderProfile() {
    document.querySelector('#profile-name').textContent = providerName;
    document.querySelector('#profile-profession').textContent = provider?.profession || user.profession || 'Service professional';
    document.querySelector('#profile-location').textContent = provider?.location || 'Location not set';
    document.querySelector('#profile-rating').textContent = provider ? `${provider.rating.toFixed(1)} (${provider.reviewCount} reviews)` : 'No reviews yet';
    document.querySelector('#profile-experience').textContent = provider ? `${provider.experience} years experience` : 'Experience not set';
    document.querySelector('#profile-avatar').textContent = providerInitials;
    if (provider) document.querySelector('#profile-avatar').classList.add(`avatar-${provider.avatarTone}`);
    const reviewList = document.querySelector('#provider-profile-reviews');
    const reviews = provider?.reviews || [];
    reviewList.replaceChildren(...reviews.map((review) => {
      const card = document.createElement('article');
      card.className = 'provider-job-card';
      const heading = document.createElement('div');
      heading.className = 'provider-card-heading';
      const reviewer = document.createElement('h2');
      reviewer.textContent = review.reviewer;
      const rating = document.createElement('span');
      rating.className = 'provider-status status-completed';
      rating.textContent = `${review.rating.toFixed(1)} / 5`;
      const comment = document.createElement('p');
      comment.textContent = review.comment;
      heading.append(reviewer, rating);
      card.append(heading, comment);
      return card;
    }));
  }

  function render() {
    const bookings = readBookings();
    if (page === 'dashboard') renderDashboard(bookings);
    if (page === 'requests') renderRequests(bookings);
    if (page === 'jobs') renderJobs(bookings);
    if (page === 'earnings') renderEarnings(bookings);
    if (page === 'profile') renderProfile();
    if (window.lucide) window.lucide.createIcons();
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-request-action]');
    if (!button) return;
    const bookings = readBookings();
    const booking = bookings.find((item) => item.bookingId === button.dataset.bookingId);
    if (!booking) return;
    booking.status = button.dataset.requestAction === 'accept' ? 'Professional Assigned' : 'Rejected';
    booking.provider = { ...booking.provider, id: providerId, name: providerName };
    try {
      writeBooking(booking);
      if (message) message.textContent = button.dataset.requestAction === 'accept' ? 'Request accepted and assigned to you.' : 'Request rejected.';
      render();
    } catch {
      if (message) message.textContent = 'Could not update this request. Check browser storage and try again.';
    }
  });

  document.querySelector('#profile-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    message.textContent = 'Provider profile is sample data and cannot be edited in this prototype.';
  });

  render();
})();
