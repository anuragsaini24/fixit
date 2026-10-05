export const serviceSeed = [
  { id: 'svc-plumbing', name: 'Plumbing', category: 'Home repair', detail: 'Faucets, pipes, drains', icon: 'faucet', keywords: ['plumbing', 'plumber', 'pipe', 'leak', 'faucet'], priceFrom: 250 },
  { id: 'svc-cleaning', name: 'House cleaning', category: 'Cleaning', detail: 'Regular, deep, and move-out', icon: 'sparkles', keywords: ['cleaning', 'deep clean', 'maid'], priceFrom: 700 },
  { id: 'svc-electrical', name: 'Electrical', category: 'Home repair', detail: 'Lighting, wiring, and repairs', icon: 'zap', keywords: ['electrical', 'electrician', 'wiring', 'fan'], priceFrom: 320 },
  { id: 'svc-ac', name: 'AC repair', category: 'Home repair', detail: 'Air conditioning and heating', icon: 'thermometer', keywords: ['ac', 'hvac', 'cooling', 'air conditioning'], priceFrom: 450 },
  { id: 'svc-appliance', name: 'Appliance repair', category: 'Electronics', detail: 'Fridges, washers, and more', icon: 'washing-machine', keywords: ['appliance', 'washer', 'refrigerator'], priceFrom: 500 },
  { id: 'svc-handyman', name: 'Handyman', category: 'Home repair', detail: 'Small fixes and home projects', icon: 'hammer', keywords: ['handyman', 'repair', 'assembly', 'mount'], priceFrom: 350 },
  { id: 'svc-pest', name: 'Pest control', category: 'Home care', detail: 'Help with unwanted visitors', icon: 'bug', keywords: ['pest', 'termite', 'ants'], priceFrom: 600 },
  { id: 'svc-laptop', name: 'Laptop repair', category: 'Electronics', detail: 'Computer setup and repairs', icon: 'laptop', keywords: ['laptop', 'computer', 'not charging'], priceFrom: 500 },
  { id: 'svc-car', name: 'Car repair', category: 'Automotive', detail: 'Local mechanics for your car', icon: 'car-front', keywords: ['car', 'mechanic', 'auto repair'], priceFrom: 800 },
  { id: 'svc-moving', name: 'Moving help', category: 'Moving', detail: 'Packing, loading, and moving', icon: 'truck', keywords: ['moving', 'relocation', 'packing'], priceFrom: 1200 },
];

export const providerSeed = [
  { id: 'pro-aarav-patel', name: 'Aarav Patel', profession: 'Electrician', serviceIds: ['svc-electrical'], services: ['Electrical', 'Electrical Repair', 'Wiring', 'Fan installation'], rating: 4.9, reviewCount: 186, experience: 9, distance: 1.2, startingPrice: 450, verified: true, availableToday: true, location: 'Indiranagar, Bengaluru', state: 'Karnataka', about: 'A licensed electrician focused on safe home repairs, fan installations, and reliable wiring work.', avatarTone: 'blue' },
  { id: 'pro-meera-iyer', name: 'Meera Iyer', profession: 'Electrical Technician', serviceIds: ['svc-electrical'], services: ['Electrical', 'Lighting', 'Switches'], rating: 4.8, reviewCount: 124, experience: 7, distance: 2.4, startingPrice: 380, verified: true, availableToday: false, location: 'Koramangala, Bengaluru', state: 'Karnataka', about: 'Residential electrical technician for lighting, switches, and safety checks.', avatarTone: 'green' },
  { id: 'pro-ravi-kumar', name: 'Ravi Kumar', profession: 'Plumber', serviceIds: ['svc-plumbing'], services: ['Plumbing', 'Leak repair', 'Drain cleaning'], rating: 4.9, reviewCount: 211, experience: 11, distance: 1.6, startingPrice: 350, verified: true, availableToday: true, location: 'HSR Layout, Bengaluru', state: 'Karnataka', about: 'Experienced in leak detection, bathroom fittings, and drain repairs.', avatarTone: 'teal' },
  { id: 'pro-ananya-das', name: 'Ananya Das', profession: 'Plumbing Specialist', serviceIds: ['svc-plumbing'], services: ['Plumbing', 'Pipe repair', 'Tap installation'], rating: 4.8, reviewCount: 102, experience: 8, distance: 2.9, startingPrice: 400, verified: true, availableToday: false, location: 'Whitefield, Bengaluru', state: 'Karnataka', about: 'Home plumbing specialist for pipes, taps, and fixture installation.', avatarTone: 'rose' },
  { id: 'pro-nikhil-rao', name: 'Nikhil Rao', profession: 'AC Technician', serviceIds: ['svc-ac'], services: ['AC repair', 'AC servicing', 'Air conditioning'], rating: 4.9, reviewCount: 157, experience: 10, distance: 2.1, startingPrice: 500, verified: true, availableToday: true, location: 'Indiranagar, Bengaluru', state: 'Karnataka', about: 'AC technician for seasonal servicing, cooling issues, and split-unit repairs.', avatarTone: 'blue' },
  { id: 'pro-ishaan-shah', name: 'Ishaan Shah', profession: 'Laptop Repair Specialist', serviceIds: ['svc-laptop'], services: ['Laptop repair', 'Hardware diagnostics'], rating: 4.9, reviewCount: 143, experience: 7, distance: 1.9, startingPrice: 600, verified: true, availableToday: false, location: 'Jayanagar, Bengaluru', state: 'Karnataka', about: 'Computer repair specialist for charging faults, diagnostics, and laptop upgrades.', avatarTone: 'orange' },
  { id: 'pro-nandini-bose', name: 'Nandini Bose', profession: 'Home Cleaning Professional', serviceIds: ['svc-cleaning'], services: ['House cleaning', 'Deep cleaning', 'Move-out cleaning'], rating: 4.9, reviewCount: 204, experience: 9, distance: 2.2, startingPrice: 700, verified: true, availableToday: false, location: 'Koramangala, Bengaluru', state: 'Karnataka', about: 'Home cleaning professional offering regular and deep cleans.', avatarTone: 'green' },
  { id: 'pro-suresh-gowda', name: 'Suresh Gowda', profession: 'Car Mechanic', serviceIds: ['svc-car'], services: ['Car repair', 'Car servicing', 'Brake repair'], rating: 4.8, reviewCount: 119, experience: 12, distance: 4.6, startingPrice: 800, verified: true, availableToday: true, location: 'Jayanagar, Bengaluru', state: 'Karnataka', about: 'Local mechanic for routine car servicing and repairs.', avatarTone: 'teal' },
];

export const accountSeed = [
  { id: 'usr-maya', name: 'Maya Shah', email: 'maya.shah@example.com', accountType: 'customer', status: 'Active', joinedAt: '2026-01-18' },
  { id: 'usr-aarav', name: 'Aarav Patel', email: 'aarav.patel@fixit.demo', accountType: 'provider', providerId: 'pro-aarav-patel', status: 'Active', joinedAt: '2026-01-10' },
  { id: 'usr-admin', name: 'FixIt Admin', email: 'admin@fixit.demo', accountType: 'admin', status: 'Active', joinedAt: '2026-01-01' },
];

export const reviewSeed = [
  { id: 'rev-demo-1', bookingId: 'FIX-DEMO-1039', providerId: 'pro-ravi-kumar', providerName: 'Ravi Kumar', customerId: 'usr-maya', customerName: 'Maya Shah', rating: 5, sentiment: 'Excellent', comment: 'Arrived on time and repaired the leak quickly.', createdAt: '2026-09-30T10:00:00.000Z', flagged: false },
];
