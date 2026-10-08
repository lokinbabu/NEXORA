import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);
const CACHE_KEY = 'nexora_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CACHE_KEY)) || null; // instant paint; revalidated below
    } catch {
      return null;
    }
  });
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .get('/auth/me')
      .then((d) => alive && setUser(d.user))
      .catch(() => alive && setUser(null))
      .finally(() => alive && setBooting(false));
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      booting,
      isAuthed: Boolean(user),
      isAdmin: user?.role === 'admin',
      async login(email, password) {
        const d = await api.post('/auth/login', { email, password });
        setUser(d.user);
        localStorage.setItem(CACHE_KEY, JSON.stringify(d.user));
        return d.user;
      },
      async register(name, email, password) {
        const d = await api.post('/auth/register', { name, email, password });
        setUser(d.user);
        localStorage.setItem(CACHE_KEY, JSON.stringify(d.user));
        return d.user;
      },
      async logout() {
        try {
          await api.post('/auth/logout');
        } finally {
          setUser(null);
          localStorage.removeItem(CACHE_KEY);
        }
      },
      async updateProfile(payload) {
        const d = await api.put('/auth/profile', payload);
        setUser(d.user);
        localStorage.setItem(CACHE_KEY, JSON.stringify(d.user));
        return d.user;
      },
      refreshCached: (u) => {
        setUser(u);
        localStorage.setItem(CACHE_KEY, JSON.stringify(u));
      },
    }),
    [user, booting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
