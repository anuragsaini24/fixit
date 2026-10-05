(() => {
  const KEYS = Object.freeze({
    users: 'fixit.admin.users',
    providers: 'fixit.admin.providers',
    bookings: 'fixit.admin.bookings',
    services: 'fixit.admin.services',
    reviews: 'fixit.admin.reviews',
    settings: 'fixit.admin.settings'
  });

  function readArray(key, fallback) {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      return Array.isArray(saved) ? saved : fallback;
    } catch {
      return fallback;
    }
  }

  const marketplaceProviders = window.FixItMarketplace?.providers || [];
  const seedProviders = marketplaceProviders.map((provider, index) => ({
    ...provider,
    accountStatus: index % 19 === 0 ? 'Pending' : 'Verified',
    isActive: index % 37 !== 0,
    joinedAt: `2026-${String((index % 9) + 1).padStart(2, '0')}-${String((index % 26) + 1).padStart(2, '0')}`
  }));
  const providerUsers = seedProviders.slice(0, 8).map((provider, index) => ({
    id: `user-${provider.id}`,
    name: provider.name,
    email: `${provider.id.replaceAll('-', '.')}@fixit.demo`,
    accountType: 'provider',
    status: provider.isActive ? 'Active' : 'Inactive',
    joinedAt: provider.joinedAt,
    providerId: provider.id
  }));
  const seedUsers = [
    { id: 'user-maya-shah', name: 'Maya Shah', email: 'maya.shah@example.com', accountType: 'customer', status: 'Active', joinedAt: '2026-01-18' },
    { id: 'user-oliver-chen', name: 'Oliver Chen', email: 'oliver.chen@example.com', accountType: 'customer', status: 'Active', joinedAt: '2026-02-03' },
    { id: 'user-amina-joseph', name: 'Amina Joseph', email: 'amina.joseph@example.com', accountType: 'customer', status: 'Inactive', joinedAt: '2026-02-21' },
    { id: 'user-ethan-lee', name: 'Ethan Lee', email: 'ethan.lee@example.com', accountType: 'customer', status: 'Active', joinedAt: '2026-03-10' },
    { id: 'user-sara-nair', name: 'Sara Nair', email: 'sara.nair@example.com', accountType: 'customer', status: 'Active', joinedAt: '2026-04-06' },
    { id: 'user-admin-demo', name: 'FixIt Admin', email: 'admin@fixit.demo', accountType: 'admin', status: 'Active', joinedAt: '2026-01-01' },
    ...providerUsers
  ];

  const seedBookings = [
    { bookingId: 'FIX-ADM-1042', customer: { customerId: 'user-maya-shah', name: 'Maya Shah' }, service: 'Electrical Repair', provider: { id: 'pro-aarav-patel', name: 'Aarav Patel' }, problem: 'Ceiling fan stopped working.', date: '2026-10-04', time: '10:00 AM', visitCharge: 99, estimatedCost: 450, status: 'Booking Confirmed' },
    { bookingId: 'FIX-ADM-1039', customer: { customerId: 'user-oliver-chen', name: 'Oliver Chen' }, service: 'Plumbing Repair', provider: { id: 'pro-ravi-kumar', name: 'Ravi Kumar' }, problem: 'Leak under the sink.', date: '2026-09-29', time: '02:00 PM', visitCharge: 99, estimatedCost: 750, status: 'Service Completed' },
    { bookingId: 'FIX-ADM-1035', customer: { customerId: 'user-ethan-lee', name: 'Ethan Lee' }, service: 'AC Repair', provider: { id: 'pro-nikhil-rao', name: 'Nikhil Rao' }, problem: 'AC is not cooling consistently.', date: '2026-09-27', time: '11:00 AM', visitCharge: 99, estimatedCost: 1250, status: 'Professional Assigned' },
    { bookingId: 'FIX-ADM-1028', customer: { customerId: 'user-sara-nair', name: 'Sara Nair' }, service: 'Laptop Hardware Repair', provider: { id: 'pro-ishaan-shah', name: 'Ishaan Shah' }, problem: 'Laptop will not charge.', date: '2026-09-23', time: '04:00 PM', visitCharge: 99, estimatedCost: 1100, status: 'Service Completed' },
    { bookingId: 'FIX-ADM-1019', customer: { customerId: 'user-amina-joseph', name: 'Amina Joseph' }, service: 'House cleaning', provider: { id: 'pro-nandini-bose', name: 'Nandini Bose' }, problem: 'One-bedroom deep clean.', date: '2026-09-20', time: '12:00 PM', visitCharge: 99, estimatedCost: 900, status: 'Booking Cancelled' }
  ];

  const seedServices = [
    { id: 'svc-electrician', name: 'Electrician', category: 'Home repair', priceFrom: 320, status: 'Active' },
    { id: 'svc-plumber', name: 'Plumber', category: 'Home repair', priceFrom: 250, status: 'Active' },
    { id: 'svc-cleaning', name: 'House cleaning', category: 'Cleaning', priceFrom: 700, status: 'Active' },
    { id: 'svc-ac', name: 'AC repair', category: 'Home repair', priceFrom: 450, status: 'Active' },
    { id: 'svc-laptop', name: 'Laptop repair', category: 'Electronics', priceFrom: 500, status: 'Active' },
    { id: 'svc-car', name: 'Car repair', category: 'Automotive', priceFrom: 800, status: 'Active' },
    { id: 'svc-pest', name: 'Pest control', category: 'Home care', priceFrom: 600, status: 'Active' },
    { id: 'svc-moving', name: 'Moving help', category: 'Moving', priceFrom: 1200, status: 'Inactive' }
  ];
  const seedReviews = [
    { id: 'rev-adm-1', bookingId: 'FIX-ADM-1039', providerId: 'pro-ravi-kumar', userName: 'Oliver Chen', providerName: 'Ravi Kumar', rating: 5, sentiment: 'Excellent', comment: 'Arrived on time and repaired the leak quickly.', createdAt: '2026-09-29T10:00:00.000Z', flagged: false },
    { id: 'rev-adm-2', bookingId: 'FIX-ADM-1028', providerId: 'pro-ishaan-shah', userName: 'Sara Nair', providerName: 'Ishaan Shah', rating: 4, sentiment: 'Good', comment: 'Clear explanation and careful laptop diagnostics.', createdAt: '2026-09-24T12:00:00.000Z', flagged: false },
    { id: 'rev-adm-3', bookingId: 'FIX-ADM-1011', providerId: 'pro-aarav-patel', userName: 'Maya Shah', providerName: 'Aarav Patel', rating: 2, sentiment: 'Poor', comment: 'The appointment ran late and communication was limited.', createdAt: '2026-09-22T09:00:00.000Z', flagged: false }
  ];

  const users = readArray(KEYS.users, seedUsers);
  const providers = readArray(KEYS.providers, seedProviders);
  const customerBookings = (() => {
    try {
      const saved = JSON.parse(localStorage.getItem('fixit.bookings') || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  })();
  const bookingMap = new Map([...seedBookings, ...customerBookings].filter((booking) => booking?.bookingId).map((booking) => [booking.bookingId, booking]));
  const bookings = readArray(KEYS.bookings, [...bookingMap.values()]);
  const services = readArray(KEYS.services, seedServices);
  const submittedReviews = (() => {
    try {
      return JSON.parse(localStorage.getItem('fixit.reviews') || '[]');
    } catch {
      return [];
    }
  })();
  const reviews = readArray(KEYS.reviews, [
    ...seedReviews,
    ...(Array.isArray(submittedReviews) ? submittedReviews.map((review, index) => ({ ...review, id: review.id || `rev-local-${index + 1}`, userName: review.customerName || 'FixIt customer', flagged: Boolean(review.flagged) })) : [])
  ]);

  [
    [KEYS.users, users], [KEYS.providers, providers], [KEYS.bookings, bookings],
    [KEYS.services, services], [KEYS.reviews, reviews]
  ].forEach(([key, value]) => {
    if (localStorage.getItem(key) === null) localStorage.setItem(key, JSON.stringify(value));
  });
  if (localStorage.getItem(KEYS.settings) === null) {
    localStorage.setItem(KEYS.settings, JSON.stringify({ platformName: 'FixIt', supportEmail: 'support@fixit.demo', maintenanceMode: false, providerVerificationRequired: true }));
  }

  window.FixItAdminData = Object.freeze({
    keys: KEYS,
    read: (collection) => readArray(KEYS[collection], []),
    save: (collection, value) => localStorage.setItem(KEYS[collection], JSON.stringify(value)),
    readSettings: () => {
      try {
        return JSON.parse(localStorage.getItem(KEYS.settings) || '{}');
      } catch {
        return {};
      }
    },
    saveSettings: (value) => localStorage.setItem(KEYS.settings, JSON.stringify(value))
  });
})();
