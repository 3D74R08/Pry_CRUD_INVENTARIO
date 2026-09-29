import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function TareasWorker({ onNavigate }) {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);

  const cargarTareas = async () => {
    try {
      const data = await api.getTareas();
      setTareas(data.tareas || []);
    } catch (err) {
      console.error('Error al cargar tareas worker:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarTareas();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(cargarTareas, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Métricas de tareas
  const total = tareas.length;
  const pendientes = tareas.filter((t) => t.estado === 'PENDIENTE' || t.estado === 'EN_PROCESO').length;
  const completadas = tareas.filter((t) => t.estado === 'COMPLETADO').length;
  const fallidas = tareas.filter((t) => t.estado === 'FALLIDO').length;

  return (
    <div>
      {/* Tarjetas de Métricas de Worker */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-info">
            <div className="kpi-label">Tareas Totales</div>
            <div className="kpi-value">{total}</div>
            <div className="kpi-sub" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Histórico acumulado
            </div>
          </div>
          <div className="kpi-icon-wrap blue">📋</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <div className="kpi-label">En Proceso / Pendientes</div>
            <div className="kpi-value" style={{ color: pendientes > 0 ? '#d97706' : 'var(--text-main)' }}>
              {pendientes}
            </div>
            <div className="kpi-sub" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Worker en ejecución
            </div>
          </div>
          <div className="kpi-icon-wrap amber">⚙️</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <div className="kpi-label">Completadas con Éxito</div>
            <div className="kpi-value" style={{ color: 'var(--accent)' }}>
              {completadas}
            </div>
            <div className="kpi-sub" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Procesadas e insertadas
            </div>
          </div>
          <div className="kpi-icon-wrap green">✅</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <div className="kpi-label">Fallidas / Errores</div>
            <div className="kpi-value" style={{ color: fallidas > 0 ? 'var(--danger)' : 'var(--text-main)' }}>
              {fallidas}
            </div>
            <div className="kpi-sub" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Con excepciones
            </div>
          </div>
          <div className="kpi-icon-wrap purple">⚠️</div>
        </div>
      </div>

      {/* Barra de Control de Cola */}
      <div className="card-header" style={{ marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Monitor de Procesamiento Asíncrono</h2>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Procesos desacoplados en segundo plano mediante Database Polling
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Auto-refresco (4s)</span>
          </label>

          <button className="btn btn-secondary" onClick={cargarTareas}>
            🔄 Refrescar Ahora
          </button>

          {onNavigate && (
            <button className="btn btn-primary" onClick={() => onNavigate('carga-masiva')}>
              + Nueva Carga Masiva
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Tareas */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tipo</th>
              <th>Archivo</th>
              <th>Estado</th>
              <th>Progreso / Registros</th>
              <th>Iniciado</th>
              <th>Completado</th>
              <th>Solicitante</th>
              <th style={{ textAlign: 'right' }}>Detalles</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}>
                  Consultando cola de tareas del worker...
                </td>
              </tr>
            ) : tareas.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No hay tareas registradas en la cola.
                </td>
              </tr>
            ) : (
              tareas.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span className="placa-tag" style={{ fontSize: '11px' }}>
                      #{t.id.toString().slice(-6)}
                    </span>
                  </td>
                  <td>
                    <b>{t.tipo_tarea}</b>
                  </td>
                  <td>{t.archivo_nombre || 'N/A'}</td>
                  <td>
                    <span
                      className={`badge ${
                        t.estado === 'COMPLETADO'
                          ? 'badge-funcional'
                          : t.estado === 'FALLIDO'
                          ? 'badge-danado'
                          : 'badge-revisar'
                      }`}
                    >
                      {t.estado === 'EN_PROCESO' ? '⚙️ EN PROCESO' : t.estado}
                    </span>
                  </td>
                  <td>
                    {t.resultado ? (
                      <span style={{ fontSize: '12px' }}>
                        <b style={{ color: 'var(--accent)' }}>+{t.resultado.insertados || 0}</b> /{' '}
                        <b style={{ color: 'var(--primary)' }}>~{t.resultado.actualizados || 0}</b>
                        {t.resultado.fallidos > 0 && (
                          <b style={{ color: 'var(--danger)', marginLeft: '6px' }}>!{t.resultado.fallidos}</b>
                        )}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-light)', fontSize: '11.5px' }}>En espera</span>
                    )}
                  </td>
                  <td style={{ fontSize: '12px' }}>{new Date(t.created_at).toLocaleTimeString('es-CO')}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {t.completed_at ? new Date(t.completed_at).toLocaleTimeString('es-CO') : '—'}
                  </td>
                  <td>{t.creado_por_nombre || 'Admin'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setTareaSeleccionada(t)}
                    >
                      🔍 Ver
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalle de Tarea */}
      {tareaSeleccionada && (
        <div className="modal-backdrop" onClick={() => setTareaSeleccionada(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Detalle de Tarea Asíncrona</h3>
              <button className="btn-icon" onClick={() => setTareaSeleccionada(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>ID Completo:</span>
                <span className="placa-tag">{tareaSeleccionada.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Tipo de Tarea:</span>
                <b>{tareaSeleccionada.tipo_tarea}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Archivo Origen:</span>
                <b>{tareaSeleccionada.archivo_nombre || 'N/A'}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Estado:</span>
                <span
                  className={`badge ${
                    tareaSeleccionada.estado === 'COMPLETADO'
                      ? 'badge-funcional'
                      : tareaSeleccionada.estado === 'FALLIDO'
                      ? 'badge-danado'
                      : 'badge-revisar'
                  }`}
                >
                  {tareaSeleccionada.estado}
                </span>
              </div>

              {tareaSeleccionada.error_mensaje && (
                <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger)', padding: '10px 14px', borderRadius: '6px', color: 'var(--danger)', fontSize: '12.5px' }}>
                  <b>Error Reportado:</b> {tareaSeleccionada.error_mensaje}
                </div>
              )}

              {tareaSeleccionada.resultado && (
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>Desglose de Datos:</div>
                  <pre
                    style={{
                      background: '#0f172a',
                      color: '#38bdf8',
                      padding: '12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      overflowX: 'auto',
                    }}
                  >
                    {JSON.stringify(tareaSeleccionada.resultado, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setTareaSeleccionada(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
