import React, { useState } from 'react';
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

export default function App() {
  const { user, token, canManageInventory, canManageUsers, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [moduloActivo, setModuloActivo] = useState('todos');

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
      <Sidebar
        currentView={currentView}
        setView={setCurrentView}
        moduloActivo={moduloActivo}
        setModuloActivo={setModuloActivo}
      />

      <div className="main-wrapper">
        <header className="topbar">
          <div>
            <h1 className="topbar-title">{title}</h1>
            <p className="topbar-subtitle">{sub}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Sesión: <b>{user.nombre_completo}</b>
            </span>
            <span className={`user-role-badge ${(user.rol || 'EMPLEADO').toLowerCase()}`}>
              {user.rol}
            </span>
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
    </div>
  );
}
