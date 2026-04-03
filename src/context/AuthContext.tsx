import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type UserRole = 'Admin' | 'Dispatcher' | 'Courier' | 'Finance' | 'CS' | 'Warehouse';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  apiFetch: (url: string, options?: RequestInit) => Promise<unknown>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = 'lm-auth-token';
const USER_KEY = 'lm-user';
const DEMO_TOKEN = 'demo-token';
const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';

const withBase = (url: string) => {
  if (/^https?:\/\//.test(url)) return url;
  if (!API_BASE) return url;
  return `${API_BASE}${url}`;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(ACCESS_TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const clearAuth = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      if (token === DEMO_TOKEN) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(withBase('/api/me'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Session expired');
        const data = await res.json();
        const nextUser = (data.user || data) as User;
        localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
        setUser(nextUser);
      } catch {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, [token]);

  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const response = await fetch(withBase(url), { ...options, headers });
    const payload = await response.json().catch(() => ({}));

    if (response.status === 401) {
      clearAuth();
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      throw new Error(payload.message || payload.error || 'Request failed');
    }
    return payload;
  };

  const login = async (email: string, password: string, role: UserRole) => {
    try {
      const res = await fetch(withBase('/api/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.message || data.error || 'Login failed' };

      const nextUser = (data.user || {}) as User;
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      setToken(data.accessToken);
      setUser(nextUser);
      return { ok: true };
    } catch {
      const demoUser = { id: `DEMO-${role}`, name: email.split('@')[0] || role, email, role } as User;
      localStorage.setItem(ACCESS_TOKEN_KEY, DEMO_TOKEN);
      localStorage.setItem(USER_KEY, JSON.stringify(demoUser));
      setToken(DEMO_TOKEN);
      setUser(demoUser);
      return { ok: true };
    }
  };

  const logout = async () => {
    try {
      if (token && token !== DEMO_TOKEN) {
        await fetch(withBase('/api/logout'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch {
      // ignore logout network errors
    } finally {
      clearAuth();
    }
  };

  return <AuthContext.Provider value={{ user, token, loading, login, logout, apiFetch }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
