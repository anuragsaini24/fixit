(() => {
  const USER_KEY = 'fixit.currentUser';

  function getCurrentUser() {
    try {
      const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
      return user && typeof user === 'object' ? user : null;
    } catch {
      return null;
    }
  }

  function requireAccountType(accountType) {
    const user = getCurrentUser();
    if (!user || user.accountType !== accountType) {
      const redirect = accountType === 'provider'
        ? '../dashboard.html?access=provider'
        : accountType === 'admin'
          ? '../dashboard.html?access=admin'
          : '../index.html';
      window.location.replace(redirect);
      return null;
    }
    document.body.classList.remove('auth-pending');
    return user;
  }

  window.FixItAuth = Object.freeze({ getCurrentUser, requireAccountType });

  const requiredRole = document.body?.dataset.requiredRole;
  if (requiredRole) window.FixItAuth.requireAccountType(requiredRole);
})();
