(() => {
  const KEYS = {
    bookings: 'fixit.bookings',
    latestBooking: 'fixit.latestBooking',
    customerName: 'fixit.customerName',
    favorites: 'fixit.favoriteProviderIds',
    reviews: 'fixit.reviews',
    messages: 'fixit.messageDrafts',
    selectedProvider: 'fixit.selectedProviderId',
    latestBookingId: 'fixit.latestBookingId'
  };
  const marketplace = window.FixItMarketplace;
  const recentBody = document.querySelector('#recent-bookings-body');
  const searchInput = document.querySelector('#dashboard-search-input');
  let bookings = [];
  let providers = [];
  let reviews = [];
  let messages = [];
  let favorites = [];
  let customerName = 'Guest Customer';

  function parseArray(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function formatMoney(value) {
    return `₹${Number(value || 0).toLocaleString('en-IN')}`;
  }

  function formatDate(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
    if (!value) return 'Date not set';
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-IN', options);
  }

  function getBookingCost(booking) {
    return Number(booking.visitCharge || 0) + Number(booking.estimatedCost || 0);
  }

  function getBookingCategory(booking) {
    if (booking.status === 'Service Completed') return 'completed';
    if (booking.status === 'Booking Cancelled') return 'cancelled';
    return 'upcoming';
  }

  function getInitials(name) {
    return String(name || 'Guest Customer').split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  }

  function updateUserDetails() {
    const initials = getInitials(customerName);
    document.querySelector('#greeting-title').textContent = `Good Morning, ${customerName}`;
    document.querySelector('#sidebar-user-name').textContent = customerName;
    document.querySelector('#topbar-user-name').textContent = customerName;
    document.querySelector('#sidebar-avatar').textContent = initials;
    document.querySelector('#topbar-avatar').textContent = initials;
    document.querySelector('#customer-name-input').value = customerName;
  }

  function loadData() {
    bookings = parseArray(KEYS.bookings).filter((booking) => booking && booking.bookingId);
    try {
      const latestBooking = JSON.parse(localStorage.getItem(KEYS.latestBooking) || 'null');
      if (latestBooking?.bookingId) {
        const index = bookings.findIndex((booking) => booking.bookingId === latestBooking.bookingId);
        if (index === -1) bookings.push(latestBooking);
        else bookings[index] = latestBooking;
      }
    } catch {
      // Keep the saved booking list if the latest-booking snapshot is invalid.
    }
    bookings.sort((first, second) => (second.date || '').localeCompare(first.date || ''));
    providers = marketplace?.providers || [];
    favorites = parseArray(KEYS.favorites);
    reviews = parseArray(KEYS.reviews);
    messages = parseArray(KEYS.messages);
    const savedName = localStorage.getItem(KEYS.customerName);
    customerName = savedName || bookings.find((booking) => booking.customer?.name)?.customer.name || 'Guest Customer';
  }

  function renderStats() {
    const pendingCount = bookings.filter((booking) => getBookingCategory(booking) === 'upcoming').length;
    const completedBookings = bookings.filter((booking) => getBookingCategory(booking) === 'completed');
    const totalSpent = completedBookings.reduce((total, booking) => total + getBookingCost(booking), 0);
    document.querySelector('#stat-total-bookings').textContent = bookings.length.toLocaleString('en-IN');
    document.querySelector('#stat-pending-bookings').textContent = pendingCount.toLocaleString('en-IN');
    document.querySelector('#stat-total-spent').textContent = formatMoney(totalSpent);
    document.querySelector('#sidebar-booking-count').textContent = bookings.length.toLocaleString('en-IN');
    document.querySelector('#sidebar-message-count').textContent = messages.length.toLocaleString('en-IN');

    const notificationCount = pendingCount + messages.length;
    document.querySelector('#notification-dot').hidden = notificationCount === 0;
    document.querySelector('#notification-copy').textContent = notificationCount
      ? `${pendingCount} pending ${pendingCount === 1 ? 'booking' : 'bookings'} and ${messages.length} saved ${messages.length === 1 ? 'message' : 'messages'}.`
      : 'You’re all caught up.';
  }

  function openBooking(booking) {
    try {
      localStorage.setItem(KEYS.latestBooking, JSON.stringify(booking));
      localStorage.setItem(KEYS.latestBookingId, booking.bookingId);
      window.location.href = 'tracking.html';
    } catch {
      document.querySelector('#recent-bookings-empty').hidden = false;
    }
  }

  function renderUpcomingBooking() {
    const container = document.querySelector('#upcoming-booking-content');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcoming = bookings
      .filter((booking) => getBookingCategory(booking) === 'upcoming' && booking.date)
      .filter((booking) => {
        const [year, month, day] = booking.date.split('-').map(Number);
        return new Date(year, month - 1, day) >= today;
      })
      .sort((first, second) => first.date.localeCompare(second.date))[0];

    if (!upcoming) {
      container.innerHTML = '<div class="upcoming-empty"><i data-lucide="calendar-check-2" aria-hidden="true"></i><strong>No upcoming bookings</strong><span>When you book a service, it will show up here.</span><a href="providers.html">Find a professional</a></div>';
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    container.replaceChildren();
    const card = document.createElement('article');
    card.className = 'upcoming-booking-card';
    const top = document.createElement('div');
    top.className = 'upcoming-card-top';
    const date = document.createElement('div');
    date.className = 'upcoming-date-block';
    const dateDay = document.createElement('strong');
    const [year, month, day] = upcoming.date.split('-').map(Number);
    dateDay.textContent = new Date(year, month - 1, day).toLocaleDateString('en-IN', { day: '2-digit' });
    const dateMonth = document.createElement('span');
    dateMonth.textContent = new Date(year, month - 1, day).toLocaleDateString('en-IN', { month: 'short' });
    date.append(dateDay, dateMonth);
    const identity = document.createElement('div');
    identity.className = 'upcoming-provider';
    const service = document.createElement('strong');
    service.textContent = upcoming.service;
    const providerName = document.createElement('span');
    providerName.textContent = upcoming.provider?.name || 'Professional';
    identity.append(service, providerName);
    const status = document.createElement('span');
    status.className = 'dashboard-status-badge';
    status.textContent = upcoming.status;
    top.append(date, identity, status);
    const metadata = document.createElement('div');
    metadata.className = 'upcoming-metadata';
    metadata.innerHTML = `<span><i data-lucide="calendar-days" aria-hidden="true"></i>${formatDate(upcoming.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span><span><i data-lucide="clock-3" aria-hidden="true"></i>${upcoming.time || 'Time not set'}</span>`;
    const view = document.createElement('button');
    view.type = 'button';
    view.className = 'upcoming-view-button';
    view.textContent = 'View booking';
    view.addEventListener('click', () => openBooking(upcoming));
    card.append(top, metadata, view);
    container.append(card);
    if (window.lucide) window.lucide.createIcons();
  }

  function renderRecentBookings(query = '') {
    const normalizedQuery = query.trim().toLowerCase();
    const recent = bookings.filter((booking) => !normalizedQuery || [booking.bookingId, booking.service, booking.provider?.name, booking.status].join(' ').toLowerCase().includes(normalizedQuery)).slice(0, 5);
    recentBody.replaceChildren();
    document.querySelector('#recent-bookings-empty').hidden = recent.length > 0;
    if (!recent.length) return;

    recent.forEach((booking) => {
      const row = document.createElement('tr');
      const values = [booking.service || 'Service booking', booking.provider?.name || 'Professional', formatDate(booking.date), formatMoney(getBookingCost(booking))];
      values.forEach((value) => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      });
      const statusCell = document.createElement('td');
      const status = document.createElement('span');
      status.className = `dashboard-table-status status-${getBookingCategory(booking)}`;
      status.textContent = booking.status;
      statusCell.append(status);
      row.append(statusCell);
      const actionCell = document.createElement('td');
      const view = document.createElement('button');
      view.type = 'button';
      view.className = 'recent-view-button';
      view.setAttribute('aria-label', `View ${booking.service} booking`);
      view.innerHTML = '<i data-lucide="arrow-up-right" aria-hidden="true"></i>';
      view.addEventListener('click', () => openBooking(booking));
      actionCell.append(view);
      row.append(actionCell);
      recentBody.append(row);
    });
    if (window.lucide) window.lucide.createIcons();
  }

  function renderFavorites() {
    const list = document.querySelector('#favorites-list');
    const favoritesList = providers.filter((provider) => favorites.includes(provider.id));
    list.replaceChildren(...favoritesList.map((provider) => {
      const card = document.createElement('article');
      card.className = 'dashboard-provider-card';
      const avatar = document.createElement('span');
      avatar.className = `provider-avatar avatar-${provider.avatarTone}`;
      avatar.textContent = getInitials(provider.name);
      const details = document.createElement('div');
      details.innerHTML = `<strong></strong><span></span><small></small>`;
      details.querySelector('strong').textContent = provider.name;
      details.querySelector('span').textContent = provider.profession;
      details.querySelector('small').textContent = `${provider.rating.toFixed(1)} rating · ${provider.location}`;
      const action = document.createElement('a');
      action.href = 'provider-profile.html';
      action.className = 'dashboard-record-action';
      action.textContent = 'View profile';
      action.addEventListener('click', () => localStorage.setItem(KEYS.selectedProvider, provider.id));
      card.append(avatar, details, action);
      return card;
    }));
    document.querySelector('#favorites-empty').hidden = favoritesList.length > 0;
  }

  function renderReviews() {
    const list = document.querySelector('#reviews-list');
    list.replaceChildren(...reviews.slice().reverse().map((review) => {
      const card = document.createElement('article');
      card.className = 'dashboard-record-card';
      const heading = document.createElement('div');
      heading.className = 'dashboard-record-heading';
      const provider = document.createElement('strong');
      provider.textContent = review.providerName || 'Professional';
      const rating = document.createElement('span');
      rating.textContent = `${'★'.repeat(Math.max(0, Math.min(5, Number(review.rating))))} ${review.rating}/5`;
      heading.append(provider, rating);
      const meta = document.createElement('small');
      meta.textContent = `${review.sentiment || 'Review'} · ${review.bookingId}`;
      const comment = document.createElement('p');
      comment.textContent = review.comment;
      card.append(heading, meta, comment);
      return card;
    }));
    document.querySelector('#reviews-empty').hidden = reviews.length > 0;
  }

  function renderMessages() {
    const list = document.querySelector('#messages-list');
    list.replaceChildren(...messages.slice().reverse().map((message) => {
      const card = document.createElement('article');
      card.className = 'dashboard-record-card';
      const heading = document.createElement('div');
      heading.className = 'dashboard-record-heading';
      const provider = document.createElement('strong');
      provider.textContent = message.providerName || 'Professional';
      const meta = document.createElement('small');
      meta.textContent = message.bookingId || 'Saved message draft';
      const content = document.createElement('p');
      content.textContent = message.content;
      heading.append(provider, meta);
      card.append(heading, content);
      return card;
    }));
    document.querySelector('#messages-empty').hidden = messages.length > 0;
  }

  function showView(view) {
    const target = document.querySelector(`[data-view-panel="${view}"]`);
    if (!target) return;
    document.querySelectorAll('[data-view-panel]').forEach((panel) => { panel.hidden = panel !== target; });
    document.querySelectorAll('[data-dashboard-view]').forEach((link) => link.classList.toggle('is-active', link.dataset.dashboardView === view));
    document.querySelectorAll('[data-mobile-dashboard-view]').forEach((link) => link.classList.toggle('is-active', link.dataset.mobileDashboardView === view));
    if (view === 'favorites') renderFavorites();
    if (view === 'reviews') renderReviews();
    if (view === 'messages') renderMessages();
    if (view === 'settings') document.querySelector('#customer-name-input').value = customerName;
    if (view === 'dashboard') renderRecentBookings();
  }

  function attachNavigation() {
    document.querySelectorAll('[data-dashboard-view]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        searchInput.value = '';
        showView(link.dataset.dashboardView);
        history.replaceState(null, '', `#${link.dataset.dashboardView}`);
      });
    });
    document.querySelectorAll('[data-mobile-dashboard-view]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        searchInput.value = '';
        showView(link.dataset.mobileDashboardView);
        history.replaceState(null, '', `#${link.dataset.mobileDashboardView}`);
      });
    });
  }

  loadData();
  updateUserDetails();
  renderStats();
  renderUpcomingBooking();
  renderRecentBookings();
  renderFavorites();
  renderReviews();
  renderMessages();
  attachNavigation();
  const requestedView = window.location.hash.slice(1);
  if (['dashboard', 'favorites', 'reviews', 'messages', 'settings'].includes(requestedView)) showView(requestedView);

  document.querySelector('#notification-button').addEventListener('click', () => {
    const panel = document.querySelector('#notification-panel');
    const isExpanded = document.querySelector('#notification-button').getAttribute('aria-expanded') === 'true';
    document.querySelector('#notification-button').setAttribute('aria-expanded', String(!isExpanded));
    panel.hidden = isExpanded;
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.notification-wrap')) {
      document.querySelector('#notification-panel').hidden = true;
      document.querySelector('#notification-button').setAttribute('aria-expanded', 'false');
    }
  });
  searchInput.addEventListener('input', () => {
    showView('dashboard');
    renderRecentBookings(searchInput.value);
  });
  document.querySelector('#dashboard-search-form').addEventListener('submit', (event) => event.preventDefault());
  document.querySelector('#settings-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const nextName = document.querySelector('#customer-name-input').value.trim();
    if (!nextName) return;
    try {
      localStorage.setItem(KEYS.customerName, nextName);
      customerName = nextName;
      updateUserDetails();
      document.querySelector('#settings-status').textContent = 'Your profile name has been saved on this device.';
    } catch {
      document.querySelector('#settings-status').textContent = 'Could not save your name. Check browser storage and try again.';
    }
  });

  if (window.lucide) window.lucide.createIcons();
})();
