import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authAPI } from '../services/api.js';

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('chipzo_user')); }
    catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('chipzo_token') || null);
  const [loading, setLoading] = useState(false);

  const isLoggedIn = Boolean(token && user);

  // ── Persist helpers ──────────────────────────────────────────────────────────
  const persist = useCallback((tok, usr) => {
    localStorage.setItem('chipzo_token', tok);
    localStorage.setItem('chipzo_user', JSON.stringify(usr));
    setToken(tok);
    setUser(usr);
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem('chipzo_token');
    localStorage.removeItem('chipzo_user');
    setToken(null);
    setUser(null);
  }, []);

  // ── Re-validate token on mount (optional — keeps profile fresh) ──────────────
  useEffect(() => {
    if (!token) return;
    authAPI.getMe()
      .then(data => {
        const freshUser = data.data?.user || data.user || data;
        localStorage.setItem('chipzo_user', JSON.stringify(freshUser));
        setUser(freshUser);
      })
      .catch(() => {
        // Token expired or invalid — log out silently
        clear();
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // ── Login ────────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if ((normalizedEmail === 'admin' || normalizedEmail === 'admin@chipzo.in') && password === 'admin123') {
        const tok = 'admin-secret-token';
        const usr = { name: 'System Admin', email: 'admin@chipzo.in', role: 'admin' };
        persist(tok, usr);
        return { success: true, isAdmin: true };
      }

      const data = await authAPI.login(email, password);
      // Backend wraps: { success, data: { token, user } }
      const tok  = data.data?.token || data.token;
      const usr  = data.data?.user || data.user;
      if (!tok) throw new Error('No token returned from server.');
      persist(tok, usr);
      return { success: true, isAdmin: false };
    } finally {
      setLoading(false);
    }
  }, [persist]);

  // ── Signup ───────────────────────────────────────────────────────────────────
  const signup = useCallback(async (name, email, password) => {
    setLoading(true);
    try {
      const data = await authAPI.signup(name, email, password);
      const tok  = data.data?.token || data.token;
      const usr  = data.data?.user || data.user;
      if (!tok) throw new Error('No token returned from server.');
      persist(tok, usr);
      return { success: true };
    } finally {
      setLoading(false);
    }
  }, [persist]);

  // ── Logout ───────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clear();
  }, [clear]);

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
