(() => {
  const marketplace = window.FixItMarketplace;
  const emptyState = document.querySelector('#profile-empty');
  const profile = document.querySelector('#provider-profile');
  const status = document.querySelector('#profile-message-status');
  const messageDialog = document.querySelector('#message-dialog');
  const messageForm = document.querySelector('#message-form');
  const messageContent = document.querySelector('#message-content');
  let provider = null;

  function getFavoriteIds() {
    try {
      const saved = JSON.parse(localStorage.getItem(marketplace.storageKeys.favorites) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function updateFavoriteButton(isFavorite) {
    const favoriteButton = document.querySelector('#favorite-provider');
    favoriteButton.setAttribute('aria-pressed', String(isFavorite));
    favoriteButton.querySelector('span').textContent = isFavorite ? 'Remove from Favorites' : 'Add to Favorites';
    favoriteButton.classList.toggle('is-favorite', isFavorite);
    favoriteButton.querySelector('svg')?.classList.toggle('heart-filled', isFavorite);
  }

  function renderReviews(reviews) {
    const reviewList = document.querySelector('#review-list');
    reviewList.replaceChildren(...reviews.map((review) => {
      const article = document.createElement('article');
      article.className = 'profile-review';
      const heading = document.createElement('div');
      heading.className = 'profile-review-heading';
      const reviewer = document.createElement('strong');
      reviewer.textContent = review.reviewer;
      const date = document.createElement('time');
      date.textContent = review.date;
      const rating = document.createElement('span');
      rating.className = 'review-rating';
      const ratingIcon = document.createElement('i');
      ratingIcon.dataset.lucide = 'star';
      ratingIcon.setAttribute('aria-hidden', 'true');
      rating.append(ratingIcon, document.createTextNode(` ${review.rating.toFixed(1)}`));
      heading.append(reviewer, date, rating);
      const comment = document.createElement('p');
      comment.textContent = review.comment;
      article.append(heading, comment);
      return article;
    }));
  }

  try {
    const providerId = localStorage.getItem(marketplace.storageKeys.selectedProvider);
    provider = marketplace.providers.find((item) => item.id === providerId);
    if (!provider) {
      emptyState.hidden = false;
      return;
    }

    const initials = provider.name.split(' ').map((part) => part[0]).slice(0, 2).join('');
    document.querySelector('#profile-avatar').textContent = initials;
    document.querySelector('#profile-avatar').classList.add(`avatar-${provider.avatarTone}`);
    document.querySelector('#profile-name').textContent = provider.name;
    document.querySelector('#profile-profession').textContent = provider.profession;
    document.querySelector('#profile-rating').textContent = provider.rating.toFixed(1);
    document.querySelector('#profile-aside-rating').textContent = provider.rating.toFixed(1);
    document.querySelector('#profile-review-count').textContent = `${provider.reviewCount.toLocaleString('en-IN')} reviews`;
    document.querySelector('#profile-experience').textContent = `${provider.experience} years experience`;
    document.querySelector('#profile-experience-detail').textContent = `${provider.experience} years experience`;
    document.querySelector('#profile-location').textContent = provider.location;
    document.querySelector('#profile-distance').textContent = `${provider.distance.toFixed(1)} km away`;
    document.querySelector('#profile-price').textContent = `From ₹${provider.startingPrice.toLocaleString('en-IN')}`;
    document.querySelector('#profile-verified').hidden = !provider.verified;
    document.querySelector('#profile-about').textContent = provider.about;
    document.querySelector('#profile-services').replaceChildren(...provider.services.map((service) => {
      const item = document.createElement('li');
      item.textContent = service;
      return item;
    }));
    document.querySelector('#profile-availability').innerHTML = `<span></span>${provider.availableToday ? 'Available today' : 'Next available soon'}`;
    document.querySelector('#profile-availability').classList.toggle('is-unavailable', !provider.availableToday);
    document.querySelector('#availability-dot').classList.toggle('is-unavailable', !provider.availableToday);
    document.querySelector('#availability-heading').textContent = provider.availableToday ? 'Available today' : 'Not available today';
    document.querySelector('#availability-description').textContent = provider.availableToday
      ? 'This professional is taking requests today. Confirm a suitable time when you book.'
      : 'This professional is not available today. Book to ask about their next open time.';
    document.querySelector('#reviews-average').textContent = `${provider.rating.toFixed(1)} / 5`;
    renderReviews(provider.reviews || []);
    document.querySelector('#call-provider').href = `tel:${provider.phone.replace(/\s+/g, '')}`;
    document.querySelector('#message-provider-name').textContent = provider.name;
    updateFavoriteButton(getFavoriteIds().includes(provider.id));
    profile.hidden = false;
    if (window.lucide) window.lucide.createIcons();
  } catch {
    emptyState.hidden = false;
  }

  document.querySelector('#book-service').addEventListener('click', () => {
    if (!provider) return;
    try {
      localStorage.setItem(marketplace.storageKeys.selectedProvider, provider.id);
      window.location.href = 'booking.html';
    } catch {
      status.textContent = 'Unable to save this professional. Allow local storage and try again.';
    }
  });

  document.querySelector('#favorite-provider').addEventListener('click', () => {
    if (!provider) return;
    try {
      const favorites = getFavoriteIds();
      const isFavorite = favorites.includes(provider.id);
      const updatedFavorites = isFavorite ? favorites.filter((id) => id !== provider.id) : [...favorites, provider.id];
      localStorage.setItem(marketplace.storageKeys.favorites, JSON.stringify(updatedFavorites));
      updateFavoriteButton(!isFavorite);
      status.textContent = isFavorite ? 'Removed from favorites.' : 'Added to your favorites on this device.';
    } catch {
      status.textContent = 'Unable to update favorites. Allow local storage and try again.';
    }
  });

  document.querySelector('#message-provider').addEventListener('click', () => {
    if (!provider) return;
    messageContent.value = '';
    messageContent.setCustomValidity('');
    messageDialog.showModal();
    messageContent.focus();
  });

  document.querySelectorAll('#close-message, #cancel-message').forEach((button) => {
    button.addEventListener('click', () => messageDialog.close());
  });

  messageContent.addEventListener('input', () => messageContent.setCustomValidity(''));

  messageForm.addEventListener('submit', (event) => {
    event.preventDefault();
    messageContent.setCustomValidity(messageContent.value.trim() ? '' : 'Write a message before saving.');
    if (!messageForm.reportValidity() || !provider) return;

    try {
      const storedMessages = JSON.parse(localStorage.getItem(marketplace.storageKeys.messages) || '[]');
      const messages = Array.isArray(storedMessages) ? storedMessages : [];
      messages.push({
        providerId: provider.id,
        providerName: provider.name,
        content: messageContent.value.trim(),
        savedAt: new Date().toISOString()
      });
      localStorage.setItem(marketplace.storageKeys.messages, JSON.stringify(messages));
      messageDialog.close();
      status.textContent = 'Message saved on this device. It has not been sent.';
    } catch {
      status.textContent = 'Unable to save this message. Allow local storage and try again.';
    }
  });

  if (window.lucide) window.lucide.createIcons();
})();
