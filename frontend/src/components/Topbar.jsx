import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import {
  Search,
  Bell,
  Menu,
  LogOut,
  Shield,
  Moon,
  Sun,
  ChevronDown,
  Settings,
  CheckCheck,
} from 'lucide-react';

export default function Topbar({ onToggleSidebar, onNavigate, onOpenPrivacy }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(() => {
    return localStorage.getItem('vaultti_notifications_read') === 'true';
  });
  const [notifEnabled, setNotifEnabled] = useState(() => {
    return localStorage.getItem('vaultti_notif_enabled') !== 'false';
  });
  const [alertas, setAlertas] = useState({
    prestamos: 0,
    mantenimiento: 0,
    tareas: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const searchInputRef = useRef(null);

  // Cargar conteos reales para las alertas de la campana
  useEffect(() => {
    let mounted = true;
    async function fetchAlertas() {
      try {
        const met = await api.getMetricasDashboard();
        if (!mounted || !met) return;
        const prestamos = Number(met?.disponibilidad?.prestamoTemporal ?? 0);
        let mantenimiento = 0;
        (met?.porEstado || []).forEach((e) => {
          const est = (e.estado || '').toUpperCase();
          if (
            est.includes('REVISION') ||
            est.includes('MANTENIMIENTO') ||
            est.includes('FALLA') ||
            est.includes('DAÑ')
          ) {
            mantenimiento += Number(e.cantidad || 0);
          }
        });
        const tareas = Number(met?.resumen?.tareasEnProceso ?? 0);
        setAlertas({ prestamos, mantenimiento, tareas });
      } catch {
        // Silencioso
      }
    }
    fetchAlertas();
  }, []);

  // Sincronizar estado de lectura de notificaciones entre Topbar, Dashboard y Configuración
  useEffect(() => {
    const syncNotifications = () => {
      setNotificationsRead(localStorage.getItem('vaultti_notifications_read') === 'true');
      setNotifEnabled(localStorage.getItem('vaultti_notif_enabled') !== 'false');
    };
    window.addEventListener('vaultti-notifications-updated', syncNotifications);
    window.addEventListener('storage', syncNotifications);
    return () => {
      window.removeEventListener('vaultti-notifications-updated', syncNotifications);
      window.removeEventListener('storage', syncNotifications);
    };
  }, []);

  const markNotificationsAsRead = () => {
    localStorage.setItem('vaultti_notifications_read', 'true');
    setNotificationsRead(true);
    window.dispatchEvent(new Event('vaultti-notifications-updated'));
  };

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
    if (!name) return 'TI';
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

  // Construir lista de notificaciones operativas reales
  const notificationItems = [
    {
      id: 'prestamos',
      title: `${alertas.prestamos} ${
        alertas.prestamos === 1 ? 'préstamo temporal activo' : 'préstamos temporales activos'
      }`,
      subtitle: 'Equipos pendientes de devolución a custodia',
      target: 'equipos',
      count: alertas.prestamos,
    },
    {
      id: 'mantenimiento',
      title: `${alertas.mantenimiento} ${
        alertas.mantenimiento === 1 ? 'equipo en revisión técnica' : 'equipos en revisión técnica'
      }`,
      subtitle: 'Activos reportados en revisión o mantenimiento',
      target: 'equipos',
      count: alertas.mantenimiento,
    },
    {
      id: 'asignaciones',
      title: 'Gestión de actas y entregas',
      subtitle: 'Consultar asignaciones y firmas digitales',
      target: 'asignaciones',
      count: 1,
    },
  ];

  const activeAlertCount =
    (alertas.prestamos > 0 ? 1 : 0) +
    (alertas.mantenimiento > 0 ? 1 : 0) +
    (alertas.tareas > 0 ? 1 : 0) || 3;

  const showRedBadge = notifEnabled && !notificationsRead && activeAlertCount > 0;

  const handleToggleNotifications = () => {
    const nextOpen = !notificationsOpen;
    setNotificationsOpen(nextOpen);
    if (nextOpen) {
      markNotificationsAsRead();
    }
  };

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 transition-colors"
      style={{
        backgroundColor: 'var(--bg-main)',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      {/* 1. Botón Móvil y Buscador Global */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg transition-colors flex-shrink-0"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Abrir navegación lateral"
        >
          <Menu size={20} />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md min-w-0">
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
            className="w-full text-sm rounded-xl pl-10 pr-4 sm:pr-20 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
            }}
          />
          <kbd
            className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-semibold rounded"
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
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2">
        {/* Campana de Notificaciones con Badge */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={handleToggleNotifications}
            className="relative p-2.5 rounded-xl transition-colors hover:opacity-90"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Notificaciones del sistema"
          >
            <Bell size={18} />
            {showRedBadge && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeAlertCount}
              </span>
            )}
          </button>

          {/* Menú de Notificaciones */}
          {notificationsOpen && (
            <div
              className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl shadow-2xl py-2 z-50"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
              }}
            >
              <div
                className="px-4 py-2 flex items-center justify-between"
                style={{
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <span
                  className="font-semibold text-xs uppercase tracking-wider"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Notificaciones Operativas
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <CheckCheck size={13} />
                  <span>Vistas</span>
                </span>
              </div>

              <div className="text-sm">
                {notificationItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="px-4 py-3 cursor-pointer transition-colors hover:opacity-85"
                    style={
                      idx < notificationItems.length - 1
                        ? { borderBottom: '1px solid var(--border-color)' }
                        : undefined
                    }
                    onClick={() => {
                      markNotificationsAsRead();
                      setNotificationsOpen(false);
                      if (onNavigate) onNavigate(item.target);
                    }}
                  >
                    <p className="font-semibold text-xs" style={{ color: 'var(--text-main)' }}>
                      {item.title}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {item.subtitle}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Pill */}
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
                  if (onNavigate) onNavigate('configuracion');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs transition-colors hover:opacity-80"
                style={{ color: 'var(--text-main)' }}
              >
                <Settings size={14} style={{ color: 'var(--text-secondary)' }} />
                <span>Configuración</span>
              </button>

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
                <span>Privacidad y Términos</span>
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
