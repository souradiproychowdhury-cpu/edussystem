import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: { name: string; email: string; password: string; role: string }) => Promise<User>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('sms_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('sms_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/profile');
        setUser(res.data);
        localStorage.setItem('sms_user', JSON.stringify(res.data));
      } catch {
        localStorage.removeItem('sms_token');
        localStorage.removeItem('sms_user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: t, user: u } = res.data;
    setToken(t);
    setUser(u);
    localStorage.setItem('sms_token', t);
    localStorage.setItem('sms_user', JSON.stringify(u));
    // fetch full profile (with populated refs) when possible
    try {
      const prof = await api.get('/auth/profile');
      setUser(prof.data);
      localStorage.setItem('sms_user', JSON.stringify(prof.data));
      return prof.data;
    } catch {
      return u;
    }
  };

  const register = async (payload: { name: string; email: string; password: string; role: string }) => {
    const res = await api.post('/auth/register', payload);
    const { token: t, user: u } = res.data;
    setToken(t);
    setUser(u);
    localStorage.setItem('sms_token', t);
    localStorage.setItem('sms_user', JSON.stringify(u));
    return u;
  };

  const logout = () => {
    localStorage.removeItem('sms_token');
    localStorage.removeItem('sms_user');
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (!token) return;
    const res = await api.get('/auth/profile');
    setUser(res.data);
    localStorage.setItem('sms_user', JSON.stringify(res.data));
  };

  const value = useMemo(() => ({ user, token, loading, login, register, logout, refreshProfile }), [user, token, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
