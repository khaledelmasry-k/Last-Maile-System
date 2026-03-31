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
const REFRESH_TOKEN_KEY = 'lm-refresh-token';
const USER_KEY = 'lm-user';
const DEMO_TOKEN = 'demo-token';

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
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem(REFRESH_TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const clearAuth = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  const tryRefresh = async () => {
    if (!refreshToken) return false;
    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await res.json();
      if (!res.ok || !data.accessToken) return false;
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user || null));
      setToken(data.accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user || null));
      setUser(data.user || null);
      return true;
    } catch {
      return false;
    }
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
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Session expired');
        const data = await res.json();
        localStorage.setItem(USER_KEY, JSON.stringify(data.user || null));
        setUser(data.user || null);
      } catch {
        const refreshed = await tryRefresh();
        if (!refreshed) clearAuth();
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const apiFetch = async (url: string, options: RequestInit = {}) => {
    const call = async (access: string | null) => {
      const headers = new Headers(options.headers || {});
      if (access) headers.set('Authorization', `Bearer ${access}`);
      const response = await fetch(url, { ...options, headers });
      const payload = await response.json().catch(() => ({}));
      return { response, payload };
    };

    let { response, payload } = await call(token);
    if (response.status === 401) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        const nextToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        ({ response, payload } = await call(nextToken));
      }
    }

    if (!response.ok) {
      throw new Error(payload.error || 'Request failed');
    }
    return payload;
  };

  const login = async (email: string, password: string, role: UserRole) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error || 'Login failed' };

      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setUser(data.user);
      return { ok: true };
    } catch {
      const demoUser = { id: `DEMO-${role}`, name: email.split('@')[0] || role, email, role } as User;
      localStorage.setItem(ACCESS_TOKEN_KEY, DEMO_TOKEN);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.setItem(USER_KEY, JSON.stringify(demoUser));
      setToken(DEMO_TOKEN);
      setRefreshToken(null);
      setUser(demoUser);
      return { ok: true };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ refreshToken }),
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
