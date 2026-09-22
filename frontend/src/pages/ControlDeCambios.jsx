import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function ControlDeCambios() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const cargarEventos = async () => {
    setLoading(true);
    try {
      const data = await api.getEventos({
        tipo_evento: filtroTipo,
        busqueda: busqueda,
        limit: 100,
      });
      setEventos(data.eventos || []);
    } catch (err) {
      console.error('Error al cargar control de cambios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEventos();
  }, [filtroTipo]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    cargarEventos();
  };

  const getTipoEventoBadge = (tipo) => {
    switch (tipo) {
      case 'CREACION':
        return <span className="badge badge-funcional">🌱 CREACIÓN</span>;
      case 'ASIGNACION':
        return <span className="badge badge-funcional">👤 ASIGNACIÓN</span>;
      case 'PRESTAMO':
        return <span className="badge badge-revisar">⇄ PRÉSTAMO</span>;
      case 'DEVOLUCION':
        return <span className="badge badge-funcional">↩ DEVOLUCIÓN</span>;
      case 'REPORTE_FALLO':
        return <span className="badge badge-danado">⚠️ REPORTE FALLO</span>;
      case 'BAJA':
        return <span className="badge badge-baja">⊘ DADO DE BAJA</span>;
      case 'MODIFICACION':
        return <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>✏️ MODIFICACIÓN</span>;
      default:
        return <span className="badge">{tipo}</span>;
    }
  };

  const formatDetalles = (detalles) => {
    if (!detalles) return 'Sin detalles adicionales';
    if (typeof detalles === 'string') return detalles;
    if (detalles.motivo) return `Motivo: ${detalles.motivo}`;
    if (detalles.observaciones) return `Observaciones: ${detalles.observaciones}`;
    if (detalles.responsable) return `Asignado a: ${detalles.responsable}`;
    if (detalles.origen) return `Origen: ${detalles.origen}`;
    return JSON.stringify(detalles);
  };

  return (
    <div>
      {/* Header */}
      <div className="card-header" style={{ marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Control de Cambios & Auditoría Inmutable</h2>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Registro cronológico inmodificable de cada transacción sobre los activos tecnológicos
          </p>
        </div>

        <button className="btn btn-secondary" onClick={cargarEventos}>
          🔄 Actualizar Auditoría
        </button>
      </div>

      {/* Filtros de Auditoría */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '16px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por placa, modelo o responsable..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div style={{ minWidth: '200px' }}>
            <select
              className="form-control"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              <option value="">Todos los tipos de evento</option>
              <option value="CREACION">🌱 Creación de Activo</option>
              <option value="ASIGNACION">👤 Asignación</option>
              <option value="PRESTAMO">⇄ Préstamo Temporal</option>
              <option value="DEVOLUCION">↩ Devolución</option>
              <option value="REPORTE_FALLO">⚠️ Reporte de Fallo</option>
              <option value="BAJA">⊘ Desincorporación / Baja</option>
              <option value="MODIFICACION">✏️ Modificación Técnica</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary">
            🔍 Filtrar
          </button>
        </form>
      </div>

      {/* Tabla de Eventos */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Tipo de Evento</th>
              <th>Activo / Placa</th>
              <th>Hardware</th>
              <th>Operador / Usuario</th>
              <th>Detalles de la Acción</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>
                  Cargando pistas de auditoría...
                </td>
              </tr>
            ) : eventos.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No se encontraron eventos con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              eventos.map((ev) => (
                <tr key={ev.id}>
                  <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {new Date(ev.fecha_evento).toLocaleString('es-CO')}
                  </td>
                  <td>{getTipoEventoBadge(ev.tipo_evento)}</td>
                  <td>
                    <span className="placa-tag">{ev.equipo_placa || 'N/A'}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>
                      {ev.equipo_marca} {ev.equipo_modelo}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{ev.equipo_tipo}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12.5px', fontWeight: 600 }}>
                      {ev.usuario_nombre || 'Sistema Automatizado'}
                    </div>
                    {ev.usuario_email && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{ev.usuario_email}</div>
                    )}
                  </td>
                  <td style={{ fontSize: '12.5px' }}>
                    {formatDetalles(ev.detalles)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
