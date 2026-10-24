import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const EnvironmentContext = createContext(null);

export function EnvironmentProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [environments, setEnvironments] = useState([]);
  const [activeEnvironmentId, setActiveEnvironmentId] = useState(() => {
    return localStorage.getItem('apiforge_active_env') || '';
  });
  const [loading, setLoading] = useState(false);

  const fetchEnvironments = useCallback(async () => {
    if (!isAuthenticated) {
      setEnvironments([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/environments');
      if (res.data?.success) {
        setEnvironments(res.data.environments || []);
        // If active environment no longer exists or none selected, pick first if available
        if (res.data.environments.length > 0) {
          const currentExists = res.data.environments.some((e) => e._id === activeEnvironmentId);
          if (!currentExists) {
            const firstId = res.data.environments[0]._id;
            setActiveEnvironmentId(firstId);
            localStorage.setItem('apiforge_active_env', firstId);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch environments:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, activeEnvironmentId]);

  useEffect(() => {
    fetchEnvironments();
  }, [fetchEnvironments]);

  const selectEnvironment = (envId) => {
    setActiveEnvironmentId(envId);
    if (envId) {
      localStorage.setItem('apiforge_active_env', envId);
    } else {
      localStorage.removeItem('apiforge_active_env');
    }
  };

  const activeEnvironment = environments.find((e) => e._id === activeEnvironmentId) || null;

  return (
    <EnvironmentContext.Provider
      value={{
        environments,
        activeEnvironment,
        activeEnvironmentId,
        selectEnvironment,
        refreshEnvironments: fetchEnvironments,
        loading,
      }}
    >
      {children}
    </EnvironmentContext.Provider>
  );
}

export function useEnvironment() {
  const context = useContext(EnvironmentContext);
  if (!context) throw new Error('useEnvironment must be used within an EnvironmentProvider');
  return context;
}
