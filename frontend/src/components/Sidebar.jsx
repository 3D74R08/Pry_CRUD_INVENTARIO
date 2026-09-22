import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

export default function Sidebar({ currentView, setView, moduloActivo, setModuloActivo }) {
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

  const handleSelectModulo = (modKey) => {
    setModuloActivo(modKey);
    setView('equipos');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">TI</div>
        <div>
          <div className="sidebar-title">Activos TI</div>
          <div className="sidebar-subtitle">Control · Trazabilidad</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {/* Vista para Empleado */}
        {!canManageInventory ? (
          <>
            <div className="nav-section-title">Mi Portal</div>
            <button
              className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setView('dashboard')}
            >
              <span className="nav-icon">📊</span>
              <span>Inicio</span>
            </button>
            <button
              className={`nav-link ${currentView === 'mis-equipos' ? 'active' : ''}`}
              onClick={() => setView('mis-equipos')}
            >
              <span className="nav-icon">💻</span>
              <span>Mis Equipos</span>
            </button>
            <button
              className={`nav-link ${currentView === 'reportar-fallo' ? 'active' : ''}`}
              onClick={() => setView('reportar-fallo')}
            >
              <span className="nav-icon">⚠️</span>
              <span>Reportar Fallo</span>
            </button>
          </>
        ) : (
          /* Vista para Administrador y Técnico */
          <>
            <div className="nav-section-title">Principal</div>
            <button
              className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setView('dashboard')}
            >
              <span className="nav-icon">📊</span>
              <span>Inicio</span>
            </button>

            <button
              className={`nav-link ${currentView === 'equipos' && moduloActivo === 'todos' ? 'active' : ''}`}
              onClick={() => handleSelectModulo('todos')}
            >
              <span className="nav-icon">💻</span>
              <span>Inventario General</span>
              {conteos.todos > 0 && <span className="nav-badge">{conteos.todos}</span>}
            </button>

            <button
              className={`nav-link ${currentView === 'asignaciones' ? 'active' : ''}`}
              onClick={() => setView('asignaciones')}
            >
              <span className="nav-icon">⚡</span>
              <span>Asignaciones</span>
            </button>

            <div className="nav-section-title">Módulos de Hardware</div>

            <button
              className={`nav-link ${currentView === 'equipos' && moduloActivo === 'equipos_prestamos' ? 'active' : ''}`}
              onClick={() => handleSelectModulo('equipos_prestamos')}
              title="Equipos entregados a empleados de la empresa de manera indefinida"
            >
              <span className="nav-icon">👥</span>
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
              <span className="nav-icon">📦</span>
              <span>Alquiler</span>
              {conteos.alquiler > 0 && <span className="nav-badge">{conteos.alquiler}</span>}
            </button>

            <button
              className={`nav-link ${currentView === 'equipos' && moduloActivo === 'prestamos' ? 'active' : ''}`}
              onClick={() => handleSelectModulo('prestamos')}
              title="Equipos prestados temporalmente por unos días que tienen que devolver"
            >
              <span className="nav-icon">⏳</span>
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
              <span className="nav-icon">↩</span>
              <span>Devoluciones</span>
              {conteos.devoluciones > 0 && <span className="nav-badge">{conteos.devoluciones}</span>}
            </button>

            <button
              className={`nav-link ${currentView === 'equipos' && moduloActivo === 'impresoras' ? 'active' : ''}`}
              onClick={() => handleSelectModulo('impresoras')}
            >
              <span className="nav-icon">🖨️</span>
              <span>Impresoras</span>
              {conteos.impresoras > 0 && <span className="nav-badge">{conteos.impresoras}</span>}
            </button>

            <button
              className={`nav-link ${currentView === 'equipos' && moduloActivo === 'elementos' ? 'active' : ''}`}
              onClick={() => handleSelectModulo('elementos')}
            >
              <span className="nav-icon">▥</span>
              <span>Elementos</span>
              {conteos.elementos > 0 && <span className="nav-badge">{conteos.elementos}</span>}
            </button>

            <button
              className={`nav-link ${currentView === 'equipos' && moduloActivo === 'perifericos' ? 'active' : ''}`}
              onClick={() => handleSelectModulo('perifericos')}
            >
              <span className="nav-icon">🎧</span>
              <span>Periféricos</span>
              {conteos.perifericos > 0 && <span className="nav-badge">{conteos.perifericos}</span>}
            </button>

            <button
              className={`nav-link ${currentView === 'equipos' && moduloActivo === 'ups' ? 'active' : ''}`}
              onClick={() => handleSelectModulo('ups')}
            >
              <span className="nav-icon">⚡</span>
              <span>UPS</span>
              {conteos.ups > 0 && <span className="nav-badge">{conteos.ups}</span>}
            </button>

            <button
              className={`nav-link ${currentView === 'equipos' && moduloActivo === 'bajas' ? 'active' : ''}`}
              onClick={() => handleSelectModulo('bajas')}
            >
              <span className="nav-icon">⊘</span>
              <span>Bajas</span>
              {conteos.bajas > 0 && <span className="nav-badge">{conteos.bajas}</span>}
            </button>

            <button
              className={`nav-link ${currentView === 'control-cambios' ? 'active' : ''}`}
              onClick={() => setView('control-cambios')}
            >
              <span className="nav-icon">🕒</span>
              <span>Control de Cambios</span>
            </button>

            <div className="nav-section-title">Gestión y Tareas</div>

            {canManageUsers && (
              <button
                className={`nav-link ${currentView === 'usuarios' ? 'active' : ''}`}
                onClick={() => setView('usuarios')}
              >
                <span className="nav-icon">👥</span>
                <span>Usuarios</span>
              </button>
            )}

            <button
              className={`nav-link ${currentView === 'carga-masiva' ? 'active' : ''}`}
              onClick={() => setView('carga-masiva')}
            >
              <span className="nav-icon">📥</span>
              <span>Carga Masiva (Worker)</span>
            </button>

            <button
              className={`nav-link ${currentView === 'tareas' ? 'active' : ''}`}
              onClick={() => setView('tareas')}
            >
              <span className="nav-icon">⏱️</span>
              <span>Tareas Worker</span>
            </button>

            <button
              className={`nav-link ${currentView === 'reportes' ? 'active' : ''}`}
              onClick={() => setView('reportes')}
            >
              <span className="nav-icon">📈</span>
              <span>Reportes</span>
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-box">
          <div className="user-avatar">
            {(user?.nombre_completo || 'U').charAt(0).toUpperCase()}
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
          Salir
        </button>
      </div>
    </aside>
  );
}
