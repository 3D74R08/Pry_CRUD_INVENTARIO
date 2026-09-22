import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('activos_ti_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('activos_ti_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api
        .getProfile()
        .then((data) => {
          setUser(data.user);
          localStorage.setItem('activos_ti_user', JSON.stringify(data.user));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('activos_ti_token', data.token);
    localStorage.setItem('activos_ti_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('activos_ti_token');
    localStorage.removeItem('activos_ti_user');
  };

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
