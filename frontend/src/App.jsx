import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import EquiposList from './pages/EquiposList';
import MisEquipos from './pages/MisEquipos';
import Asignaciones from './pages/Asignaciones';
import ControlDeCambios from './pages/ControlDeCambios';
import CargaMasiva from './pages/CargaMasiva';
import TareasWorker from './pages/TareasWorker';
import Reportes from './pages/Reportes';
import UsuariosList from './pages/UsuariosList';
import PrivacyTermsModal from './components/PrivacyTermsModal';
import StorageConsentBanner from './components/StorageConsentBanner';
import { SunIcon, MoonIcon, MenuIcon } from './components/Icons';

export default function App() {
  const { user, token, canManageInventory, canManageUsers, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [moduloActivo, setModuloActivo] = useState('todos');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('vaultti_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vaultti_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: '16px', fontWeight: 500 }}>Iniciando plataforma de activos...</div>
      </div>
    );
  }

  if (!token || !user) {
    return <Login />;
  }

  const getModuloNombre = (modKey) => {
    switch (modKey) {
      case 'equipos_prestamos':
        return 'Equipos en Préstamos';
      case 'alquiler':
        return 'Equipos en Alquiler';
      case 'prestamos':
        return 'Préstamos Operativos';
      case 'devoluciones':
        return 'Devoluciones / Almacén';
      case 'impresoras':
        return 'Impresoras y Red';
      case 'elementos':
        return 'Elementos y Accesorios';
      case 'perifericos':
        return 'Periféricos';
      case 'ups':
        return 'UPS / Respaldo de Energía';
      case 'bajas':
        return 'Equipos Dados de Baja';
      default:
        return 'Inventario General';
    }
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return { title: 'Panel General', sub: 'Métricas agregadas en tiempo real y actividad reciente' };
      case 'equipos':
        return {
          title: `Gestión: ${getModuloNombre(moduloActivo)}`,
          sub: 'Catálogo de hardware filtrado con operaciones de préstamo, devolución y bajas',
        };
      case 'asignaciones':
        return { title: 'Asignaciones de Hardware', sub: 'Fichas de empleados, activos en custodia y vinculación de equipos' };
      case 'control-cambios':
        return { title: 'Control de Cambios', sub: 'Auditoría inmutable de altas, bajas, transferencias y préstamos' };
      case 'mis-equipos':
        return { title: 'Portal Empleado: Mis Equipos', sub: 'Equipos asignados formalmente a tu nombre y reporte de novedades' };
      case 'carga-masiva':
        return { title: 'Carga Masiva Asíncrona', sub: 'Procesamiento en lote mediante Worker y Database Polling' };
      case 'tareas':
        return { title: 'Monitor de Tareas Worker', sub: 'Supervisión en tiempo real de la cola tareas_worker' };
      case 'reportes':
        return { title: 'Centro de Reportes', sub: 'Consolidado ejecutivo, distribución por sedes y exportación a CSV' };
      case 'usuarios':
        return { title: 'Usuarios del Sistema (RBAC)', sub: 'Directorio centralizado y asignación de privilegios de acceso' };
      default:
        return { title: 'Gestión de Activos TI', sub: '' };
    }
  };

  const { title, sub } = getViewTitle();

  return (
    <div className="app-layout">
      {/* Backdrop overlay para pantallas táctiles y móviles cuando el sidebar está abierto */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar
        currentView={currentView}
        setView={setCurrentView}
        moduloActivo={moduloActivo}
        setModuloActivo={setModuloActivo}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
      />

      <div className="main-wrapper">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Abrir Menú de Navegación"
            >
              <MenuIcon size={20} strokeWidth={2.2} />
            </button>
            <div style={{ minWidth: 0 }}>
              <h1 className="topbar-title">{title}</h1>
              <p className="topbar-subtitle">{sub}</p>
            </div>
          </div>
          <div className="topbar-user-info" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <button
              type="button"
              className={`topbar-theme-toggle ${theme}`}
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label="Alternar modo oscuro o claro"
            >
              <div className="theme-switch-pill">
                <div className={`theme-switch-slider ${theme}`}>
                  {theme === 'dark' ? (
                    <span className="theme-icon moon-active" key="moon">
                      <MoonIcon size={14} color="#38bdf8" />
                    </span>
                  ) : (
                    <span className="theme-icon sun-active" key="sun">
                      <SunIcon size={14} color="#f59e0b" />
                    </span>
                  )}
                </div>
              </div>
              <span className="theme-toggle-label">{theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
            </button>

            <div className="topbar-security-pill">
              <span className="topbar-security-dot"></span>
              <span>Red Segura</span>
            </div>
            <div className="topbar-user-pill">
              <div className="topbar-avatar">
                {(user.nombre_completo || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="topbar-user-name">
                {user.nombre_completo}
              </span>
              <span className={`user-role-badge ${(user.rol || 'EMPLEADO').toLowerCase()}`}>
                {user.rol}
              </span>
            </div>
          </div>
        </header>

        <main className="page-container">
          {currentView === 'dashboard' && <Dashboard onNavigate={setCurrentView} />}

          {currentView === 'equipos' &&
            (canManageInventory ? (
              <EquiposList
                moduloActivo={moduloActivo}
                onSelectModulo={setModuloActivo}
                onNavigate={setCurrentView}
              />
            ) : (
              <MisEquipos />
            ))}

          {currentView === 'asignaciones' &&
            (canManageInventory ? <Asignaciones /> : <MisEquipos />)}

          {currentView === 'control-cambios' && <ControlDeCambios />}

          {currentView === 'mis-equipos' && <MisEquipos />}

          {currentView === 'reportar-fallo' && <MisEquipos />}

          {currentView === 'carga-masiva' &&
            (canManageInventory ? <CargaMasiva onNavigate={setCurrentView} /> : <MisEquipos />)}

          {currentView === 'tareas' &&
            (canManageInventory ? <TareasWorker onNavigate={setCurrentView} /> : <MisEquipos />)}

          {currentView === 'reportes' &&
            (canManageInventory ? <Reportes /> : <MisEquipos />)}

          {currentView === 'usuarios' &&
            (canManageUsers ? <UsuariosList /> : <MisEquipos />)}
        </main>
      </div>

      {/* Banner de consentimiento y transparencia de almacenamiento local (Habeas Data) */}
      <StorageConsentBanner onOpenPrivacy={() => setIsPrivacyModalOpen(true)} />

      {/* Modal integral de Privacidad, Tratamiento de Datos (Ley 1581) y Términos */}
      <PrivacyTermsModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />
    </div>
  );
}
