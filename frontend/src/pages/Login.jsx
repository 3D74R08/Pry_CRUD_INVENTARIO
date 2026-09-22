import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleFillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="login-split-page">
      {/* Columna Izquierda: Branding Hero y Arquitectura */}
      <div className="login-brand-panel">
        <div className="login-hero-tag">
          <span>🛡️</span>
          <span>Plataforma DevSecOps · Activos TI v2.0</span>
        </div>

        <h1 className="login-hero-title">
          Control Centralizado del Ciclo de Vida de Hardware
        </h1>

        <p className="login-hero-sub">
          Gestión integral de inventario con trazabilidad inmutable, arquitectura de microservicios, 
          control de préstamos, devoluciones, bajas y delegación asíncrona con Worker.
        </p>

        <div style={{ marginTop: '36px', display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '440px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: '8px' }}>
            <span style={{ fontSize: '20px' }}>🔒</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px' }}>Control de Acceso Basado en Roles (RBAC)</div>
              <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>Mínimos privilegios: Administrador, Técnico y Empleado</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: '8px' }}>
            <span style={{ fontSize: '20px' }}>⚡</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px' }}>Procesamiento Asíncrono no Bloqueante</div>
              <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>Worker desacoplado con Database Polling para cargas masivas</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: '8px' }}>
            <span style={{ fontSize: '20px' }}>🕒</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px' }}>Auditoría & Trazabilidad Inmutable</div>
              <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>Historial y control de cambios para cada activo tecnológico</div>
            </div>
          </div>
        </div>
      </div>

      {/* Columna Derecha: Tarjeta de Acceso */}
      <div className="login-form-panel">
        <div className="login-form-card">
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                TI
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>Iniciar Sesión</h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Ingresa tus credenciales para acceder a la consola
            </p>
          </div>

          {error && (
            <div
              style={{
                background: 'var(--danger-light)',
                color: '#991b1b',
                padding: '10px 14px',
                borderRadius: 'var(--radius)',
                marginBottom: '16px',
                fontSize: '13px',
                border: '1px solid #fecaca',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Correo Institucional</label>
              <input
                type="email"
                className="form-control"
                placeholder="usuario@empresa.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ justifyContent: 'center', marginTop: '6px', height: '42px', fontSize: '14px' }}
              disabled={loading}
            >
              {loading ? 'Autenticando...' : 'Acceder a la Plataforma'}
            </button>
          </form>

          {/* Acceso Rápido Demo con 1-Click */}
          <div className="demo-credentials" style={{ marginTop: '24px' }}>
            <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Acceso Rápido Demo (1-Click):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '6px 10px', justifyContent: 'space-between' }}
                onClick={() => handleFillDemo('admin@empresa.local', 'Admin123!')}
              >
                <span>👑 <b>Administrador</b> (Control Total)</span>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Cargar</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '6px 10px', justifyContent: 'space-between' }}
                onClick={() => handleFillDemo('tecnico@empresa.local', 'Tecnico123!')}
              >
                <span>🛠️ <b>Técnico</b> (Inventario sin Usuarios)</span>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Cargar</span>
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '6px 10px', justifyContent: 'space-between' }}
                onClick={() => handleFillDemo('empleado@empresa.local', 'Empleado123!')}
              >
                <span>👤 <b>Empleado</b> (Solo Activos Propios)</span>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Cargar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
