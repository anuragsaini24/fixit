import { createContext, useContext, useEffect, useState } from 'react';
import { AUTH_TOKEN_KEY, authApi } from '../services/authApi';

const AuthContext = createContext(null);

async function restoreSession(setUser, setLoading, setAuthError, isActive = () => true) {
  setLoading(true);
  setAuthError('');
  if (!authApi.getAccessToken()) {
    if (isActive()) setUser(null);
    if (isActive()) setLoading(false);
    return null;
  }

  try {
    const user = await authApi.getCurrentUser();
    if (isActive()) setUser(user);
    return user;
  } catch (error) {
    if (!isActive()) return null;
    if (error.status === 401) {
      authApi.logout();
      setUser(null);
    } else {
      setAuthError(error.message);
    }
    return null;
  } finally {
    if (isActive()) setLoading(false);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let active = true;
    const sync = (event) => {
      if (event.key === AUTH_TOKEN_KEY || event.key === null) {
        restoreSession(setUser, setLoading, setAuthError, () => active);
      }
    };
    const expire = () => { setUser(null); setAuthError(''); setLoading(false); };
    restoreSession(setUser, setLoading, setAuthError, () => active);
    window.addEventListener('storage', sync);
    window.addEventListener('fixit:auth-expired', expire);
    return () => {
      active = false;
      window.removeEventListener('storage', sync);
      window.removeEventListener('fixit:auth-expired', expire);
    };
  }, []);

  async function login(email, password) {
    setAuthError('');
    const nextUser = await authApi.login(email, password);
    setUser(nextUser);
    return nextUser;
  }

  async function register(values) {
    setAuthError('');
    const nextUser = await authApi.register(values);
    setUser(nextUser);
    return nextUser;
  }

  function logout() {
    authApi.logout();
    setUser(null);
    setAuthError('');
  }

  async function refreshUser() {
    return restoreSession(setUser, setLoading, setAuthError);
  }

  return <AuthContext.Provider value={{ user, loading, authError, login, register, logout, refreshUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
