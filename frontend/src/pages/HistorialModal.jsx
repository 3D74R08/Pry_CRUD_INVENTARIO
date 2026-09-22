import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function HistorialModal({ equipo, onClose }) {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!equipo) return;
    api
      .getEventosByEquipo(equipo.id)
      .then((data) => setEventos(data.eventos || []))
      .catch((err) => console.error('Error al cargar historial:', err))
      .finally(() => setLoading(false));
  }, [equipo]);

  const formatFecha = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Trazabilidad Histórica del Activo</h3>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Placa: <b className="placa-tag">{equipo.placa}</b> · {equipo.marca} {equipo.modelo}
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ fontSize: '18px' }}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div>Cargando historial de eventos...</div>
          ) : eventos.length === 0 ? (
            <div style={{ color: 'var(--text-muted)' }}>
              No se registran eventos de trazabilidad para este activo.
            </div>
          ) : (
            <div className="timeline">
              {eventos.map((ev) => (
                <div className="timeline-item" key={ev.id}>
                  <div className="timeline-dot" />
                  <div className="timeline-header">
                    <span className="badge badge-funcional">{ev.tipo_evento}</span>
                    <span className="timeline-time">{formatFecha(ev.fecha_evento)}</span>
                  </div>
                  <div className="timeline-desc" style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                    {ev.descripcion}
                  </div>
                  {ev.usuario_nombre && (
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Responsable de la acción: <b>{ev.usuario_nombre}</b> ({ev.usuario_email})
                    </div>
                  )}
                  {ev.detalles && Object.keys(ev.detalles).length > 0 && (
                    <pre
                      style={{
                        background: '#f8fafc',
                        padding: '8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        marginTop: '6px',
                        overflowX: 'auto',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {JSON.stringify(ev.detalles, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
