import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import {
  Settings,
  Moon,
  Sun,
  Monitor,
  Bell,
  Shield,
  UserCheck,
  Sliders,
  CheckCircle2,
  Trash2,
  FileText,
  Lock,
  RefreshCw,
  KeyRound,
  Copy,
  QrCode,
} from 'lucide-react';

export default function Configuracion({ onOpenPrivacy }) {
  const { user, canManageInventory, canManageUsers, refreshProfile } = useAuth();
  const { themeMode, setTheme, isDark } = useTheme();

  // Estados de Autenticación Multifactor (MFA - TOTP)
  const [mfaSetupData, setMfaSetupData] = useState(null);
  const [mfaVerifyCode, setMfaVerifyCode] = useState('');
  const [mfaBackupCodes, setMfaBackupCodes] = useState([]);
  const [mfaDisablePassword, setMfaDisablePassword] = useState('');
  const [showDisableMfaForm, setShowDisableMfaForm] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState('');

  const [tableDensity, setTableDensity] = useState(() => {
    return localStorage.getItem('vaultti_table_density') || 'standard';
  });
  const [defaultPageSize, setDefaultPageSize] = useState(() => {
    return localStorage.getItem('vaultti_default_page_size') || '15';
  });
  const [notifEnabled, setNotifEnabled] = useState(() => {
    return localStorage.getItem('vaultti_notif_enabled') !== 'false';
  });
  const [notificationsRead, setNotificationsRead] = useState(() => {
    return localStorage.getItem('vaultti_notifications_read') === 'true';
  });
  const [hasSavedSignature, setHasSavedSignature] = useState(false);
  const [savedToast, setSavedToast] = useState('');

  useEffect(() => {
    const sig =
      localStorage.getItem('vaultti_saved_signature_entrega') ||
      localStorage.getItem('firma_entrega_guardada');
    setHasSavedSignature(Boolean(sig));

    const handleSyncNotif = () => {
      setNotificationsRead(localStorage.getItem('vaultti_notifications_read') === 'true');
    };
    window.addEventListener('vaultti-notifications-updated', handleSyncNotif);
    return () => window.removeEventListener('vaultti-notifications-updated', handleSyncNotif);
  }, []);

  const showFeedback = (msg) => {
    setSavedToast(msg);
    setTimeout(() => setSavedToast(''), 3000);
  };

  const handleDensityChange = (density) => {
    setTableDensity(density);
    localStorage.setItem('vaultti_table_density', density);
    document.documentElement.setAttribute('data-density', density);
    showFeedback('Densidad de visualización actualizada');
  };

  const handlePageSizeChange = (e) => {
    const val = e.target.value;
    setDefaultPageSize(val);
    localStorage.setItem('vaultti_default_page_size', val);
    showFeedback(`Tamaño de página predeterminado fijado en ${val} filas`);
  };

  const handleToggleNotif = () => {
    const next = !notifEnabled;
    setNotifEnabled(next);
    localStorage.setItem('vaultti_notif_enabled', String(next));
    window.dispatchEvent(new Event('vaultti-notifications-updated'));
    showFeedback(next ? 'Alertas operativas activadas' : 'Alertas operativas silenciadas');
  };

  const handleMarkNotificationsRead = () => {
    localStorage.setItem('vaultti_notifications_read', 'true');
    setNotificationsRead(true);
    window.dispatchEvent(new Event('vaultti-notifications-updated'));
    showFeedback('Todas las notificaciones fueron marcadas como leídas');
  };

  const handleResetNotifications = () => {
    localStorage.removeItem('vaultti_notifications_read');
    setNotificationsRead(false);
    window.dispatchEvent(new Event('vaultti-notifications-updated'));
    showFeedback('Indicadores de notificaciones restablecidos');
  };

  const handleClearSavedSignature = () => {
    localStorage.removeItem('vaultti_saved_signature_entrega');
    localStorage.removeItem('firma_entrega_guardada');
    setHasSavedSignature(false);
    showFeedback('Firma digital local eliminada del navegador');
  };

  const handleStartMfaSetup = async () => {
    setMfaError('');
    setMfaBackupCodes([]);
    setMfaLoading(true);
    try {
      const data = await api.setupMfa();
      setMfaSetupData(data);
      setMfaVerifyCode('');
    } catch (err) {
      setMfaError(err.message || 'No se pudo iniciar la configuración de MFA');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleConfirmEnableMfa = async (e) => {
    e.preventDefault();
    setMfaError('');
    setMfaLoading(true);
    try {
      const res = await api.enableMfa(mfaVerifyCode);
      setMfaSetupData(null);
      setMfaVerifyCode('');
      setMfaBackupCodes(res.backupCodes || []);
      await refreshProfile();
      showFeedback('Autenticación Multifactor (MFA) activada correctamente');
    } catch (err) {
      setMfaError(err.message || 'Código MFA inválido');
    } finally {
      setMfaLoading(false);
    }
  };

  const handleConfirmDisableMfa = async (e) => {
    e.preventDefault();
    setMfaError('');
    setMfaLoading(true);
    try {
      await api.disableMfa({ password: mfaDisablePassword });
      setShowDisableMfaForm(false);
      setMfaDisablePassword('');
      setMfaBackupCodes([]);
      await refreshProfile();
      showFeedback('Autenticación Multifactor (MFA) desactivada');
    } catch (err) {
      setMfaError(err.message || 'No se pudo desactivar MFA');
    } finally {
      setMfaLoading(false);
    }
  };

  const formatSecretBlocks = (secret = '') => {
    return String(secret).replace(/(.{4})/g, '$1 ').trim();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Encabezado del Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight flex items-center gap-2.5"
            style={{ color: 'var(--text-main)' }}
          >
            <Settings size={24} className="text-blue-500" />
            <span>Configuración del Sistema</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Personaliza la apariencia, preferencias operativas, notificaciones y privacidad de tu sesión.
          </p>
        </div>

        {savedToast && (
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={15} />
            <span>{savedToast}</span>
          </div>
        )}
      </div>

      {/* Grid Principal de Configuración */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Apariencia y Tema */}
        <div className="dash-card p-5 space-y-4">
          <div
            className="flex items-center gap-2.5 pb-3"
            style={{ borderBottom: '1px solid var(--border-color)' }}
          >
            <Sun size={18} className="text-blue-500" />
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-main)' }}>
                Apariencia y Tema Visual
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Selecciona el esquema de color para la interfaz administrativa
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setTheme('dark');
                showFeedback('Tema Oscuro activado');
              }}
              className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
                themeMode === 'dark'
                  ? 'border-blue-500 bg-blue-600/15'
                  : 'border-slate-700/60 hover:border-slate-500'
              }`}
              style={{
                backgroundColor: themeMode === 'dark' ? undefined : 'var(--bg-secondary)',
              }}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <Moon size={18} className="text-blue-400" />
                {themeMode === 'dark' && (
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                )}
              </div>
              <div className="text-xs font-semibold" style={{ color: 'var(--text-main)' }}>
                Modo Oscuro
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Predeterminado SaaS
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setTheme('light');
                showFeedback('Tema Claro activado');
              }}
              className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
                themeMode === 'light'
                  ? 'border-blue-500 bg-blue-600/15'
                  : 'border-slate-700/60 hover:border-slate-500'
              }`}
              style={{
                backgroundColor: themeMode === 'light' ? undefined : 'var(--bg-secondary)',
              }}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <Sun size={18} className="text-amber-400" />
                {themeMode === 'light' && (
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                )}
              </div>
              <div className="text-xs font-semibold" style={{ color: 'var(--text-main)' }}>
                Modo Claro
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Alta luminosidad
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setTheme('system');
                showFeedback('Sincronizado con el tema del sistema operativo');
              }}
              className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
                themeMode === 'system'
                  ? 'border-blue-500 bg-blue-600/15'
                  : 'border-slate-700/60 hover:border-slate-500'
              }`}
              style={{
                backgroundColor: themeMode === 'system' ? undefined : 'var(--bg-secondary)',
              }}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <Monitor size={18} className="text-emerald-400" />
                {themeMode === 'system' && (
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                )}
              </div>
              <div className="text-xs font-semibold" style={{ color: 'var(--text-main)' }}>
                Sistema
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Automático ({isDark ? 'Oscuro' : 'Claro'})
              </div>
            </button>
          </div>
        </div>

        {/* 2. Preferencias de Visualización y Tablas */}
        <div className="dash-card p-5 space-y-4">
          <div
            className="flex items-center gap-2.5 pb-3"
            style={{ borderBottom: '1px solid var(--border-color)' }}
          >
            <Sliders size={18} className="text-emerald-500" />
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-main)' }}>
                Preferencias de Tablas y Listados
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Ajusta la densidad de filas y paginación del inventario
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold" style={{ color: 'var(--text-main)' }}>
                  Densidad de filas en tablas
                </div>
                <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  Define el espaciado vertical en Equipos y Auditoría
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDensityChange('standard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    tableDensity === 'standard'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-slate-700 text-slate-400'
                  }`}
                >
                  Estándar
                </button>
                <button
                  type="button"
                  onClick={() => handleDensityChange('compact')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    tableDensity === 'compact'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-slate-700 text-slate-400'
                  }`}
                >
                  Compacta
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <label
                  htmlFor="cfg-pagesize"
                  className="text-xs font-semibold block"
                  style={{ color: 'var(--text-main)' }}
                >
                  Registros por página predeterminados
                </label>
                <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  Cantidad inicial al abrir tablas de activos
                </span>
              </div>
              <select
                id="cfg-pagesize"
                value={defaultPageSize}
                onChange={handlePageSizeChange}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <option value="15">15 filas</option>
                <option value="25">25 filas</option>
                <option value="50">50 filas</option>
                <option value="100">100 filas</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Centro de Notificaciones y Alertas */}
        <div className="dash-card p-5 space-y-4">
          <div
            className="flex items-center gap-2.5 pb-3"
            style={{ borderBottom: '1px solid var(--border-color)' }}
          >
            <Bell size={18} className="text-amber-500" />
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-main)' }}>
                Notificaciones y Alertas Operativas
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Controla los avisos de préstamos pendientes, mantenimientos y actas
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold" style={{ color: 'var(--text-main)' }}>
                  Mostrar globo de alertas pendientes
                </div>
                <div className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  Resalta en la barra superior y en Inicio los pendientes de atención
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleNotif}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  notifEnabled
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-700/40 text-slate-400 border border-slate-600/30'
                }`}
              >
                {notifEnabled ? 'Activadas' : 'Silenciadas'}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Estado actual:{' '}
                <strong style={{ color: 'var(--text-main)' }}>
                  {notificationsRead ? 'Notificaciones vistas (sin contador rojo)' : 'Con avisos sin leer'}
                </strong>
              </span>

              <div className="flex items-center gap-2">
                {!notificationsRead ? (
                  <button
                    type="button"
                    onClick={handleMarkNotificationsRead}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                  >
                    Marcar como leídas
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleResetNotifications}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-main)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    <RefreshCw size={12} />
                    <span>Restablecer avisos</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Perfil de Sesión y Permisos RBAC */}
        <div className="dash-card p-5 space-y-4">
          <div
            className="flex items-center gap-2.5 pb-3"
            style={{ borderBottom: '1px solid var(--border-color)' }}
          >
            <UserCheck size={18} className="text-purple-400" />
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-main)' }}>
                Cuenta y Nivel de Acceso (RBAC)
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Información de tu credencial institucional activa
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div
              className="p-3 rounded-xl"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ color: 'var(--text-secondary)' }}>Funcionario</div>
              <div className="font-semibold mt-0.5" style={{ color: 'var(--text-main)' }}>
                {user?.nombre_completo || 'Usuario Activo'}
              </div>
            </div>

            <div
              className="p-3 rounded-xl"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ color: 'var(--text-secondary)' }}>Correo Institucional</div>
              <div className="font-semibold mt-0.5 truncate" style={{ color: 'var(--text-main)' }}>
                {user?.email || '—'}
              </div>
            </div>

            <div
              className="p-3 rounded-xl"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ color: 'var(--text-secondary)' }}>Rol de Seguridad</div>
              <div className="font-semibold mt-0.5 text-blue-400">
                {user?.rol || 'EMPLEADO'}
              </div>
            </div>

            <div
              className="p-3 rounded-xl"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ color: 'var(--text-secondary)' }}>Alcance de Permisos</div>
              <div className="font-semibold mt-0.5" style={{ color: 'var(--text-main)' }}>
                {canManageUsers
                  ? 'Control Total (Inventario + Usuarios)'
                  : canManageInventory
                  ? 'Gestión Operativa de Inventario'
                  : 'Consulta de Activos Asignados'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Seguridad de la Cuenta y Autenticación Multifactor (MFA - TOTP RFC 6238) */}
      <div className="dash-card p-5 space-y-4">
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center gap-2.5">
            <KeyRound size={19} className="text-blue-500" />
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-main)' }}>
                Seguridad de Acceso y Autenticación Multifactor (MFA / 2FA)
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Protege tu cuenta institucional con códigos temporales TOTP (Google Authenticator, Microsoft Authenticator o Authy)
              </p>
            </div>
          </div>

          <div>
            {user?.mfa_enabled ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 size={14} />
                <span>MFA Activo (Protegido)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Lock size={13} />
                <span>MFA No Configurado</span>
              </span>
            )}
          </div>
        </div>

        {mfaError && (
          <div
            className="p-3 rounded-xl text-xs font-medium border"
            style={{
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger-color)',
              borderColor: 'rgba(239, 68, 68, 0.35)',
            }}
          >
            {mfaError}
          </div>
        )}

        {mfaBackupCodes.length > 0 && (
          <div
            className="p-4 rounded-xl space-y-3"
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <div className="text-xs font-bold text-emerald-400">
                  Códigos de Recuperación de Un Solo Uso (Guárdalos en un lugar seguro)
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  Si pierdes acceso a tu teléfono, podrás usar cualquiera de estos códigos una única vez para iniciar sesión:
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(mfaBackupCodes.join('\n'));
                  showFeedback('Códigos de respaldo copiados al portapapeles');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
              >
                <Copy size={13} />
                <span>Copiar códigos</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {mfaBackupCodes.map((code) => (
                <div
                  key={code}
                  className="p-2 rounded-lg text-center font-mono text-xs font-bold tracking-wider"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-main)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {code}
                </div>
              ))}
            </div>
          </div>
        )}

        {!user?.mfa_enabled ? (
          !mfaSetupData ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Al activar el segundo factor de autenticación (2FA), cada inicio de sesión solicitará un código temporal de 6 dígitos además de tu contraseña.
              </div>
              <button
                type="button"
                onClick={handleStartMfaSetup}
                disabled={mfaLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm flex-shrink-0"
              >
                <Shield size={14} />
                <span>{mfaLoading ? 'Generando clave...' : 'Configurar MFA (2FA)'}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleConfirmEnableMfa} className="space-y-4 pt-1">
              <div
                className="p-4 rounded-xl space-y-4"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--text-main)' }}>
                  <QrCode size={16} className="text-blue-500" />
                  <span>
                    Paso 1: Escanea el Código QR con tu aplicación autenticadora (Google Authenticator, Microsoft Authenticator o Authy)
                  </span>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-5">
                  {mfaSetupData.qrCodeDataUrl && (
                    <div className="flex flex-col items-center p-3 rounded-xl bg-white border border-slate-200 shadow-sm flex-shrink-0">
                      <img
                        src={mfaSetupData.qrCodeDataUrl}
                        alt="Código QR para configurar MFA"
                        className="w-44 h-44 object-contain"
                      />
                      <span className="text-[10px] font-semibold text-slate-600 mt-1.5">
                        Escanear con cámara / App 2FA
                      </span>
                    </div>
                  )}

                  <div className="flex-1 w-full space-y-3 text-xs">
                    <div className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      Abre tu aplicación autenticadora en el teléfono → selecciona <strong>Agregar cuenta (+)</strong> → <strong>Escanear un código QR</strong>. Si no puedes usar la cámara, también puedes ingresar la clave secreta manualmente:
                    </div>

                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-color)' }}>
                      <div style={{ color: 'var(--text-secondary)' }}>Cuenta / Emisor</div>
                      <div className="font-semibold mt-0.5" style={{ color: 'var(--text-main)' }}>
                        {mfaSetupData.issuer} ({mfaSetupData.account})
                      </div>
                    </div>

                    <div className="p-3 rounded-lg flex items-center justify-between gap-2" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-color)' }}>
                      <div>
                        <div style={{ color: 'var(--text-secondary)' }}>Clave Secreta Manual Base32 (TOTP)</div>
                        <div className="font-mono font-bold text-blue-400 mt-0.5 tracking-wider break-all">
                          {formatSecretBlocks(mfaSetupData.secret)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(mfaSetupData.secret);
                          showFeedback('Clave secreta copiada al portapapeles');
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/15 text-blue-400 border border-blue-500/30 hover:bg-blue-600/25 flex-shrink-0"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div className="flex-1">
                  <label
                    htmlFor="cfg-mfa-code"
                    className="text-xs font-semibold block mb-1.5"
                    style={{ color: 'var(--text-main)' }}
                  >
                    Paso 2: Ingresa el código de 6 dígitos generado por tu aplicación para confirmar
                  </label>
                  <input
                    id="cfg-mfa-code"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Ej. 123456"
                    value={mfaVerifyCode}
                    onChange={(e) => setMfaVerifyCode(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                    className="px-3.5 py-2 rounded-xl text-sm font-mono font-bold tracking-widest w-full sm:w-64"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-color)',
                    }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMfaSetupData(null);
                      setMfaError('');
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-medium border"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={mfaLoading || mfaVerifyCode.length !== 6}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                  >
                    {mfaLoading ? 'Verificando...' : 'Verificar y Activar MFA'}
                  </button>
                </div>
              </div>
            </form>
          )
        ) : (
          <div className="space-y-3 pt-1">
            {!showDisableMfaForm ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Tu cuenta está protegida con verificación en dos pasos (TOTP RFC 6238). Si cambias de dispositivo móvil, puedes desactivar y volver a vincular MFA.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowDisableMfaForm(true);
                    setMfaError('');
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 transition-colors flex-shrink-0"
                >
                  Desactivar MFA
                </button>
              </div>
            ) : (
              <form onSubmit={handleConfirmDisableMfa} className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-1">
                  <label
                    htmlFor="cfg-mfa-disable-pw"
                    className="text-xs font-semibold block mb-1.5"
                    style={{ color: 'var(--text-main)' }}
                  >
                    Confirma tu contraseña actual para desactivar MFA
                  </label>
                  <input
                    id="cfg-mfa-disable-pw"
                    type="password"
                    placeholder="Contraseña actual"
                    value={mfaDisablePassword}
                    onChange={(e) => setMfaDisablePassword(e.target.value)}
                    required
                    className="px-3.5 py-2 rounded-xl text-xs w-full sm:w-72"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-main)',
                      border: '1px solid var(--border-color)',
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDisableMfaForm(false);
                      setMfaDisablePassword('');
                      setMfaError('');
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-medium border"
                    style={{
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={mfaLoading || !mfaDisablePassword}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                  >
                    {mfaLoading ? 'Desactivando...' : 'Confirmar Desactivación'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* 6. Privacidad, Almacenamiento Local y Cumplimiento Normativo */}
      <div className="dash-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-main)' }}>
                Privacidad, Habeas Data (Ley 1581) y Términos de Uso
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Consulta las políticas institucionales de tratamiento de datos personales, firmas digitales y almacenamiento local seguro.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {hasSavedSignature && (
              <button
                type="button"
                onClick={handleClearSavedSignature}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 transition-colors"
              >
                <Trash2 size={14} />
                <span>Borrar firma guardada</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenPrivacy && onOpenPrivacy()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm"
            >
              <FileText size={14} />
              <span>Ver Políticas y Términos Legales</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
