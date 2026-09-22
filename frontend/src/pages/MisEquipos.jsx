import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import HistorialModal from './HistorialModal';

export default function MisEquipos() {
  const { user } = useAuth();
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historialEquipo, setHistorialEquipo] = useState(null);

  // Modal Reportar Fallo
  const [modalFalloOpen, setModalFalloOpen] = useState(false);
  const [equipoFalloSeleccionado, setEquipoFalloSeleccionado] = useState(null);
  const [descripcionFallo, setDescripcionFallo] = useState('');
  const [severidadFallo, setSeveridadFallo] = useState('REVISAR');
  const [enviandoFallo, setEnviandoFallo] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  const loadMisEquipos = async () => {
    try {
      setLoading(true);
      const data = await api.getEquipos();
      setEquipos(data.equipos || []);
    } catch (err) {
      console.error('Error al cargar mis equipos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMisEquipos();
  }, []);

  const handleOpenReportarFallo = (eq = null) => {
    setEquipoFalloSeleccionado(eq || (equipos.length > 0 ? equipos[0] : null));
    setDescripcionFallo('');
    setSeveridadFallo('REVISAR');
    setModalFalloOpen(true);
    setMensajeExito('');
  };

  const handleSubmitFallo = async (e) => {
    e.preventDefault();
    if (!equipoFalloSeleccionado) {
      alert('Por favor selecciona un equipo');
      return;
    }
    if (!descripcionFallo.trim()) {
      alert('Por favor describe la falla o síntoma del equipo');
      return;
    }

    setEnviandoFallo(true);
    try {
      await api.reportarFallo(equipoFalloSeleccionado.id, {
        observaciones: descripcionFallo,
        nuevo_estado: severidadFallo,
      });
      setModalFalloOpen(false);
      setMensajeExito(`¡Reporte de fallo registrado para la placa ${equipoFalloSeleccionado.placa}! El equipo TI ha sido notificado.`);
      loadMisEquipos();
    } catch (err) {
      alert('Error al reportar fallo: ' + err.message);
    } finally {
      setEnviandoFallo(false);
    }
  };

  const getBadgeClass = (estado) => {
    switch (estado) {
      case 'FUNCIONAL':
        return 'badge-funcional';
      case 'REVISAR':
        return 'badge-revisar';
      case 'DAÑADO':
        return 'badge-danado';
      case 'DE_BAJA':
        return 'badge-baja';
      default:
        return '';
    }
  };

  return (
    <div>
      {/* Banner RBAC */}
      <div
        style={{
          background: 'var(--primary-light)',
          border: '1px solid #bae6fd',
          borderRadius: 'var(--radius)',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '24px' }}>🛡️</span>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--primary-hover)', fontSize: '13.5px' }}>
            Portal del Empleado · Mínimos Privilegios (RBAC)
          </div>
          <div style={{ fontSize: '12px', color: '#0369a1' }}>
            Estás visualizando exclusivamente los activos vinculados formalmente a tu documento (C.C.{' '}
            {user?.cedula || 'N/A'}). Puedes reportar novedades o consultar la trazabilidad de tu equipamiento.
          </div>
        </div>
      </div>

      {mensajeExito && (
        <div
          style={{
            background: 'var(--accent-light)',
            color: '#065f46',
            padding: '12px 16px',
            borderRadius: 'var(--radius)',
            marginBottom: '16px',
            fontSize: '13px',
            border: '1px solid #a7f3d0',
            fontWeight: 500,
          }}
        >
          {mensajeExito}
        </div>
      )}

      {/* Header */}
      <div className="card-header">
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Mis Activos Asignados</h2>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Hardware corporativo actualmente bajo tu custodia
          </p>
        </div>

        {equipos.length > 0 && (
          <button className="btn btn-warning" onClick={() => handleOpenReportarFallo(null)}>
            ⚠️ Reportar Falla Técnica
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Consultando equipos asignados...</div>
      ) : equipos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>📂</div>
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>No tienes activos asignados actualmente</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Si requieres un equipo o consideras que falta vincular alguno a tu nombre, contacta al administrador de TI.
          </p>
        </div>
      ) : (
        <div className="employee-card-grid">
          {equipos.map((eq) => (
            <div className="assigned-hardware-card" key={eq.id}>
              <div className="hardware-card-head">
                <div>
                  <span className="placa-tag" style={{ fontSize: '13px' }}>
                    {eq.placa}
                  </span>
                  <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '6px' }}>
                    {eq.marca} {eq.modelo}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{eq.tipo}</div>
                </div>
                <span className={`badge ${getBadgeClass(eq.estado)}`}>{eq.estado}</span>
              </div>

              {/* Ficha técnica del equipo */}
              <div style={{ margin: '14px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div className="hardware-spec-row">
                  <span className="hardware-spec-label">Serial:</span>
                  <span className="hardware-spec-value" style={{ fontFamily: 'var(--font-mono)' }}>
                    {eq.serial || 'N/A'}
                  </span>
                </div>

                {eq.procesador && (
                  <div className="hardware-spec-row">
                    <span className="hardware-spec-label">Procesador:</span>
                    <span className="hardware-spec-value">{eq.procesador}</span>
                  </div>
                )}

                {(eq.ram || eq.almacenamiento) && (
                  <div className="hardware-spec-row">
                    <span className="hardware-spec-label">Memoria / Disco:</span>
                    <span className="hardware-spec-value">
                      {eq.ram || ''} · {eq.almacenamiento || ''}
                    </span>
                  </div>
                )}

                {eq.sistema_operativo && (
                  <div className="hardware-spec-row">
                    <span className="hardware-spec-label">Sistema Operativo:</span>
                    <span className="hardware-spec-value">{eq.sistema_operativo}</span>
                  </div>
                )}

                <div className="hardware-spec-row">
                  <span className="hardware-spec-label">Ubicación Asignada:</span>
                  <span className="hardware-spec-value">
                    {eq.sede || 'Principal'} - {eq.area || 'General'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', fontSize: '12px' }}
                  onClick={() => setHistorialEquipo(eq)}
                >
                  🕒 Historial
                </button>
                <button
                  className="btn btn-warning"
                  style={{ flex: 1, justifyContent: 'center', fontSize: '12px' }}
                  onClick={() => handleOpenReportarFallo(eq)}
                >
                  ⚠️ Reportar Falla
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Historial */}
      {historialEquipo && (
        <HistorialModal equipo={historialEquipo} onClose={() => setHistorialEquipo(null)} />
      )}

      {/* Modal Reportar Fallo (Panel 8) */}
      {modalFalloOpen && (
        <div className="modal-backdrop" onClick={() => setModalFalloOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Reportar Incidencia o Falla Técnica</h3>
              <button className="btn-icon" onClick={() => setModalFalloOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitFallo}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Equipo Afectado *</label>
                  <select
                    className="form-control"
                    value={equipoFalloSeleccionado?.id || ''}
                    onChange={(e) => {
                      const sel = equipos.find((x) => x.id === parseInt(e.target.value, 10));
                      setEquipoFalloSeleccionado(sel);
                    }}
                    required
                  >
                    {equipos.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        [{eq.placa}] {eq.marca} {eq.modelo} ({eq.tipo})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Severidad del Estado *</label>
                  <select
                    className="form-control"
                    value={severidadFallo}
                    onChange={(e) => setSeveridadFallo(e.target.value)}
                  >
                    <option value="REVISAR">A REVISAR (Falla intermitente, lentitud, software)</option>
                    <option value="DAÑADO">DAÑADO (No enciende, daño físico de pantalla o hardware)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Descripción Detallada de la Falla *</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    required
                    placeholder="Explica detalladamente qué ocurre con el equipo (ej: la pantalla parpadea, no reconoce cargador, sobrecalentamiento...)"
                    value={descripcionFallo}
                    onChange={(e) => setDescripcionFallo(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalFalloOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-warning" disabled={enviandoFallo}>
                  {enviandoFallo ? 'Enviando...' : '⚠️ Registrar Reporte a TI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
