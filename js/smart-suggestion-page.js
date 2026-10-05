(() => {
  const STORAGE_KEY = 'fixit.recommendedService';
  const engine = window.FixItRecommendationEngine;
  const form = document.querySelector('#problem-form');
  const descriptionInput = document.querySelector('#problem-description');
  const characterCount = document.querySelector('#character-count');
  const formMessage = document.querySelector('#form-message');
  const emptyResult = document.querySelector('#suggestion-empty');
  const resultPanel = document.querySelector('#suggestion-result');
  const manualChoice = document.querySelector('#manual-choice');
  const manualCategory = document.querySelector('#manual-category');
  const recommendedService = document.querySelector('#recommended-service');
  const matchNote = document.querySelector('#match-note');
  const possibleIssues = document.querySelector('#possible-issues');
  const estimatedCost = document.querySelector('#estimated-cost');
  const professionalCount = document.querySelector('#professional-count');
  const findProfessionals = document.querySelector('#find-professionals');
  const menuToggle = document.querySelector('.assistant-menu-toggle');
  const navigation = document.querySelector('#assistant-nav');
  let activeRecommendation = null;
  let selectionMethod = 'description';

  menuToggle?.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
    navigation.classList.toggle('is-open', !isOpen);
  });

  navigation?.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      navigation.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation');
    }
  });

  function formatCost(value) {
    return `₹${value.toLocaleString('en-IN')}`;
  }

  function saveRecommendation(recommendation) {
    const record = {
      serviceCategory: recommendation.serviceCategory,
      keywords: recommendation.keywords,
      possibleIssues: recommendation.possibleIssues,
      minCost: recommendation.minCost,
      maxCost: recommendation.maxCost,
      professionalsCount: recommendation.professionalsCount,
      matchScore: recommendation.matchScore,
      matchedKeywords: recommendation.matchedKeywords,
      problemDescription: descriptionInput.value.trim(),
      selectionMethod,
      savedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
      return true;
    } catch {
      formMessage.textContent = 'Your browser could not save this suggestion. You can still review it here.';
      return false;
    }
  }

  function showRecommendation(recommendation) {
    if (!recommendation) return;
    activeRecommendation = recommendation;
    emptyResult.hidden = true;
    resultPanel.hidden = false;
    manualChoice.hidden = true;
    recommendedService.textContent = recommendation.serviceCategory;
    matchNote.textContent = selectionMethod === 'manual'
      ? 'Selected by you from the service categories.'
      : `Matched ${recommendation.matchedKeywords.length} ${recommendation.matchedKeywords.length === 1 ? 'keyword' : 'keywords'} in your description.`;
    possibleIssues.replaceChildren(...recommendation.possibleIssues.map((issue) => {
      const item = document.createElement('li');
      item.textContent = issue;
      return item;
    }));
    estimatedCost.textContent = `${formatCost(recommendation.minCost)} - ${formatCost(recommendation.maxCost)}`;
    professionalCount.textContent = recommendation.professionalsCount.toLocaleString('en-IN');
    if (window.lucide) window.lucide.createIcons();
    saveRecommendation(recommendation);
  }

  function populateCategories() {
    engine.getServices().forEach((service) => {
      const option = document.createElement('option');
      option.value = service.serviceCategory;
      option.textContent = service.serviceCategory;
      manualCategory.append(option);
    });
  }

  descriptionInput.addEventListener('input', () => {
    descriptionInput.setCustomValidity('');
    characterCount.textContent = `${descriptionInput.value.length} / 500`;
    formMessage.textContent = '';
    if (activeRecommendation) {
      activeRecommendation = null;
      resultPanel.hidden = true;
      emptyResult.hidden = false;
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        formMessage.textContent = 'Your browser may not allow updating saved suggestions.';
      }
    }
  });

  document.querySelectorAll('[data-example]').forEach((button) => {
    button.addEventListener('click', () => {
      descriptionInput.value = button.dataset.example;
      descriptionInput.dispatchEvent(new Event('input', { bubbles: true }));
      descriptionInput.focus();
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    descriptionInput.setCustomValidity(descriptionInput.value.trim() ? '' : 'Describe the problem before requesting a suggestion.');
    if (!form.reportValidity()) return;

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      formMessage.textContent = 'Your browser may not allow saving this suggestion.';
    }
    selectionMethod = 'description';
    manualCategory.value = '';
    const recommendation = engine.recommendService(descriptionInput.value);
    if (!recommendation) {
      activeRecommendation = null;
      resultPanel.hidden = true;
      emptyResult.hidden = false;
      manualChoice.hidden = false;
      formMessage.textContent = 'We couldn\'t confidently identify the service. Please select a category manually.';
      return;
    }
    formMessage.textContent = '';
    showRecommendation(recommendation);
  });

  manualCategory.addEventListener('change', () => {
    const service = engine.getServiceByCategory(manualCategory.value);
    if (!service) return;
    selectionMethod = 'manual';
    showRecommendation({ ...service, matchedKeywords: [], matchScore: 0 });
    formMessage.textContent = '';
  });

  findProfessionals.addEventListener('click', () => {
    if (!activeRecommendation || !saveRecommendation(activeRecommendation)) return;
    window.location.href = 'providers.html';
  });

  populateCategories();
  if (window.lucide) window.lucide.createIcons();
})();
