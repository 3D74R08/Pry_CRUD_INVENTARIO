import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  PlusIcon,
  TagIcon,
  ArrowLeftRightIcon,
  RotateCcwIcon,
  AlertTriangleIcon,
  ArchiveIcon,
  EditIcon,
  RefreshCwIcon,
  SearchIcon,
} from '../components/Icons';

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
        return (
          <span className="badge badge-funcional">
            <PlusIcon size={12} /> CREACIÓN
          </span>
        );
      case 'ASIGNACION':
        return (
          <span className="badge badge-funcional">
            <TagIcon size={12} /> ASIGNACIÓN
          </span>
        );
      case 'PRESTAMO':
        return (
          <span className="badge badge-revisar">
            <ArrowLeftRightIcon size={12} /> PRÉSTAMO
          </span>
        );
      case 'DEVOLUCION':
        return (
          <span className="badge badge-funcional">
            <RotateCcwIcon size={12} /> DEVOLUCIÓN
          </span>
        );
      case 'REPORTE_FALLO':
      case 'MANTENIMIENTO':
        return (
          <span className="badge badge-danado">
            <AlertTriangleIcon size={12} /> {tipo === 'MANTENIMIENTO' ? 'MANTENIMIENTO' : 'REPORTE FALLO'}
          </span>
        );
      case 'BAJA':
      case 'DE_BAJA':
        return (
          <span className="badge badge-baja">
            <ArchiveIcon size={12} /> DADO DE BAJA
          </span>
        );
      case 'ELIMINACION':
        return (
          <span className="badge badge-danado">
            <ArchiveIcon size={12} /> ELIMINADO
          </span>
        );
      case 'MODIFICACION':
      case 'CAMBIO_ESTADO':
      case 'CARGA_MASIVA':
        return (
          <span
            className="badge"
            style={{ background: 'var(--info-bg)', color: 'var(--info-color)' }}
          >
            <EditIcon size={12} /> {tipo.replace('_', ' ')}
          </span>
        );
      default:
        return <span className="badge">{tipo}</span>;
    }
  };

  const renderDetallesLegibles = (ev) => {
    const detalles = ev?.detalles;
    const descripcionBase = ev?.descripcion || '';
    const chips = [];

    if (detalles && typeof detalles === 'object') {
      if (detalles.motivo) chips.push(`Motivo: ${detalles.motivo}`);
      if (detalles.accion_realizada) chips.push(`Acción: ${detalles.accion_realizada}`);
      if (detalles.procedimiento_realizado) chips.push(`Proc.: ${detalles.procedimiento_realizado}`);
      if (detalles.responsable || detalles.responsable_nombre) {
        chips.push(`Responsable: ${detalles.responsable || detalles.responsable_nombre}`);
      }
      if (detalles.quien_recibe) chips.push(`Recibe: ${detalles.quien_recibe}`);
      if (detalles.sede) chips.push(`Sede: ${detalles.sede}`);
      if (detalles.area) chips.push(`Área: ${detalles.area}`);
      if (detalles.observaciones) chips.push(`Obs.: ${detalles.observaciones}`);
      if (detalles.origen) chips.push(`Origen: ${detalles.origen}`);

      // Si es una modificación con { anterior, nuevo }, resumir los campos que cambiaron
      if (detalles.anterior && detalles.nuevo && typeof detalles.nuevo === 'object') {
        const camposCambiados = Object.keys(detalles.nuevo).filter((k) => {
          if (['id', 'created_at', 'updated_at', 'creado_por'].includes(k)) return false;
          return String(detalles.anterior[k] ?? '') !== String(detalles.nuevo[k] ?? '');
        });
        if (camposCambiados.length > 0) {
          chips.push(
            `Campos actualizados: ${camposCambiados.slice(0, 5).join(', ')}${
              camposCambiados.length > 5 ? '...' : ''
            }`
          );
        }
      } else if (detalles.updatedFields && typeof detalles.updatedFields === 'object') {
        const keys = Object.keys(detalles.updatedFields);
        if (keys.length > 0) {
          chips.push(`Actualizado: ${keys.slice(0, 5).join(', ')}`);
        }
      }
    } else if (typeof detalles === 'string' && detalles.trim() && !detalles.trim().startsWith('{')) {
      chips.push(detalles.trim());
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', wordBreak: 'break-word', whiteSpace: 'normal' }}>
        {descripcionBase && (
          <div style={{ fontWeight: 500, color: 'var(--text-main)', lineHeight: 1.35 }}>
            {descripcionBase}
          </div>
        )}
        {chips.length > 0 ? (
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.35 }}>
            {chips.join(' · ')}
          </div>
        ) : (
          !descripcionBase && (
            <span style={{ color: 'var(--text-muted)' }}>Registro de auditoría verificado</span>
          )
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-full mx-auto min-w-0">
      {/* Header */}
      <div
        className="card-header"
        style={{
          marginBottom: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
            Control de Cambios y Auditoría Inmutable
          </h2>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Registro cronológico inmodificable de cada transacción sobre los activos tecnológicos
          </p>
        </div>

        <button className="btn btn-secondary" onClick={cargarEventos}>
          <RefreshCwIcon size={14} /> Actualizar Auditoría
        </button>
      </div>

      {/* Filtros de Auditoría */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: '16px' }}>
        <form
          onSubmit={handleSearchSubmit}
          style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}
        >
          <div style={{ flex: '1 1 220px', minWidth: 0 }}>
            <input
              type="text"
              className="form-control"
              style={{ width: '100%' }}
              placeholder="Buscar por placa, modelo o responsable..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div style={{ flex: '0 1 220px', minWidth: '180px' }}>
            <select
              className="form-control"
              style={{ width: '100%' }}
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              <option value="">Todos los tipos de evento</option>
              <option value="CREACION">Creación de Activo</option>
              <option value="ASIGNACION">Asignación</option>
              <option value="PRESTAMO">Préstamo Temporal</option>
              <option value="DEVOLUCION">Devolución</option>
              <option value="MANTENIMIENTO">Mantenimiento / Hoja de Vida</option>
              <option value="REPORTE_FALLO">Reporte de Fallo</option>
              <option value="DE_BAJA">Desincorporación / Baja</option>
              <option value="ELIMINACION">Eliminación Física</option>
              <option value="MODIFICACION">Modificación Técnica</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary">
            <SearchIcon size={14} /> Filtrar
          </button>
        </form>
      </div>

      {/* Tabla de Eventos Centrada y Responsiva */}
      <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
        <table style={{ width: '100%', tableLayout: 'auto' }}>
          <thead>
            <tr>
              <th style={{ width: '150px' }}>Fecha y Hora</th>
              <th style={{ width: '140px' }}>Tipo de Evento</th>
              <th style={{ width: '110px' }}>Activo / Placa</th>
              <th style={{ width: '180px' }}>Hardware</th>
              <th style={{ width: '180px' }}>Operador / Usuario</th>
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
                <td
                  colSpan="6"
                  style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}
                >
                  No se encontraron eventos con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              eventos.map((ev) => (
                <tr key={ev.id}>
                  <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {new Date(ev.fecha_evento).toLocaleString('es-CO')}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{getTipoEventoBadge(ev.tipo_evento)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span className="placa-tag">{ev.equipo_placa || 'N/A'}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>
                      {ev.equipo_marca} {ev.equipo_modelo}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      {ev.equipo_tipo}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12.5px', fontWeight: 600 }}>
                      {ev.usuario_nombre || 'Sistema Automatizado'}
                    </div>
                    {ev.usuario_email && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {ev.usuario_email}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: '12.5px', maxWidth: '420px', whiteSpace: 'normal' }}>
                    {renderDetallesLegibles(ev)}
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
