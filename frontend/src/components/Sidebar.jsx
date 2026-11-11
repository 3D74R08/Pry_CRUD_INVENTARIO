import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import client from '../api/client';
import {
  LayoutDashboard,
  Monitor,
  Users,
  BarChart3,
  ShieldCheck,
  PlusCircle,
  Settings,
  Moon,
  Sun,
  X,
  LogOut,
  Laptop,
  AlertTriangle,
  FileText,
  Lock,
} from 'lucide-react';

export default function Sidebar({
  currentView,
  setView,
  moduloActivo,
  setModuloActivo,
  isOpen,
  onClose,
  onOpenPrivacy,
}) {
  const { user, canManageInventory, canManageUsers, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [conteos, setConteos] = useState({
    todos: 0,
    equipos_prestamos: 0,
    prestamos: 0,
    alquiler: 0,
    devoluciones: 0,
    impresoras: 0,
    elementos: 0,
    perifericos: 0,
    ups: 0,
    bajas: 0,
  });

  useEffect(() => {
    if (canManageInventory) {
      cargarConteos();
      const interval = setInterval(cargarConteos, 20000);
      return () => clearInterval(interval);
    }
  }, [canManageInventory]);

  const cargarConteos = async () => {
    try {
      const res = await client.get('/equipos/conteos');
      const datos = res?.conteos || res?.data?.conteos;
      if (datos) {
        setConteos(datos);
      }
    } catch (e) {
      // Silencioso
    }
  };

  const handleNav = (targetView) => {
    setView(targetView);
    if (onClose) onClose();
  };

  const handleSelectEquipos = () => {
    if (moduloActivo !== 'todos') setModuloActivo('todos');
    setView('equipos');
    if (onClose) onClose();
  };

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-40 w-64 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      style={{
        backgroundColor: '#0D1524',
        borderRight: '1px solid #1E293B',
      }}
    >
      {/* 1. Header con Logo Cubo 3D Isométrico */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          {/* Logo Cubo Isométrico 3D (Azul degradado) */}
          <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center">
            <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M20 4L34 12V28L20 36L6 28V12L20 4Z"
                fill="#0F172A"
                stroke="#38BDF8"
                strokeWidth="1.5"
              />
              <path
                d="M20 4L34 12L20 20L6 12L20 4Z"
                fill="url(#cube-top)"
              />
              <path
                d="M6 12L20 20V36L6 28V12Z"
                fill="url(#cube-left)"
              />
              <path
                d="M34 12L20 20V36L34 28V12Z"
                fill="url(#cube-right)"
              />
              <path
                d="M20 20V36M20 20L6 12M20 20L34 12"
                stroke="#60A5FA"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="cube-top" x1="6" y1="4" x2="34" y2="20" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#60A5FA" />
                  <stop offset="1" stopColor="#3B82F6" />
                </linearGradient>
                <linearGradient id="cube-left" x1="6" y1="12" x2="20" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#2563EB" />
                  <stop offset="1" stopColor="#1D4ED8" />
                </linearGradient>
                <linearGradient id="cube-right" x1="20" y1="20" x2="34" y2="36" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#1E40AF" />
                  <stop offset="1" stopColor="#172554" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="flex flex-col">
            <span className="font-semibold text-white text-base leading-tight tracking-tight">
              Inventario TI
            </span>
            <span className="text-[11px] font-medium text-slate-400 leading-tight mt-0.5">
              Pry_CRUD_INVENTARIO
            </span>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-md"
            onClick={onClose}
            aria-label="Cerrar navegación"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* 2. Lista de Navegación Principal */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {!canManageInventory ? (
          /* Rol Empleado */
          <>
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Mi Portal
            </div>
            <button
              onClick={() => handleNav('dashboard')}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <LayoutDashboard size={18} />
              <span>Inicio</span>
            </button>

            <button
              onClick={() => handleNav('mis-equipos')}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                currentView === 'mis-equipos'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Laptop size={18} />
              <span>Mis Equipos</span>
            </button>

            <button
              onClick={() => handleNav('reportar-fallo')}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                currentView === 'reportar-fallo'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <AlertTriangle size={18} />
              <span>Reportar Fallo</span>
            </button>

            <button
              onClick={() => handleNav('configuracion')}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                currentView === 'configuracion'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Settings size={18} />
              <span>Configuración</span>
            </button>
          </>
        ) : (
          /* Administrador y Técnico (Mockup Logistics) */
          <>
            <button
              onClick={() => handleNav('dashboard')}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <LayoutDashboard size={18} />
              <span>Inicio</span>
            </button>

            <button
              onClick={handleSelectEquipos}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                currentView === 'equipos'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Monitor size={18} />
                <span>Equipos</span>
              </div>
              {conteos.todos > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    currentView === 'equipos'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {conteos.todos}
                </span>
              )}
            </button>

            <button
              onClick={() => handleNav('asignaciones')}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                currentView === 'asignaciones'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Users size={18} />
              <span>Asignaciones</span>
            </button>

            {canManageUsers && (
              <button
                onClick={() => handleNav('usuarios')}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  currentView === 'usuarios'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Users size={18} />
                <span>Usuarios</span>
              </button>
            )}

            <button
              onClick={() => handleNav('reportes')}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                currentView === 'reportes'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <BarChart3 size={18} />
              <span>Reportes</span>
            </button>

            <button
              onClick={() => handleNav('control-cambios')}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                currentView === 'control-cambios'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <ShieldCheck size={18} />
              <span>Auditoría</span>
            </button>

            <button
              onClick={() => handleNav('carga-masiva')}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                currentView === 'carga-masiva'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <PlusCircle size={18} />
              <span>Carga Masiva</span>
            </button>

            <button
              onClick={() => handleNav('configuracion')}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                currentView === 'configuracion'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              <Settings size={18} />
              <span>Configuración</span>
            </button>
          </>
        )}
      </nav>

      {/* 3. Footer con Switch de Modo Oscuro y Versión */}
      <div className="px-4 py-4 border-t border-slate-800/80 space-y-3">
        {/* Toggle Modo Oscuro */}
        <div
          role="button"
          tabIndex={0}
          onClick={toggleTheme}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleTheme();
            }
          }}
          className="theme-switch-container flex items-center justify-between p-2 rounded-xl cursor-pointer hover:bg-slate-800/40 transition-colors"
          aria-label={`Cambiar modo. Modo actual: ${isDark ? 'oscuro' : 'claro'}`}
        >
          <div className="flex items-center gap-2.5 text-sm font-medium text-slate-300">
            {isDark ? (
              <Moon size={16} className="text-slate-400" />
            ) : (
              <Sun size={16} className="text-amber-400" />
            )}
            <span>Modo oscuro</span>
          </div>

          <div className={`switch-track ${isDark ? 'active' : ''}`}>
            <div className="switch-thumb" />
          </div>
        </div>

        {/* Enlace Legal y Versión */}
        <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-medium">
          <button
            type="button"
            onClick={() => {
              if (onOpenPrivacy) onOpenPrivacy();
              if (onClose) onClose();
            }}
            className="hover:text-slate-300 transition-colors flex items-center gap-1"
          >
            <Lock size={11} />
            <span>Privacidad y Términos</span>
          </button>
          <span>v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}
