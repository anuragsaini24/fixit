(() => {
  const data = window.FixItAdminData;
  if (!data) return;
  const page = document.body.dataset.adminPage;
  const notice = document.querySelector('#admin-notice');
  const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
  const dateLabel = (value) => {
    if (!value) return '—';
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  function setNotice(message, isError = false) {
    if (!notice) return;
    notice.textContent = message;
    notice.classList.toggle('is-error', isError);
  }

  function saveCollection(name, value) {
    try {
      data.save(name, value);
      setNotice('Changes saved to this browser.');
      return true;
    } catch {
      setNotice('Could not save changes. Check browser storage and try again.', true);
      return false;
    }
  }

  function createCell(row, text) {
    const cell = document.createElement('td');
    cell.textContent = text ?? '—';
    row.append(cell);
    return cell;
  }

  function createActionButton(label, action, id, className = '') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `admin-row-action ${className}`.trim();
    button.dataset.action = action;
    button.dataset.id = id;
    button.textContent = label;
    return button;
  }

  function showDetails(title, rows) {
    const dialog = document.querySelector('#admin-details-dialog');
    if (!dialog) return;
    document.querySelector('#admin-details-title').textContent = title;
    const content = document.querySelector('#admin-details-content');
    content.replaceChildren(...rows.map(([label, value]) => {
      const row = document.createElement('div');
      row.className = 'admin-detail-row';
      const key = document.createElement('strong');
      const detail = document.createElement('span');
      key.textContent = label;
      detail.textContent = value ?? '—';
      row.append(key, detail);
      return row;
    }));
    dialog.showModal();
  }

  function renderDashboard() {
    document.querySelector('#admin-date-label').textContent = new Date().toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    const users = data.read('users');
    const providers = data.read('providers');
    const bookings = data.read('bookings');
    const completedBookings = bookings.filter((booking) => booking.status === 'Service Completed');
    const revenue = completedBookings.reduce((sum, booking) => sum + Number(booking.visitCharge || 0) + Number(booking.estimatedCost || 0), 0);
    document.querySelector('#admin-stat-users').textContent = users.length.toLocaleString('en-IN');
    document.querySelector('#admin-stat-providers').textContent = providers.length.toLocaleString('en-IN');
    document.querySelector('#admin-stat-bookings').textContent = bookings.length.toLocaleString('en-IN');
    document.querySelector('#admin-stat-revenue').textContent = money(revenue);

    const body = document.querySelector('#admin-recent-bookings');
    const latest = bookings.slice().sort((first, second) => (second.date || '').localeCompare(first.date || '')).slice(0, 7);
    body.replaceChildren(...latest.map((booking) => {
      const row = document.createElement('tr');
      createCell(row, booking.customer?.name || 'Guest Customer');
      createCell(row, booking.service);
      createCell(row, booking.provider?.name);
      createCell(row, dateLabel(booking.date));
      const statusCell = createCell(row, booking.status);
      statusCell.className = `status-cell status-${booking.status === 'Service Completed' ? 'completed' : booking.status === 'Booking Cancelled' || booking.status === 'Rejected' ? 'cancelled' : 'pending'}`;
      createCell(row, money(Number(booking.visitCharge || 0) + Number(booking.estimatedCost || 0)));
      return row;
    }));
  }

  function renderUsers() {
    const query = document.querySelector('#user-search').value.trim().toLowerCase();
    const filter = document.querySelector('#user-filter').value;
    const users = data.read('users').filter((user) => {
      const matchesQuery = !query || [user.name, user.email, user.id].join(' ').toLowerCase().includes(query);
      const matchesFilter = filter === 'all' || user.accountType === filter || user.status.toLowerCase() === filter;
      return matchesQuery && matchesFilter;
    });
    const body = document.querySelector('#admin-users-table');
    body.replaceChildren(...users.map((user) => {
      const row = document.createElement('tr');
      createCell(row, user.name);
      createCell(row, user.email);
      createCell(row, user.accountType);
      createCell(row, dateLabel(user.joinedAt));
      const status = createCell(row, user.status);
      status.className = `status-cell ${user.status === 'Active' ? 'status-completed' : 'status-cancelled'}`;
      const actions = document.createElement('td');
      actions.append(createActionButton('View', 'view-user', user.id), createActionButton(user.status === 'Active' ? 'Deactivate' : 'Activate', 'toggle-user', user.id));
      row.append(actions);
      return row;
    }));
    document.querySelector('#user-results').textContent = `${users.length} users`;
    document.querySelector('#users-empty').hidden = users.length > 0;
  }

  function renderProviders() {
    const query = document.querySelector('#provider-search').value.trim().toLowerCase();
    const filter = document.querySelector('#provider-filter').value;
    const providers = data.read('providers').filter((provider) => {
      const matchesQuery = !query || [provider.name, provider.profession, provider.location, provider.id].join(' ').toLowerCase().includes(query);
      const matchesFilter = filter === 'all'
        || (filter === 'verified' && provider.accountStatus === 'Verified')
        || (filter === 'pending' && provider.accountStatus === 'Pending')
        || (filter === 'active' && provider.isActive)
        || (filter === 'inactive' && !provider.isActive);
      return matchesQuery && matchesFilter;
    });
    const body = document.querySelector('#admin-providers-table');
    body.replaceChildren(...providers.slice(0, 60).map((provider) => {
      const row = document.createElement('tr');
      createCell(row, provider.name);
      createCell(row, provider.profession);
      createCell(row, provider.location);
      const verification = createCell(row, provider.accountStatus);
      verification.className = `status-cell ${provider.accountStatus === 'Verified' ? 'status-completed' : 'status-pending'}`;
      createCell(row, provider.isActive ? 'Active' : 'Inactive');
      const actions = document.createElement('td');
      actions.append(createActionButton('View', 'view-provider', provider.id));
      if (provider.accountStatus !== 'Verified') actions.append(createActionButton('Verify', 'verify-provider', provider.id, 'admin-verify-action'));
      row.append(actions);
      return row;
    }));
    document.querySelector('#provider-results').textContent = `Showing ${Math.min(providers.length, 60)} of ${providers.length} providers`;
    document.querySelector('#providers-empty').hidden = providers.length > 0;
  }

  function renderBookings() {
    const query = document.querySelector('#booking-search').value.trim().toLowerCase();
    const filter = document.querySelector('#booking-status-filter').value;
    const bookings = data.read('bookings').filter((booking) => {
      const matchesQuery = !query || [booking.bookingId, booking.service, booking.customer?.name, booking.provider?.name].join(' ').toLowerCase().includes(query);
      const matchesFilter = filter === 'all' || booking.status === filter;
      return matchesQuery && matchesFilter;
    });
    const body = document.querySelector('#admin-bookings-table');
    body.replaceChildren(...bookings.map((booking) => {
      const row = document.createElement('tr');
      createCell(row, booking.bookingId);
      createCell(row, booking.customer?.name || 'Guest Customer');
      createCell(row, booking.service);
      createCell(row, booking.provider?.name);
      createCell(row, dateLabel(booking.date));
      const status = createCell(row, booking.status);
      status.className = `status-cell status-${booking.status === 'Service Completed' ? 'completed' : booking.status === 'Booking Cancelled' || booking.status === 'Rejected' ? 'cancelled' : 'pending'}`;
      const actions = document.createElement('td');
      actions.append(createActionButton('View details', 'view-booking', booking.bookingId));
      row.append(actions);
      return row;
    }));
    document.querySelector('#booking-results').textContent = `${bookings.length} bookings`;
    document.querySelector('#bookings-empty').hidden = bookings.length > 0;
  }

  function renderServices() {
    const services = data.read('services');
    const query = document.querySelector('#service-search').value.trim().toLowerCase();
    const filtered = services.filter((service) => `${service.name} ${service.category} ${service.status}`.toLowerCase().includes(query));
    const body = document.querySelector('#admin-services-table');
    body.replaceChildren(...filtered.map((service) => {
      const row = document.createElement('tr');
      createCell(row, service.name);
      createCell(row, service.category);
      createCell(row, money(service.priceFrom));
      const status = createCell(row, service.status);
      status.className = `status-cell ${service.status === 'Active' ? 'status-completed' : 'status-cancelled'}`;
      const actions = document.createElement('td');
      actions.append(createActionButton('Edit', 'edit-service', service.id), createActionButton('Delete', 'delete-service', service.id, 'admin-delete-action'));
      row.append(actions);
      return row;
    }));
    document.querySelector('#service-results').textContent = `${filtered.length} services`;
    document.querySelector('#services-empty').hidden = filtered.length > 0;
  }

  function renderReviews() {
    const query = document.querySelector('#review-search').value.trim().toLowerCase();
    const filter = document.querySelector('#review-filter').value;
    const reviews = data.read('reviews').filter((review) => {
      const matchesQuery = !query || [review.userName, review.providerName, review.comment, review.bookingId].join(' ').toLowerCase().includes(query);
      return matchesQuery && (filter === 'all' || (filter === 'flagged' ? review.flagged : !review.flagged));
    });
    const body = document.querySelector('#admin-reviews-table');
    body.replaceChildren(...reviews.map((review) => {
      const row = document.createElement('tr');
      createCell(row, review.userName);
      createCell(row, review.providerName);
      createCell(row, `${review.rating} / 5`);
      createCell(row, review.sentiment || '—');
      createCell(row, review.comment);
      const flag = createCell(row, review.flagged ? 'Flagged' : 'Clear');
      flag.className = `status-cell ${review.flagged ? 'status-cancelled' : 'status-completed'}`;
      const actions = document.createElement('td');
      actions.append(createActionButton('View', 'view-review', review.id), createActionButton(review.flagged ? 'Unflag' : 'Flag', 'toggle-review', review.id, review.flagged ? '' : 'admin-flag-action'));
      row.append(actions);
      return row;
    }));
    document.querySelector('#review-results').textContent = `${reviews.length} reviews`;
    document.querySelector('#reviews-empty').hidden = reviews.length > 0;
  }

  function renderReports() {
    const bookings = data.read('bookings');
    const completed = bookings.filter((booking) => booking.status === 'Service Completed');
    const revenue = completed.reduce((sum, booking) => sum + Number(booking.visitCharge || 0) + Number(booking.estimatedCost || 0), 0);
    document.querySelector('#report-total-bookings').textContent = bookings.length.toLocaleString('en-IN');
    document.querySelector('#report-completed').textContent = completed.length.toLocaleString('en-IN');
    document.querySelector('#report-revenue').textContent = money(revenue);
    const byService = new Map();
    completed.forEach((booking) => byService.set(booking.service, (byService.get(booking.service) || 0) + Number(booking.visitCharge || 0) + Number(booking.estimatedCost || 0)));
    const body = document.querySelector('#report-services-table');
    body.replaceChildren(...[...byService].sort((first, second) => second[1] - first[1]).map(([service, amount]) => {
      const row = document.createElement('tr');
      createCell(row, service);
      createCell(row, completed.filter((booking) => booking.service === service).length);
      createCell(row, money(amount));
      return row;
    }));
    const paymentsBody = document.querySelector('#report-payments-table');
    paymentsBody.replaceChildren(...completed.slice().sort((first, second) => (second.date || '').localeCompare(first.date || '')).map((booking) => {
      const row = document.createElement('tr');
      createCell(row, booking.bookingId);
      createCell(row, booking.customer?.name || 'Guest Customer');
      createCell(row, dateLabel(booking.date));
      createCell(row, money(Number(booking.visitCharge || 0) + Number(booking.estimatedCost || 0)));
      return row;
    }));
  }

  function initializeSettings() {
    const settings = data.readSettings();
    document.querySelector('#setting-platform-name').value = settings.platformName || 'FixIt';
    document.querySelector('#setting-support-email').value = settings.supportEmail || '';
    document.querySelector('#setting-maintenance').checked = Boolean(settings.maintenanceMode);
    document.querySelector('#setting-provider-verification').checked = Boolean(settings.providerVerificationRequired);
  }

  function refresh() {
    if (page === 'dashboard') renderDashboard();
    if (page === 'users') renderUsers();
    if (page === 'providers') renderProviders();
    if (page === 'bookings') renderBookings();
    if (page === 'services') renderServices();
    if (page === 'reviews') renderReviews();
    if (page === 'reports') renderReports();
    if (page === 'settings') initializeSettings();
  }

  function bindFilters() {
    const bindings = {
      users: ['#user-search', '#user-filter'],
      providers: ['#provider-search', '#provider-filter'],
      bookings: ['#booking-search', '#booking-status-filter'],
      services: ['#service-search'],
      reviews: ['#review-search', '#review-filter']
    };
    (bindings[page] || []).forEach((selector) => {
      const control = document.querySelector(selector);
      control?.addEventListener('input', refresh);
      control?.addEventListener('change', refresh);
    });
  }

  function openServiceDialog(service = null) {
    const dialog = document.querySelector('#service-dialog');
    if (!dialog) return;
    document.querySelector('#service-dialog-title').textContent = service ? 'Edit service' : 'Add service';
    document.querySelector('#service-id').value = service?.id || '';
    document.querySelector('#service-name').value = service?.name || '';
    document.querySelector('#service-category').value = service?.category || '';
    document.querySelector('#service-price').value = service?.priceFrom ?? '';
    document.querySelector('#service-status').value = service?.status || 'Active';
    dialog.showModal();
  }

  document.querySelectorAll('[data-close-admin-dialog]').forEach((button) => button.addEventListener('click', () => button.closest('dialog').close()));
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const { action, id } = button.dataset;

    if (action === 'view-user') {
      const user = data.read('users').find((item) => item.id === id);
      if (user) showDetails(user.name, [['Email', user.email], ['Account type', user.accountType], ['Status', user.status], ['Joined', dateLabel(user.joinedAt)]]);
    }
    if (action === 'toggle-user') {
      const users = data.read('users');
      const user = users.find((item) => item.id === id);
      if (user) {
        user.status = user.status === 'Active' ? 'Inactive' : 'Active';
        if (saveCollection('users', users)) renderUsers();
      }
    }
    if (action === 'view-provider') {
      const provider = data.read('providers').find((item) => item.id === id);
      if (provider) showDetails(provider.name, [['Profession', provider.profession], ['Location', provider.location], ['Rating', `${provider.rating} / 5`], ['Verification', provider.accountStatus], ['Status', provider.isActive ? 'Active' : 'Inactive'], ['Services', provider.services.join(', ')]]);
    }
    if (action === 'verify-provider') {
      const providers = data.read('providers');
      const provider = providers.find((item) => item.id === id);
      if (provider) {
        provider.accountStatus = 'Verified';
        provider.verified = true;
        if (saveCollection('providers', providers)) renderProviders();
      }
    }
    if (action === 'view-booking') {
      const booking = data.read('bookings').find((item) => item.bookingId === id);
      if (booking) showDetails(booking.bookingId, [['User', booking.customer?.name || 'Guest Customer'], ['Service', booking.service], ['Provider', booking.provider?.name], ['Date', dateLabel(booking.date)], ['Time', booking.time], ['Status', booking.status], ['Amount', money(Number(booking.visitCharge || 0) + Number(booking.estimatedCost || 0))], ['Problem', booking.problem]]);
    }
    if (action === 'edit-service') {
      const service = data.read('services').find((item) => item.id === id);
      if (service) openServiceDialog(service);
    }
    if (action === 'delete-service') {
      const services = data.read('services');
      const service = services.find((item) => item.id === id);
      if (service && window.confirm(`Delete ${service.name}?`)) {
        if (saveCollection('services', services.filter((item) => item.id !== id))) renderServices();
      }
    }
    if (action === 'view-review') {
      const review = data.read('reviews').find((item) => item.id === id);
      if (review) showDetails(`Review by ${review.userName}`, [['Provider', review.providerName], ['Rating', `${review.rating} / 5`], ['Sentiment', review.sentiment || '—'], ['Booking', review.bookingId], ['Comment', review.comment], ['Flagged', review.flagged ? 'Yes' : 'No']]);
    }
    if (action === 'toggle-review') {
      const reviews = data.read('reviews');
      const review = reviews.find((item) => item.id === id);
      if (review) {
        review.flagged = !review.flagged;
        if (saveCollection('reviews', reviews)) renderReviews();
      }
    }
  });

  document.querySelector('#admin-details-close')?.addEventListener('click', () => document.querySelector('#admin-details-dialog').close());
  document.querySelector('#add-service-button')?.addEventListener('click', () => openServiceDialog());
  document.querySelector('#service-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const services = data.read('services');
    const id = document.querySelector('#service-id').value || `svc-${Date.now().toString(36)}`;
    const record = {
      id,
      name: document.querySelector('#service-name').value.trim(),
      category: document.querySelector('#service-category').value.trim(),
      priceFrom: Number(document.querySelector('#service-price').value),
      status: document.querySelector('#service-status').value
    };
    const index = services.findIndex((service) => service.id === id);
    if (index === -1) services.push(record);
    else services[index] = record;
    if (saveCollection('services', services)) {
      document.querySelector('#service-dialog').close();
      renderServices();
    }
  });
  document.querySelector('#settings-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const settings = {
      platformName: document.querySelector('#setting-platform-name').value.trim(),
      supportEmail: document.querySelector('#setting-support-email').value.trim(),
      maintenanceMode: document.querySelector('#setting-maintenance').checked,
      providerVerificationRequired: document.querySelector('#setting-provider-verification').checked
    };
    try {
      data.saveSettings(settings);
      document.querySelector('#settings-saved').textContent = 'Settings saved to this browser.';
    } catch {
      document.querySelector('#settings-saved').textContent = 'Could not save settings. Check browser storage and try again.';
    }
  });

  bindFilters();
  refresh();
  if (window.lucide) window.lucide.createIcons();
})();
