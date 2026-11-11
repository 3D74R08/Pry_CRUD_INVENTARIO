import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import EquiposList from './pages/EquiposList';
import MisEquipos from './pages/MisEquipos';
import Asignaciones from './pages/Asignaciones';
import ControlDeCambios from './pages/ControlDeCambios';
import CargaMasiva from './pages/CargaMasiva';
import TareasWorker from './pages/TareasWorker';
import Reportes from './pages/Reportes';
import UsuariosList from './pages/UsuariosList';
import Configuracion from './pages/Configuracion';
import PrivacyTermsModal from './components/PrivacyTermsModal';
import StorageConsentBanner from './components/StorageConsentBanner';

export default function App() {
  const { user, token, canManageInventory, canManageUsers, loading } = useAuth();
  const { isDark } = useTheme();
  const [currentView, setCurrentView] = useState('dashboard');
  const [moduloActivo, setModuloActivo] = useState('todos');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#101827] text-slate-300">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Iniciando plataforma de activos...</span>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Login />;
  }

  return (
    <div className={`min-h-screen text-slate-100 flex overflow-x-hidden ${isDark ? 'bg-[#101827]' : 'bg-[#F8FAFC] text-slate-900'}`}>
      {/* Backdrop overlay para pantallas móviles */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Barra de Navegación Lateral */}
      <Sidebar
        currentView={currentView}
        setView={setCurrentView}
        moduloActivo={moduloActivo}
        setModuloActivo={setModuloActivo}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
      />

      {/* Contenedor Principal */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full md:pl-64 min-h-screen overflow-x-hidden">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onNavigate={setCurrentView}
          onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0 overflow-x-hidden">
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

          {currentView === 'configuracion' && (
            <Configuracion onOpenPrivacy={() => setIsPrivacyModalOpen(true)} />
          )}
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
