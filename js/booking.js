(() => {
  const marketplace = window.FixItMarketplace;
  const STORAGE = {
    bookings: 'fixit.bookings',
    latestBooking: 'fixit.latestBooking',
    latestBookingId: 'fixit.latestBookingId'
  };
  const providerName = document.querySelector('#booking-provider');
  const providerId = localStorage.getItem(marketplace.storageKeys.selectedProvider);
  const provider = marketplace.providers.find((item) => item.id === providerId);
  const recommendation = (() => {
    try {
      return JSON.parse(localStorage.getItem(marketplace.storageKeys.recommendation) || 'null');
    } catch {
      return null;
    }
  })();

  const serviceSelect = document.querySelector('#service-select');
  const problemInput = document.querySelector('#problem-description');
  const problemCounter = document.querySelector('#problem-counter');
  const dateOptions = document.querySelector('#date-options');
  const timeOptions = document.querySelector('#time-options');
  const backButton = document.querySelector('#booking-back');
  const nextButton = document.querySelector('#booking-next');
  const confirmButton = document.querySelector('#booking-confirm');
  const bookingError = document.querySelector('#booking-error');
  let activeStep = 1;
  let selectedDate = '';
  let selectedTime = '';

  function formatMoney(value) {
    return `₹${value.toLocaleString('en-IN')}`;
  }

  function formatDate(value, options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-IN', options);
  }

  function getEstimatedCost() {
    if (recommendation && provider.services.includes(recommendation.serviceCategory)
      && recommendation.serviceCategory === serviceSelect.value
      && Number.isFinite(recommendation.minCost) && Number.isFinite(recommendation.maxCost)) {
      return Math.round((recommendation.minCost + recommendation.maxCost) / 2);
    }
    return provider.startingPrice;
  }

  function populateServices() {
    const services = [...new Set(provider.services)];
    const recommendedService = recommendation && recommendation.serviceCategory;
    serviceSelect.replaceChildren(...services.map((service) => new Option(service, service)));
    serviceSelect.value = recommendedService && services.includes(recommendedService)
      ? recommendedService
      : services[0] || '';
  }

  function createDateOptions() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fragment = document.createDocumentFragment();
    for (let offset = 0; offset < 14; offset += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const button = document.createElement('button');
      button.className = 'date-option';
      button.type = 'button';
      button.dataset.date = value;
      button.setAttribute('aria-pressed', 'false');
      const dayLabel = document.createElement('span');
      dayLabel.textContent = offset === 0 ? 'Today' : date.toLocaleDateString('en-IN', { weekday: 'short' });
      const dateLabel = document.createElement('strong');
      dateLabel.textContent = String(date.getDate());
      const monthLabel = document.createElement('small');
      monthLabel.textContent = date.toLocaleDateString('en-IN', { month: 'short' });
      button.append(dayLabel, dateLabel, monthLabel);
      fragment.append(button);
    }
    dateOptions.replaceChildren(fragment);
  }

  function createTimeOptions() {
    const slots = ['10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '04:00 PM', '06:00 PM'];
    timeOptions.replaceChildren(...slots.map((time) => {
      const button = document.createElement('button');
      button.className = 'time-option';
      button.type = 'button';
      button.dataset.time = time;
      button.textContent = time;
      button.setAttribute('aria-pressed', 'false');
      return button;
    }));
  }

  function stepIsValid(step = activeStep) {
    if (!provider) return false;
    if (step === 1) return Boolean(serviceSelect.value);
    if (step === 2) return Boolean(problemInput.value.trim());
    if (step === 3) return Boolean(selectedDate);
    if (step === 4) return Boolean(selectedTime);
    return true;
  }

  function updateControls() {
    nextButton.disabled = !provider;
    confirmButton.disabled = ![1, 2, 3, 4].every((step) => stepIsValid(step));
  }

  function updateSummary() {
    const visitCharge = 99;
    const estimatedCost = getEstimatedCost();
    document.querySelector('#summary-service').textContent = serviceSelect.value;
    document.querySelector('#summary-provider').textContent = provider.name;
    document.querySelector('#summary-problem').textContent = problemInput.value.trim();
    document.querySelector('#summary-date').textContent = formatDate(selectedDate);
    document.querySelector('#summary-time').textContent = selectedTime;
    document.querySelector('#summary-visit-charge').textContent = formatMoney(visitCharge);
    document.querySelector('#summary-estimated-cost').textContent = formatMoney(estimatedCost);
    document.querySelector('#summary-total').textContent = formatMoney(visitCharge + estimatedCost);
  }

  function setStep(step, focusHeading = true) {
    activeStep = step;
    document.querySelectorAll('.booking-step').forEach((section) => {
      section.hidden = Number(section.dataset.step) !== step;
    });
    document.querySelectorAll('[data-step-indicator]').forEach((indicator) => {
      const indicatorStep = Number(indicator.dataset.stepIndicator);
      indicator.classList.toggle('is-current', indicatorStep === step);
      indicator.classList.toggle('is-complete', indicatorStep < step);
      if (indicatorStep === step) indicator.setAttribute('aria-current', 'step');
      else indicator.removeAttribute('aria-current');
    });
    document.querySelector('#step-count').textContent = `STEP ${String(step).padStart(2, '0')} OF 05`;
    document.querySelector('#stepper-progress-fill').style.width = `${((step - 1) / 4) * 100}%`;
    const heading = document.querySelector('#step-title');
    heading.textContent = ['Choose your service', 'Describe the problem', 'Select a date', 'Select a time', 'Review your booking'][step - 1];
    document.querySelector('#step-description').textContent = [
      'Confirm the service you need.',
      'Share a few details so the professional can prepare.',
      'Choose today or a future date.',
      'Pick one available arrival time.',
      'Check the details and estimated costs before confirming.'
    ][step - 1];
    backButton.hidden = step === 1;
    nextButton.hidden = step === 5;
    confirmButton.hidden = step !== 5;
    if (step === 5) updateSummary();
    updateControls();
    if (focusHeading) heading.focus();
  }

  function showValidationMessage() {
    const messages = {
      1: 'Choose a service to continue.',
      2: 'Describe the problem before continuing.',
      3: 'Select a date before continuing.',
      4: 'Select a time before continuing.'
    };
    const target = document.querySelector(`#${activeStep === 2 ? 'problem-error' : activeStep === 3 ? 'date-error' : activeStep === 4 ? 'time-error' : 'booking-error'}`);
    if (target) target.textContent = messages[activeStep] || 'Complete this step to continue.';
  }

  function clearStepErrors() {
    document.querySelectorAll('.booking-validation-message, #booking-error').forEach((element) => { element.textContent = ''; });
  }

  function handleConfirm() {
    if (![1, 2, 3, 4].every((step) => stepIsValid(step))) {
      showValidationMessage();
      return;
    }

    const visitCharge = 99;
    const estimatedCost = getEstimatedCost();
    const bookingId = `FIX-${Date.now().toString(36).toUpperCase()}`;
    const booking = {
      bookingId,
      customer: { customerId: 'guest-customer', name: 'Guest Customer' },
      service: serviceSelect.value,
      provider: { id: provider.id, name: provider.name },
      problem: problemInput.value.trim(),
      date: selectedDate,
      time: selectedTime,
      visitCharge,
      estimatedCost,
      status: 'Booking Confirmed'
    };

    try {
      const storedBookings = JSON.parse(localStorage.getItem(STORAGE.bookings) || '[]');
      const bookings = Array.isArray(storedBookings) ? storedBookings : [];
      bookings.push(booking);
      localStorage.setItem(STORAGE.bookings, JSON.stringify(bookings));
      localStorage.setItem(STORAGE.latestBooking, JSON.stringify(booking));
      localStorage.setItem(STORAGE.latestBookingId, bookingId);
      window.location.href = 'tracking.html';
    } catch {
      bookingError.textContent = 'We could not save your booking. Check browser storage and try again.';
    }
  }

  if (!provider) {
    providerName.textContent = 'No professional selected. Return to the provider list to choose one.';
    bookingError.textContent = 'Choose a professional before starting a booking.';
    nextButton.disabled = true;
    document.querySelector('.booking-side-note p').textContent = 'Select a professional first. Your booking details are stored on this device for this prototype.';
    return;
  }

  const initials = provider.name.split(' ').map((part) => part[0]).slice(0, 2).join('');
  document.querySelector('#booking-avatar').textContent = initials;
  document.querySelector('#booking-avatar').classList.add(`avatar-${provider.avatarTone}`);
  providerName.textContent = provider.name;
  document.querySelector('#booking-profession').textContent = provider.profession;
  document.querySelector('#booking-verified').hidden = !provider.verified;
  populateServices();
  createDateOptions();
  createTimeOptions();
  problemInput.value = typeof recommendation?.problemDescription === 'string' ? recommendation.problemDescription : '';
  problemCounter.textContent = `${problemInput.value.length} / 500`;

  serviceSelect.addEventListener('change', () => {
    clearStepErrors();
    updateControls();
  });
  problemInput.addEventListener('input', () => {
    problemCounter.textContent = `${problemInput.value.length} / 500`;
    document.querySelector('#problem-error').textContent = '';
    updateControls();
  });
  dateOptions.addEventListener('click', (event) => {
    const button = event.target.closest('[data-date]');
    if (!button) return;
    selectedDate = button.dataset.date;
    dateOptions.querySelectorAll('[data-date]').forEach((option) => {
      const selected = option === button;
      option.classList.toggle('is-selected', selected);
      option.setAttribute('aria-pressed', String(selected));
    });
    document.querySelector('#date-error').textContent = '';
    updateControls();
  });
  timeOptions.addEventListener('click', (event) => {
    const button = event.target.closest('[data-time]');
    if (!button) return;
    selectedTime = button.dataset.time;
    timeOptions.querySelectorAll('[data-time]').forEach((option) => {
      const selected = option === button;
      option.classList.toggle('is-selected', selected);
      option.setAttribute('aria-pressed', String(selected));
    });
    document.querySelector('#time-error').textContent = '';
    updateControls();
  });
  backButton.addEventListener('click', () => {
    clearStepErrors();
    setStep(Math.max(1, activeStep - 1));
  });
  nextButton.addEventListener('click', () => {
    if (!stepIsValid()) {
      showValidationMessage();
      return;
    }
    clearStepErrors();
    setStep(Math.min(5, activeStep + 1));
  });
  confirmButton.addEventListener('click', handleConfirm);

  document.querySelector('#booking-provider').textContent = provider.name;
  if (window.lucide) window.lucide.createIcons();
  setStep(1, false);
})();
