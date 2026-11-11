import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Search, Bell, Menu, LogOut, Shield, Moon, Sun, ChevronDown } from 'lucide-react';

export default function Topbar({ onToggleSidebar, onNavigate, onOpenPrivacy }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const searchInputRef = useRef(null);

  // Escuchador global de Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Extraer iniciales
  const getInitials = (name) => {
    if (!name) return 'JD';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() && onNavigate) {
      onNavigate('equipos');
    }
  };

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 transition-colors"
      style={{
        backgroundColor: 'var(--bg-main)',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      {/* 1. Botón Móvil y Buscador Global */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Abrir navegación lateral"
        >
          <Menu size={20} />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-secondary)' }}
          />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar equipos, usuarios... (Ctrl + K)"
            className="w-full text-sm rounded-xl pl-10 pr-20 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
            }}
          />
          <kbd
            className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-semibold rounded"
            style={{
              backgroundColor: 'var(--surface)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            Ctrl + K
          </kbd>
        </form>
      </div>

      {/* 2. Notificaciones y Perfil de Usuario */}
      <div className="flex items-center gap-3">
        {/* Campana de Notificaciones con Badge */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2.5 rounded-xl transition-colors hover:opacity-90"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Notificaciones del sistema"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {/* Menú de Notificaciones */}
          {notificationsOpen && (
            <div
              className="absolute right-0 mt-2 w-80 rounded-xl shadow-2xl py-2 z-50"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
              }}
            >
              <div
                className="px-4 py-2 font-semibold text-xs uppercase tracking-wider"
                style={{
                  borderBottom: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                }}
              >
                Pendientes de Atención (3)
              </div>
              <div className="text-sm">
                <div
                  className="px-4 py-3 cursor-pointer transition-colors hover:opacity-85"
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                  onClick={() => {
                    setNotificationsOpen(false);
                    if (onNavigate) onNavigate('asignaciones');
                  }}
                >
                  <p className="font-semibold text-xs" style={{ color: 'var(--text-main)' }}>
                    2 devoluciones pendientes
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Equipos asignados sin devolver
                  </p>
                </div>
                <div
                  className="px-4 py-3 cursor-pointer transition-colors hover:opacity-85"
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                  onClick={() => {
                    setNotificationsOpen(false);
                    if (onNavigate) onNavigate('equipos');
                  }}
                >
                  <p className="font-semibold text-xs" style={{ color: 'var(--text-main)' }}>
                    1 mantenimiento vencido
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Equipo con mantenimiento atrasado
                  </p>
                </div>
                <div
                  className="px-4 py-3 cursor-pointer transition-colors hover:opacity-85"
                  onClick={() => {
                    setNotificationsOpen(false);
                    if (onNavigate) onNavigate('asignaciones');
                  }}
                >
                  <p className="font-semibold text-xs" style={{ color: 'var(--text-main)' }}>
                    1 acta por firmar
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Asignación reciente pendiente
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Pill (Mockup: Avatar JD, Juan Pérez / Administrador + Chevron) */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 p-1.5 pl-2 pr-3 rounded-full transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            {/* Avatar Circular con Iniciales */}
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center tracking-tight shadow-sm">
              {getInitials(user?.nombre_completo || user?.email)}
            </div>

            {/* Nombre y Rol */}
            <div className="text-left hidden sm:block">
              <div
                className="text-xs font-semibold leading-tight"
                style={{ color: 'var(--text-main)' }}
              >
                {user?.nombre_completo || 'Usuario'}
              </div>
              <div
                className="text-[11px] leading-tight"
                style={{ color: 'var(--text-secondary)' }}
              >
                {user?.rol === 'ADMIN'
                  ? 'Administrador'
                  : user?.rol === 'TECNICO'
                  ? 'Técnico'
                  : 'Empleado'}
              </div>
            </div>

            <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />
          </button>

          {/* Menú Desplegable de Usuario */}
          {userMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl py-1.5 z-50"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
              }}
            >
              <div
                className="px-4 py-2"
                style={{ borderBottom: '1px solid var(--border-color)' }}
              >
                <p className="text-xs font-semibold" style={{ color: 'var(--text-main)' }}>
                  {user?.nombre_completo}
                </p>
                <p
                  className="text-[11px] truncate"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {user?.email}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  if (onOpenPrivacy) onOpenPrivacy();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs transition-colors hover:opacity-80"
                style={{ color: 'var(--text-main)' }}
              >
                <Shield size={14} style={{ color: 'var(--text-secondary)' }} />
                <span>Privacidad & Términos</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  toggleTheme();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs transition-colors hover:opacity-80"
                style={{ color: 'var(--text-main)' }}
              >
                {isDark ? (
                  <Sun size={14} className="text-amber-400" />
                ) : (
                  <Moon size={14} className="text-blue-500" />
                )}
                <span>Cambiar a {isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
              </button>

              <div
                className="my-1"
                style={{ borderTop: '1px solid var(--border-color)' }}
              ></div>

              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-500 hover:bg-red-500/10 transition-colors font-medium"
              >
                <LogOut size={14} />
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
