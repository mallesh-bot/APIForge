import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await api.get('/auth/me');
        if (res.data?.success) {
          setUser(res.data.user);
        }
      } catch {
        try {
          localStorage.removeItem('apiforge_token');
        } catch {
          // ignore storage error
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.success) {
      if (res.data.token) {
        try {
          localStorage.setItem('apiforge_token', res.data.token);
        } catch {
          // ignore storage error
        }
      }
      setUser(res.data.user);
    }
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    if (res.data?.success) {
      if (res.data.token) {
        try {
          localStorage.setItem('apiforge_token', res.data.token);
        } catch {
          // ignore storage error
        }
      }
      setUser(res.data.user);
    }
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      try {
        localStorage.removeItem('apiforge_token');
      } catch {
        // ignore storage error
      }
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
