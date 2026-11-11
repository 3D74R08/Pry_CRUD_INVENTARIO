import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { XIcon } from '../components/Icons';

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

  const renderStructuredDetalles = (detalles) => {
    if (!detalles || typeof detalles !== 'object') return null;

    const pares = [];
    const addPar = (label, val) => {
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        pares.push({ label, value: String(val) });
      }
    };

    addPar('Responsable', detalles.responsable_nombre || detalles.responsable);
    addPar('Cédula', detalles.cedula_responsable);
    addPar('Solicitante', detalles.solicitante);
    addPar('Recibido por', detalles.quien_recibe);
    addPar('Sede', detalles.sede);
    addPar('Área', detalles.area);
    addPar('Estado', detalles.estado);
    addPar('Motivo', detalles.motivo);
    addPar('Acción técnica', detalles.accion_realizada);
    addPar('Procedimiento', detalles.procedimiento_realizado);
    addPar('Realizado por', detalles.realizado_por);
    addPar('Observaciones', detalles.observaciones);
    addPar('Origen', detalles.origen);

    // Si es un objeto { anterior, nuevo } de actualización técnica, listar cambios reales
    if (detalles.anterior && detalles.nuevo && typeof detalles.nuevo === 'object') {
      const ignorar = new Set(['id', 'created_at', 'updated_at', 'creado_por']);
      Object.keys(detalles.nuevo).forEach((key) => {
        if (ignorar.has(key)) return;
        const valAnt = detalles.anterior[key] ?? '';
        const valNvo = detalles.nuevo[key] ?? '';
        if (String(valAnt) !== String(valNvo)) {
          pares.push({
            label: key.replace(/_/g, ' '),
            value: `${valAnt || '—'} → ${valNvo || '—'}`,
          });
        }
      });
    } else if (detalles.updatedFields && typeof detalles.updatedFields === 'object') {
      Object.entries(detalles.updatedFields).forEach(([k, v]) => {
        addPar(k.replace(/_/g, ' '), v);
      });
    }

    if (pares.length === 0) return null;

    return (
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '10px 12px',
          marginTop: '8px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '6px 12px',
          fontSize: '12px',
          wordBreak: 'break-word',
        }}
      >
        {pares.map((item, idx) => (
          <div key={idx} style={{ minWidth: 0 }}>
            <span
              style={{
                color: 'var(--text-muted)',
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >
              {item.label}:{' '}
            </span>
            <span style={{ color: 'var(--text-main)' }}>{item.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '94%',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          margin: '0 auto',
        }}
      >
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Trazabilidad Histórica del Activo</h3>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Placa: <b className="placa-tag">{equipo.placa}</b> · {equipo.marca} {equipo.modelo}
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Cerrar historial">
            <XIcon size={16} />
          </button>
        </div>

        <div
          className="modal-body"
          style={{ overflowY: 'auto', overflowX: 'hidden', flex: 1, padding: '20px' }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
              Cargando historial de eventos...
            </div>
          ) : eventos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
              No se registran eventos de trazabilidad para este activo.
            </div>
          ) : (
            <div className="timeline" style={{ width: '100%', minWidth: 0 }}>
              {eventos.map((ev) => (
                <div
                  className="timeline-item"
                  key={ev.id}
                  style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}
                >
                  <div className="timeline-dot" />
                  <div
                    className="timeline-header"
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span className="badge badge-funcional">{ev.tipo_evento}</span>
                    <span className="timeline-time">{formatFecha(ev.fecha_evento)}</span>
                  </div>
                  <div
                    className="timeline-desc"
                    style={{
                      fontWeight: 500,
                      color: 'var(--text-main)',
                      marginTop: '4px',
                      wordBreak: 'break-word',
                    }}
                  >
                    {ev.descripcion}
                  </div>
                  {ev.usuario_nombre && (
                    <div
                      style={{
                        fontSize: '11.5px',
                        color: 'var(--text-muted)',
                        marginTop: '3px',
                        wordBreak: 'break-word',
                      }}
                    >
                      Responsable de la acción: <b>{ev.usuario_nombre}</b>
                      {ev.usuario_email ? ` (${ev.usuario_email})` : ''}
                    </div>
                  )}
                  {renderStructuredDetalles(ev.detalles)}
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
