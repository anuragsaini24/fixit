(() => {
  const marketplace = window.FixItMarketplace;
  if (!marketplace) return;

  const { providers, states, storageKeys, normalize } = marketplace;
  const grid = document.querySelector('#provider-grid');
  const listingTitle = document.querySelector('#listing-title');
  const listingSubtitle = document.querySelector('#listing-subtitle');
  const listingCount = document.querySelector('#listing-count');
  const emptyState = document.querySelector('#provider-listing-empty');
  const pagination = document.querySelector('#provider-pagination');
  const paginationCount = document.querySelector('#pagination-count');
  const loadMoreButton = document.querySelector('#load-more');
  const stateFilter = document.querySelector('#location-filter');
  const priceFilter = document.querySelector('#price-filter');
  const priceValue = document.querySelector('#price-value');
  const ratingFilter = document.querySelector('#rating-filter');
  const availabilityFilter = document.querySelector('#availability-filter');
  const searchInput = document.querySelector('#provider-search');
  const sortFilter = document.querySelector('#sort-filter');
  const storageMessage = document.querySelector('.mock-data-note');
  let selectedService = '';
  let serviceProviders = providers;
  let displayLimit = 12;

  function formatPrice(price) {
    return `₹${price.toLocaleString('en-IN')}`;
  }

  function readSelectedService() {
    const requestedService = new URLSearchParams(window.location.search).get('service');
    if (requestedService) return requestedService;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKeys.recommendation) || 'null');
      if (typeof saved === 'string') return saved;
      if (saved && typeof saved.serviceCategory === 'string') return saved.serviceCategory;
      return localStorage.getItem(storageKeys.selectedService) || '';
    } catch {
      return '';
    }
  }

  function matchesService(provider, service) {
    const serviceName = normalize(service);
    return provider.services.some((providerService) => {
      const normalizedProviderService = normalize(providerService);
      return normalizedProviderService === serviceName
        || normalizedProviderService.includes(serviceName)
        || serviceName.includes(normalizedProviderService);
    });
  }

  function populateStateFilter() {
    stateFilter.replaceChildren(new Option('All states', ''), ...states.map((state) => new Option(state, state)));
  }

  function renderProviders(items) {
    grid.innerHTML = items.map((provider) => {
      const initials = provider.name.split(' ').map((part) => part[0]).slice(0, 2).join('');
      const serviceList = provider.services.slice(0, 3).map((service) => `<span>${service}</span>`).join('');
      return `
        <article class="provider-card">
          <div class="provider-card-head">
            <span class="provider-avatar avatar-${provider.avatarTone}" aria-label="${initials} profile avatar">${initials}</span>
            <div class="provider-identity">
              <div class="provider-name-row"><h2>${provider.name}</h2>${provider.verified ? '<span class="verified-badge" title="Verified professional"><i data-lucide="badge-check" aria-hidden="true"></i><span>Verified</span></span>' : ''}</div>
              <p>${provider.profession}</p>
            </div>
            <span class="availability-badge ${provider.availableToday ? '' : 'is-unavailable'}"><span></span>${provider.availableToday ? 'Available today' : 'Next available soon'}</span>
          </div>
          <div class="provider-rating-row"><span class="provider-rating"><i data-lucide="star" aria-hidden="true"></i><strong>${provider.rating.toFixed(1)}</strong></span><span>${provider.reviewCount} reviews</span><span class="metric-divider"></span><span>${provider.experience} yrs experience</span></div>
          <div class="provider-detail-row"><span><i data-lucide="map-pin" aria-hidden="true"></i>${provider.location}</span><span>${provider.distance.toFixed(1)} km away</span></div>
          <p class="provider-about">${provider.about}</p>
          <div class="provider-service-tags">${serviceList}</div>
          <div class="provider-card-footer"><p>Starting at <strong>${formatPrice(provider.startingPrice)}</strong></p><div class="provider-actions"><button class="profile-action" type="button" data-provider-action="profile" data-provider-id="${provider.id}">View Profile</button><button class="book-action" type="button" data-provider-action="book" data-provider-id="${provider.id}">Book Now <i data-lucide="arrow-right" aria-hidden="true"></i></button></div></div>
        </article>
      `;
    }).join('');
    if (window.lucide) window.lucide.createIcons();
  }

  function getVisibleProviders() {
    const query = normalize(searchInput.value);
    const minimumRating = Number(ratingFilter.value);
    const maximumPrice = Number(priceFilter.value);
    const state = stateFilter.value;
    const availability = availabilityFilter.value;
    const visible = serviceProviders.filter((provider) => {
      return (!query || normalize(provider.name).includes(query))
        && (!state || provider.state === state)
        && provider.startingPrice <= maximumPrice
        && provider.rating >= minimumRating
        && (availability !== 'today' || provider.availableToday);
    });

    return visible.sort((first, second) => {
      if (sortFilter.value === 'price') return first.startingPrice - second.startingPrice;
      if (sortFilter.value === 'distance') return first.distance - second.distance;
      return second.rating - first.rating || second.reviewCount - first.reviewCount;
    });
  }

  function renderListing(resetPage = true) {
    if (resetPage) displayLimit = 12;
    const matches = getVisibleProviders();
    const visible = matches.slice(0, displayLimit);
    renderProviders(visible);
    listingCount.textContent = `${matches.length} ${matches.length === 1 ? 'professional' : 'professionals'} found`;
    paginationCount.textContent = `Showing ${visible.length} of ${matches.length}`;
    pagination.hidden = visible.length >= matches.length;
    emptyState.hidden = matches.length > 0;
    grid.hidden = matches.length === 0;
  }

  function resetFilters() {
    searchInput.value = '';
    stateFilter.value = '';
    priceFilter.value = priceFilter.max;
    ratingFilter.value = '0';
    availabilityFilter.value = 'any';
    sortFilter.value = 'rating';
    priceValue.textContent = formatPrice(Number(priceFilter.value));
    renderListing();
  }

  function initialize() {
    selectedService = readSelectedService();
    serviceProviders = selectedService
      ? providers.filter((provider) => matchesService(provider, selectedService))
      : providers;
    listingTitle.textContent = selectedService ? `${selectedService} professionals near you` : 'Find the right pro';
    listingSubtitle.textContent = selectedService
      ? `Trusted local professionals for ${selectedService.toLowerCase()}, near you.`
      : 'Trusted local help, ready when you need it.';
    const maxPrice = Math.max(...serviceProviders.map((provider) => provider.startingPrice), 0);
    priceFilter.max = String(maxPrice);
    priceFilter.value = String(maxPrice);
    priceValue.textContent = formatPrice(maxPrice);
    populateStateFilter();
    renderListing();
  }

  [searchInput, stateFilter, ratingFilter, availabilityFilter, sortFilter].forEach((control) => {
    control.addEventListener('input', renderListing);
    control.addEventListener('change', renderListing);
  });
  priceFilter.addEventListener('input', () => {
    priceValue.textContent = formatPrice(Number(priceFilter.value));
    renderListing();
  });
  document.querySelectorAll('.reset-filters').forEach((button) => button.addEventListener('click', resetFilters));
  loadMoreButton.addEventListener('click', () => {
    displayLimit += 12;
    renderListing(false);
  });

  grid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-provider-action]');
    if (!button) return;
    try {
      localStorage.setItem(storageKeys.selectedProvider, button.dataset.providerId);
      if (selectedService) localStorage.setItem(storageKeys.selectedService, selectedService);
      const destination = button.dataset.providerAction === 'profile' ? 'provider-profile.html' : 'booking.html';
      window.location.href = destination;
    } catch {
      storageMessage.textContent = 'Your browser could not save the selected professional. Please allow local storage and try again.';
      storageMessage.classList.add('storage-error');
    }
  });

  initialize();
})();
