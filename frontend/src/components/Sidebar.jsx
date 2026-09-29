import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import {
  LayoutDashboardIcon,
  LaptopIcon,
  MonitorIcon,
  UsersIcon,
  PackageIcon,
  ClockIcon,
  RotateCcwIcon,
  PrinterIcon,
  TabletIcon,
  HeadphonesIcon,
  ZapIcon,
  ArchiveIcon,
  HistoryIcon,
  UploadCloudIcon,
  ActivityIcon,
  FileTextIcon,
  AlertTriangleIcon,
  XIcon,
} from './Icons';

export default function Sidebar({ currentView, setView, moduloActivo, setModuloActivo, isOpen, onClose }) {
  const { user, isAdmin, isTecnico, canManageInventory, canManageUsers, logout } = useAuth();
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
      const interval = setInterval(cargarConteos, 15000);
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
      // Silencioso para no bloquear la interfaz
    }
  };

  const handleNav = (targetView) => {
    setView(targetView);
    if (onClose) onClose();
  };

  const handleSelectModulo = (modKey) => {
    setModuloActivo(modKey);
    setView('equipos');
    if (onClose) onClose();
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="sidebar-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L3 7V12C3 17.52 6.84 22.74 12 24C17.16 22.74 21 17.52 21 12V7L12 2Z" fill="rgba(255,255,255,0.18)" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8V16M8 12H16" stroke="#93c5fd" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div className="sidebar-title">VaultTI</div>
            <div className="sidebar-subtitle">
              <span className="sidebar-pulse-dot"></span>
              DevSecOps v2.0
            </div>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Cerrar Menú"
          >
            <XIcon size={18} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {/* Vista para Empleado */}
        {!canManageInventory ? (
          <>
            <div className="nav-section-title">Mi Portal</div>
            <button
              className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleNav('dashboard')}
            >
              <span className="nav-icon"><LayoutDashboardIcon size={18} /></span>
              <span>Inicio</span>
            </button>
            <button
              className={`nav-link ${currentView === 'mis-equipos' ? 'active' : ''}`}
              onClick={() => handleNav('mis-equipos')}
            >
              <span className="nav-icon"><LaptopIcon size={18} /></span>
              <span>Mis Equipos</span>
            </button>
            <button
              className={`nav-link ${currentView === 'reportar-fallo' ? 'active' : ''}`}
              onClick={() => handleNav('reportar-fallo')}
            >
              <span className="nav-icon"><AlertTriangleIcon size={18} /></span>
              <span>Reportar Fallo</span>
            </button>
          </>
        ) : (
          /* Vista para Administrador y Técnico */
          <>
            <div className="nav-section-title">Principal</div>
            <button
              className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleNav('dashboard')}
            >
              <span className="nav-icon"><LayoutDashboardIcon size={18} /></span>
              <span>Inicio</span>
            </button>

            <button
              className={`nav-link ${currentView === 'equipos' && moduloActivo === 'todos' ? 'active' : ''}`}
              onClick={() => handleSelectModulo('todos')}
            >
              <span className="nav-icon"><MonitorIcon size={18} /></span>
              <span>Inventario General</span>
              {conteos.todos > 0 && <span className="nav-badge">{conteos.todos}</span>}
            </button>

            <button
              className={`nav-link ${currentView === 'asignaciones' ? 'active' : ''}`}
              onClick={() => handleNav('asignaciones')}
            >
              <span className="nav-icon"><ZapIcon size={18} /></span>
              <span>Asignaciones</span>
            </button>

            <div className="nav-section-title">Módulos de Hardware</div>

            <button
              className={`nav-link ${currentView === 'equipos' && moduloActivo === 'equipos_prestamos' ? 'active' : ''}`}
              onClick={() => handleSelectModulo('equipos_prestamos')}
              title="Equipos entregados a empleados de la empresa de manera indefinida"
            >
              <span className="nav-icon"><UsersIcon size={18} /></span>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: '1.2' }}>
                <span>Equipos en Préstamo</span>
                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 500 }}>Dotación Indefinida</span>
              </span>
              {conteos.equipos_prestamos > 0 && <span className="nav-badge">{conteos.equipos_prestamos}</span>}
            </button>

            <button
              className={`nav-link ${currentView === 'equipos' && moduloActivo === 'alquiler' ? 'active' : ''}`}
              onClick={() => handleSelectModulo('alquiler')}
            >
              <span className="nav-icon"><PackageIcon size={18} /></span>
              <span>Alquiler</span>
              {conteos.alquiler > 0 && <span className="nav-badge">{conteos.alquiler}</span>}
            </button>

            <button
              className={`nav-link ${currentView === 'equipos' && moduloActivo === 'prestamos' ? 'active' : ''}`}
              onClick={() => handleSelectModulo('prestamos')}
              title="Equipos prestados temporalmente por unos días que tienen que devolver"
            >
              <span className="nav-icon"><ClockIcon size={18} /></span>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: '1.2' }}>
                <span>Préstamos</span>
                <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 500 }}>Temporales (Retorno)</span>
              </span>
              {conteos.prestamos > 0 && <span className="nav-badge warn">{conteos.prestamos}</span>}
            </button>

            <button
              className={`nav-link ${currentView === 'equipos' && moduloActivo === 'devoluciones' ? 'active' : ''}`}
              onClick={() => handleSelectModulo('devoluciones')}
            >
              <span className="nav-icon"><RotateCcwIcon size={18} /></span>
              <span>Devoluciones</span>
              {conteos.devoluciones > 0 && <span className="nav-badge">{conteos.devoluciones}</span>}
            </button>

            <button
              className={`nav-link ${currentView === 'equipos' && moduloActivo === 'impresoras' ? 'active' : ''}`}
              onClick={() => handleSelectModulo('impresoras')}
            >
              <span className="nav-icon"><PrinterIcon size={18} /></span>
              <span>Impresoras</span>
              {conteos.impresoras > 0 && <span className="nav-badge">{conteos.impresoras}</span>}
            </button>

            <button
              className={`nav-link ${currentView === 'equipos' && moduloActivo === 'elementos' ? 'active' : ''}`}
              onClick={() => handleSelectModulo('elementos')}
            >
              <span className="nav-icon"><TabletIcon size={18} /></span>
              <span>Elementos</span>
              {conteos.elementos > 0 && <span className="nav-badge">{conteos.elementos}</span>}
            </button>

            <button
              className={`nav-link ${currentView === 'equipos' && moduloActivo === 'perifericos' ? 'active' : ''}`}
              onClick={() => handleSelectModulo('perifericos')}
            >
              <span className="nav-icon"><HeadphonesIcon size={18} /></span>
              <span>Periféricos</span>
              {conteos.perifericos > 0 && <span className="nav-badge">{conteos.perifericos}</span>}
            </button>

            <button
              className={`nav-link ${currentView === 'equipos' && moduloActivo === 'ups' ? 'active' : ''}`}
              onClick={() => handleSelectModulo('ups')}
            >
              <span className="nav-icon"><ZapIcon size={18} /></span>
              <span>UPS</span>
              {conteos.ups > 0 && <span className="nav-badge">{conteos.ups}</span>}
            </button>

            <button
              className={`nav-link ${currentView === 'equipos' && moduloActivo === 'bajas' ? 'active' : ''}`}
              onClick={() => handleSelectModulo('bajas')}
            >
              <span className="nav-icon"><ArchiveIcon size={18} /></span>
              <span>Bajas</span>
              {conteos.bajas > 0 && <span className="nav-badge">{conteos.bajas}</span>}
            </button>

            <button
              className={`nav-link ${currentView === 'control-cambios' ? 'active' : ''}`}
              onClick={() => handleNav('control-cambios')}
            >
              <span className="nav-icon"><HistoryIcon size={18} /></span>
              <span>Control de Cambios</span>
            </button>

            <div className="nav-section-title">Gestión y Tareas</div>

            {canManageUsers && (
              <button
                className={`nav-link ${currentView === 'usuarios' ? 'active' : ''}`}
                onClick={() => handleNav('usuarios')}
              >
                <span className="nav-icon"><UsersIcon size={18} /></span>
                <span>Usuarios</span>
              </button>
            )}

            <button
              className={`nav-link ${currentView === 'carga-masiva' ? 'active' : ''}`}
              onClick={() => handleNav('carga-masiva')}
            >
              <span className="nav-icon"><UploadCloudIcon size={18} /></span>
              <span>Carga Masiva (Worker)</span>
            </button>

            <button
              className={`nav-link ${currentView === 'tareas' ? 'active' : ''}`}
              onClick={() => handleNav('tareas')}
            >
              <span className="nav-icon"><ActivityIcon size={18} /></span>
              <span>Tareas Worker</span>
            </button>

            <button
              className={`nav-link ${currentView === 'reportes' ? 'active' : ''}`}
              onClick={() => handleNav('reportes')}
            >
              <span className="nav-icon"><FileTextIcon size={18} /></span>
              <span>Reportes</span>
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-box">
          <div className="user-avatar-wrap">
            <div className="user-avatar">
              {(user?.nombre_completo || 'U').charAt(0).toUpperCase()}
            </div>
            <span className="user-online-beacon"></span>
          </div>
          <div className="user-meta">
            <div className="user-name" title={user?.nombre_completo}>
              {user?.nombre_completo || user?.email}
            </div>
            <span className={`user-role-tag ${(user?.rol || 'empleado').toLowerCase()}`}>
              {user?.rol}
            </span>
          </div>
        </div>
        <button className="btn-logout" onClick={logout} title="Cerrar sesión">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          <span>Salir</span>
        </button>
      </div>
    </aside>
  );
}
