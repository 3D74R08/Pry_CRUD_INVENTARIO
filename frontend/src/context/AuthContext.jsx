import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

// Tiempo máximo de inactividad antes de cerrar e invalidar la sesión automáticamente (30 minutos)
const SESSION_INACTIVITY_LIMIT_MS = 30 * 60 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('activos_ti_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('activos_ti_token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    const currentToken = localStorage.getItem('activos_ti_token');
    if (currentToken) {
      try {
        await api.logout();
      } catch {
        // Silencioso si el token ya había expirado
      }
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('activos_ti_token');
    localStorage.removeItem('activos_ti_user');
    localStorage.removeItem('activos_ti_last_activity');
  }, []);

  useEffect(() => {
    if (token) {
      api
        .getProfile()
        .then((data) => {
          setUser(data.user);
          localStorage.setItem('activos_ti_user', JSON.stringify(data.user));
          localStorage.setItem('activos_ti_last_activity', String(Date.now()));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token, logout]);

  // Control automático de expiración de sesión por inactividad
  useEffect(() => {
    if (!token) return;

    const updateActivity = () => {
      localStorage.setItem('activos_ti_last_activity', String(Date.now()));
    };

    const checkInactivity = () => {
      const last = Number(localStorage.getItem('activos_ti_last_activity') || Date.now());
      if (Date.now() - last > SESSION_INACTIVITY_LIMIT_MS) {
        logout();
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, updateActivity, { passive: true }));
    const interval = setInterval(checkInactivity, 30000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, updateActivity));
      clearInterval(interval);
    };
  }, [token, logout]);

  const login = async (email, password, mfaCode) => {
    const data = await api.login(email, password, mfaCode);
    if (data.mfaRequired) {
      return { mfaRequired: true, message: data.message };
    }
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('activos_ti_token', data.token);
    localStorage.setItem('activos_ti_user', JSON.stringify(data.user));
    localStorage.setItem('activos_ti_last_activity', String(Date.now()));
    return data.user;
  };

  const refreshProfile = useCallback(async () => {
    try {
      const data = await api.getProfile();
      if (data?.user) {
        setUser(data.user);
        localStorage.setItem('activos_ti_user', JSON.stringify(data.user));
      }
      return data?.user;
    } catch {
      return null;
    }
  }, []);

  const isAdmin = user?.rol === 'ADMIN';
  const isTecnico = user?.rol === 'TECNICO';
  const canManageInventory = user?.rol === 'ADMIN' || user?.rol === 'TECNICO';
  const canManageUsers = user?.rol === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        refreshProfile,
        isAdmin,
        isTecnico,
        canManageInventory,
        canManageUsers,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
