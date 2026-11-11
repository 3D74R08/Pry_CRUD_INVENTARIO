import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Opciones: 'dark' | 'light' | 'system'
  const [themePreference, setThemePreference] = useState(() => {
    return localStorage.getItem('vaultti_theme_pref') || 'dark';
  });

  const [resolvedTheme, setResolvedTheme] = useState('dark');

  // Evaluar preferencia del sistema
  const getSystemTheme = useCallback(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  }, []);

  // Sincronizar tema efectivo
  useEffect(() => {
    const updateTheme = () => {
      const active = themePreference === 'system' ? getSystemTheme() : themePreference;
      setResolvedTheme(active);

      const root = document.documentElement;
      root.setAttribute('data-theme', active);
      if (active === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }

      localStorage.setItem('vaultti_theme_pref', themePreference);
      localStorage.setItem('vaultti_theme', active);
    };

    updateTheme();

    if (themePreference === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => updateTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [themePreference, getSystemTheme]);

  const setTheme = useCallback((theme) => {
    if (['dark', 'light', 'system'].includes(theme)) {
      setThemePreference(theme);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemePreference((prev) => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'system';
      return 'dark';
    });
  }, []);

  const value = useMemo(
    () => ({
      theme: resolvedTheme,
      themePreference,
      isDark: resolvedTheme === 'dark',
      setTheme,
      toggleTheme,
    }),
    [resolvedTheme, themePreference, setTheme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider');
  }
  return context;
}
