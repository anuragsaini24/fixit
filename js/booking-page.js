(() => {
  const marketplace = window.FixItMarketplace;
  const providerName = document.querySelector('#booking-provider');
  if (!marketplace || !providerName) return;

  try {
    const providerId = localStorage.getItem(marketplace.storageKeys.selectedProvider);
    const provider = marketplace.providers.find((item) => item.id === providerId);
    providerName.textContent = provider ? `Selected professional: ${provider.name}` : 'Choose a professional from the provider listing to continue.';
  } catch {
    providerName.textContent = 'Your selected professional will appear here.';
  }
})();
