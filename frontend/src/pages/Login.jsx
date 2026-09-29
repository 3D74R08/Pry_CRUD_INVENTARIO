import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split-page">
      {/* Columna Izquierda: Branding Hero y Arquitectura */}
      <div className="login-brand-panel">
        <div className="login-brand-content">
          {/* Badge de Seguridad con Live Pulse */}
          <div className="login-hero-tag">
            <span className="login-tag-pulse"></span>
            <span>Plataforma DevSecOps · Activos TI v2.0</span>
          </div>

          {/* Logo y Título Principal VaultTI */}
          <div className="login-brand-header">
            <div className="login-brand-logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L3 7V12C3 17.52 6.84 22.74 12 24C17.16 22.74 21 17.52 21 12V7L12 2Z" fill="rgba(255,255,255,0.18)" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8V16M8 12H16" stroke="#93c5fd" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="login-hero-title">
              VaultTI
            </h1>
          </div>

          <p className="login-hero-sub">
            Gestión integral de inventario corporativo con <strong>trazabilidad inmutable</strong>, arquitectura de <strong>microservicios</strong>, control de préstamos, devoluciones, bajas y delegación asíncrona con <strong>Worker</strong>.
          </p>

          {/* 3 Tarjetas de Características de Alta Gama */}
          <div className="login-features-list">
            {/* Card 1: RBAC */}
            <div className="login-feature-card">
              <div className="login-feature-icon-box blue">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <rect x="9" y="11" width="6" height="5" rx="1"/>
                  <path d="M10 11V9a2 2 0 0 1 4 0v2"/>
                </svg>
              </div>
              <div className="login-feature-body">
                <div className="login-feature-header">
                  <span className="login-feature-title">Control de Acceso Basado en Roles (RBAC)</span>
                  <span className="login-feature-badge blue">Seguridad L1</span>
                </div>
                <div className="login-feature-desc">
                  Mínimos privilegios: Administrador, Técnico y Empleado con firmas JWT de 256 bits.
                </div>
              </div>
            </div>

            {/* Card 2: Procesamiento Asíncrono */}
            <div className="login-feature-card">
              <div className="login-feature-icon-box purple">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <div className="login-feature-body">
                <div className="login-feature-header">
                  <span className="login-feature-title">Procesamiento Asíncrono no Bloqueante</span>
                  <span className="login-feature-badge purple">SKIP LOCKED</span>
                </div>
                <div className="login-feature-desc">
                  Worker desacoplado con Database Polling para ingesta masiva de Excel sin degradar la API.
                </div>
              </div>
            </div>

            {/* Card 3: Auditoría & Trazabilidad */}
            <div className="login-feature-card">
              <div className="login-feature-icon-box emerald">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <path d="m9 15 2 2 4-4"/>
                </svg>
              </div>
              <div className="login-feature-body">
                <div className="login-feature-header">
                  <span className="login-feature-title">Auditoría & Trazabilidad Inmutable</span>
                  <span className="login-feature-badge emerald">Inmutable</span>
                </div>
                <div className="login-feature-desc">
                  Historial blindado de préstamos, traslados, bajas y eventos de cada activo tecnológico.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer de Estado de Arquitectura */}
        <div className="login-architecture-strip">
          <div className="login-arch-chip">
            <span className="dot"></span>
            <span>Red Docker Aislada</span>
          </div>
          <div className="login-arch-chip">
            <span className="dot"></span>
            <span>Reverse Proxy Nginx</span>
          </div>
          <div className="login-arch-chip">
            <span className="dot"></span>
            <span>PostgreSQL 16</span>
          </div>
        </div>
      </div>

      {/* Columna Derecha: Tarjeta de Acceso */}
      <div className="login-form-panel">
        <div className="login-form-card">
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '15px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)' }}>
                TI
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                Iniciar Sesión
              </h2>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', margin: 0, marginTop: '4px' }}>
              Ingresa tus credenciales para acceder a la consola
            </p>
          </div>

          {error && (
            <div
              style={{
                background: 'var(--danger-light)',
                color: '#991b1b',
                padding: '11px 14px',
                borderRadius: '10px',
                marginBottom: '18px',
                fontSize: '13px',
                border: '1px solid #fecaca',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>
                Correo Institucional
              </label>
              <div className="login-input-wrapper">
                <span className="login-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </span>
                <input
                  type="email"
                  className="form-control login-input-with-icon"
                  placeholder="usuario@empresa.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '13px', margin: 0 }}>
                  Contraseña
                </label>
              </div>
              <div className="login-input-wrapper">
                <span className="login-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control login-input-with-icon"
                  style={{ paddingRight: '40px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="login-pw-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  tabIndex="-1"
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                      <line x1="2" x2="22" y1="2" y2="22"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary login-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Acceder a la Plataforma</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #f1f5f9', textAlign: 'center', fontSize: '11.5px', color: '#94a3b8' }}>
            🔒 Conexión segura con cifrado TLS/HTTPS · Red Corporativa
          </div>
        </div>
      </div>
    </div>
  );
}
