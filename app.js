(() => {
  const services = [
    { name: 'Plumbing', icon: 'faucet', detail: 'Faucets, pipes, drains', keywords: ['plumbing', 'plumber', 'pipe', 'leak', 'leaky', 'faucet', 'drain', 'toilet', 'water heater', 'clog'] },
    { name: 'House cleaning', icon: 'sparkles', detail: 'Regular, deep, and move-out', keywords: ['clean', 'cleaning', 'cleaner', 'deep clean', 'maid', 'move out', 'housekeeping'] },
    { name: 'Electrical', icon: 'zap', detail: 'Lighting, wiring, and repairs', keywords: ['electrical', 'electrician', 'electric', 'wiring', 'outlet', 'light', 'lighting', 'breaker'] },
    { name: 'AC & heating', icon: 'thermometer', detail: 'Air conditioning and heating', keywords: ['hvac', 'heating', 'cooling', 'ac', 'air conditioning', 'furnace', 'thermostat'] },
    { name: 'Appliance repair', icon: 'washing-machine', detail: 'Fridges, washers, and more', keywords: ['appliance', 'appliance repair', 'washing machine', 'washer', 'dryer', 'refrigerator', 'fridge', 'oven', 'dishwasher'] },
    { name: 'Handyman', icon: 'hammer', detail: 'The little jobs and the big ones', keywords: ['handyman', 'home repair', 'repair', 'shelf', 'mount', 'assembly', 'fix', 'door'] },
    { name: 'Painting', icon: 'paint-roller', detail: 'A fresh coat, inside or out', keywords: ['paint', 'painting', 'painter', 'wall', 'interior', 'exterior'] },
    { name: 'Pest control', icon: 'bug', detail: 'Help with unwanted visitors', keywords: ['pest', 'pest control', 'termite', 'ants', 'cockroach', 'rodent', 'exterminator'] },
    { name: 'Locksmith', icon: 'key-round', detail: 'Locks, keys, and lockouts', keywords: ['locksmith', 'lock', 'key', 'locked out', 'door lock'] },
    { name: 'Moving help', icon: 'truck', detail: 'Packing, loading, and moving', keywords: ['moving', 'movers', 'relocation', 'packing', 'loading', 'move house'] },
    { name: 'Lawn & garden', icon: 'trees', detail: 'Yard care and garden projects', keywords: ['lawn', 'garden', 'gardener', 'landscaping', 'yard', 'tree trimming'] },
    { name: 'Roof & gutters', icon: 'house', detail: 'Roof repairs and gutter cleaning', keywords: ['roof', 'roofing', 'gutter', 'gutter cleaning', 'shingles'] },
    { name: 'Window & door repair', icon: 'door-open', detail: 'Windows, doors, and screens', keywords: ['window', 'windows', 'door repair', 'glass', 'screen repair'] },
    { name: 'Home security', icon: 'shield-check', detail: 'Cameras, alarms, and smart locks', keywords: ['home security', 'security camera', 'alarm', 'smart lock', 'cctv'] },
    { name: 'Laptop & computer repair', icon: 'laptop', detail: 'Computer setup and repairs', keywords: ['laptop', 'computer', 'pc repair', 'computer repair', 'laptop repair'] },
    { name: 'Mobile phone repair', icon: 'smartphone', detail: 'Screens, batteries, and charging', keywords: ['mobile', 'mobile phone', 'phone repair', 'smartphone', 'screen repair'] },
    { name: 'Car repair', icon: 'car-front', detail: 'Local mechanics for your car', keywords: ['car', 'car repair', 'auto repair', 'mechanic', 'vehicle'] },
    { name: 'Bike repair', icon: 'bike', detail: 'Motorcycle servicing and repair', keywords: ['bike', 'motorcycle', 'scooter', 'bike repair', 'two wheeler'] }
  ];

  const grid = document.querySelector('#category-grid');
  const form = document.querySelector('#service-search');
  const queryInput = document.querySelector('#service-query');
  const status = document.querySelector('#search-status');
  const resultsCount = document.querySelector('#results-count');
  const emptyState = document.querySelector('#empty-state');
  const clearFilter = document.querySelector('#clear-filter');
  const menuToggle = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#primary-nav');

  function renderServices(items) {
    grid.innerHTML = items.map((service) => `
      <button class="category-card" type="button" data-category="${service.name}" aria-label="Find a pro for ${service.name}">
        <span class="category-icon"><i data-lucide="${service.icon}" aria-hidden="true"></i></span>
        <span class="category-info"><strong>${service.name}</strong><small>${service.detail}</small></span>
        <i class="category-arrow" data-lucide="arrow-right" aria-hidden="true"></i>
      </button>
    `).join('');
    if (window.lucide) window.lucide.createIcons();
  }

  function findServices(query) {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return services;
    return services.filter((service) => {
      const searchableText = [service.name, service.detail, ...service.keywords].join(' ').toLowerCase();
      return searchableText.includes(normalizedQuery);
    });
  }

  function applySearch(query, announce = true) {
    const matches = findServices(query);
    renderServices(matches);
    const hasQuery = query.trim().length > 0;
    resultsCount.textContent = hasQuery && matches.length ? `${matches.length} ${matches.length === 1 ? 'service' : 'services'} found` : '';
    emptyState.hidden = !hasQuery || matches.length > 0;
    clearFilter.hidden = !hasQuery;
    if (announce) {
      status.textContent = matches.length
        ? `${matches.length} ${matches.length === 1 ? 'service' : 'services'} match “${query.trim()}”. Explore the results below.`
        : `No exact service match for “${query.trim()}”. Try another search.`;
    }
    if (hasQuery) document.querySelector('#services').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    applySearch(queryInput.value);
  });

  document.querySelectorAll('[data-search]').forEach((button) => {
    button.addEventListener('click', () => {
      queryInput.value = button.dataset.search;
      applySearch(button.dataset.search);
    });
  });

  grid.addEventListener('click', (event) => {
    const card = event.target.closest('[data-category]');
    if (!card) return;
    queryInput.value = card.dataset.category;
    applySearch(card.dataset.category);
  });

  clearFilter.addEventListener('click', () => {
    queryInput.value = '';
    status.textContent = '';
    resultsCount.textContent = '';
    emptyState.hidden = true;
    clearFilter.hidden = true;
    renderServices(services);
  });

  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
    navigation.classList.toggle('is-open', !isOpen);
  });

  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      navigation.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation');
    }
  });

  renderServices(services);
  if (window.lucide) window.lucide.createIcons();
})();
