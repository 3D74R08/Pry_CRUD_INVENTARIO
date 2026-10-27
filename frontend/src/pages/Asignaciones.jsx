import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { UsersIcon, BuildingIcon, MapPinIcon, PlusIcon, RotateCcwIcon, XIcon, FileTextIcon } from '../components/Icons';
import ModalFirmaActa from '../components/ModalFirmaActa';

export default function Asignaciones() {
  const [modo, setModo] = useState('colaborador'); // 'colaborador' | 'area' | 'sede'
  const [usuarios, setUsuarios] = useState([]);
  const [areas, setAreas] = useState([]);
  const [sedes, setSedes] = useState([]);
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedSede, setSelectedSede] = useState(null);

  const [equiposAsignados, setEquiposAsignados] = useState([]);
  const [eventosUsuario, setEventosUsuario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  // Modal de Asignación
  const [modalAsignarOpen, setModalAsignarOpen] = useState(false);
  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [selectedEquipoId, setSelectedEquipoId] = useState('');
  const [descargandoActaId, setDescargandoActaId] = useState(null);

  // Modal de Firma y Descarga de Acta
  const [modalFirmaActaOpen, setModalFirmaActaOpen] = useState(false);
  const [equipoParaActa, setEquipoParaActa] = useState(null);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    setLoading(true);
    try {
      const [resUsers, resResumen] = await Promise.all([
        api.getUsuarios().catch(() => ({ usuarios: [] })),
        api.getResumenAsignaciones().catch(() => ({ areas: [], sedes: [] })),
      ]);

      const userList = resUsers.usuarios || [];
      setUsuarios(userList);
      setAreas(resResumen.areas || []);
      setSedes(resResumen.sedes || []);

      if (userList.length > 0) {
        seleccionarUsuario(userList[0]);
      }
    } catch (err) {
      console.error('Error al cargar datos de asignaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Selección por Colaborador
  const seleccionarUsuario = async (u) => {
    setSelectedUser(u);
    setLoading(true);
    try {
      // Buscar equipos donde el usuario es responsable por cédula, ID o nombre
      const res = await api.getEquipos({
        busqueda: u.cedula || u.nombre_completo,
      });
      // Filtrar para que pertenezca a esta persona
      const eqs = (res.equipos || []).filter(
        (eq) =>
          (u.cedula && eq.cedula_responsable === u.cedula) ||
          (u.nombre_completo && eq.responsable_nombre && eq.responsable_nombre.toLowerCase().includes(u.nombre_completo.toLowerCase())) ||
          (eq.usuario_asignado_id === u.id)
      );
      setEquiposAsignados(eqs.length > 0 ? eqs : (res.equipos || []).slice(0, 5));

      const resEventos = await api.getEventosRecientes().catch(() => ({ eventos: [] }));
      const evs = (resEventos.eventos || []).filter(
        (ev) => ev.usuario_id === u.id || (ev.descripcion && ev.descripcion.includes(u.nombre_completo))
      );
      setEventosUsuario(evs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 2. Selección por Área Operativa
  const seleccionarArea = async (item) => {
    setSelectedArea(item);
    setLoading(true);
    try {
      const res = await api.getEquipos({ area: item.area });
      setEquiposAsignados(res.equipos || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 3. Selección por Sede Física
  const seleccionarSede = async (item) => {
    setSelectedSede(item);
    setLoading(true);
    try {
      const res = await api.getEquipos({ sede: item.sede });
      setEquiposAsignados(res.equipos || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarModo = (nuevoModo) => {
    setModo(nuevoModo);
    setBusqueda('');
    if (nuevoModo === 'colaborador' && usuarios.length > 0) {
      seleccionarUsuario(selectedUser || usuarios[0]);
    } else if (nuevoModo === 'area' && areas.length > 0) {
      seleccionarArea(selectedArea || areas[0]);
    } else if (nuevoModo === 'sede' && sedes.length > 0) {
      seleccionarSede(selectedSede || sedes[0]);
    }
  };

  const handleOpenModalAsignar = async () => {
    try {
      const res = await api.getEquipos({ modulo: 'devoluciones' });
      setEquiposDisponibles(res.equipos || []);
      setModalAsignarOpen(true);
    } catch (e) {
      alert('Error al consultar equipos disponibles: ' + e.message);
    }
  };

  const handleConfirmarAsignacion = async (e) => {
    e.preventDefault();
    if (!selectedEquipoId) {
      alert('Selecciona un equipo de la lista.');
      return;
    }
    try {
      let updatePayload = {};
      if (modo === 'colaborador' && selectedUser) {
        updatePayload = {
          cedula_responsable: selectedUser.cedula,
          responsable_nombre: selectedUser.nombre_completo,
          usuario_asignado_id: selectedUser.id,
          area: selectedUser.departamento || 'Operativo',
          sede: selectedUser.cargo || 'General',
        };
      } else if (modo === 'area' && selectedArea) {
        updatePayload = {
          area: selectedArea.area,
          responsable_nombre: `ÁREA ${selectedArea.area}`,
        };
      } else if (modo === 'sede' && selectedSede) {
        updatePayload = {
          sede: selectedSede.sede,
          responsable_nombre: `SEDE ${selectedSede.sede}`,
        };
      }

      const eqAsignadoId = selectedEquipoId;
      const eqAsignadoObj = equiposDisponibles.find((x) => x.id === eqAsignadoId);
      await api.updateEquipo(eqAsignadoId, updatePayload);
      setModalAsignarOpen(false);
      
      // Refrescar vista actual
      if (modo === 'colaborador') seleccionarUsuario(selectedUser);
      else if (modo === 'area') seleccionarArea(selectedArea);
      else if (modo === 'sede') seleccionarSede(selectedSede);

      // Abrir modal de firmas para el Acta de Entrega oficial
      if (eqAsignadoObj) {
        setEquipoParaActa({
          ...eqAsignadoObj,
          ...updatePayload,
          responsable_nombre: updatePayload.responsable_nombre || selectedUser?.nombre_completo,
          cedula_responsable: updatePayload.cedula_responsable || selectedUser?.cedula,
          cargo: updatePayload.cargo || selectedUser?.cargo,
        });
        setModalFirmaActaOpen(true);
      }
    } catch (err) {
      alert('Error al asignar equipo: ' + err.message);
    }
  };

  const handleDescargarActa = (eq) => {
    setEquipoParaActa(eq);
    setModalFirmaActaOpen(true);
  };

  const handleDesasignar = async (eq) => {
    const destino = prompt(`¿Retirar asignación de [${eq.placa}]? Indique quién recibe en TI:`, 'Custodia TI');
    if (!destino) return;
    try {
      await api.registrarDevolucion(eq.id, { quien_recibe: destino });
      if (modo === 'colaborador') seleccionarUsuario(selectedUser);
      else if (modo === 'area') seleccionarArea(selectedArea);
      else if (modo === 'sede') seleccionarSede(selectedSede);
    } catch (e) {
      alert('Error al retirar equipo: ' + e.message);
    }
  };

  // Filtros de búsqueda para panel izquierdo
  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (u.cedula && u.cedula.includes(busqueda)) ||
      u.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  const areasFiltradas = areas.filter((a) =>
    a.area.toLowerCase().includes(busqueda.toLowerCase())
  );

  const sedesFiltradas = sedes.filter((s) =>
    s.sede.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div>
      {/* 1. Selector Superior de Modalidad de Asignación */}
      <div className="asignaciones-tabs">
        <button
          className={`asignaciones-tab-btn ${modo === 'colaborador' ? 'active' : ''}`}
          onClick={() => handleCambiarModo('colaborador')}
        >
          <UsersIcon size={14} /> Por Colaborador ({usuarios.length})
        </button>
        <button
          className={`asignaciones-tab-btn ${modo === 'area' ? 'active' : ''}`}
          onClick={() => handleCambiarModo('area')}
        >
          <BuildingIcon size={14} /> Por Área Operativa ({areas.length})
        </button>
        <button
          className={`asignaciones-tab-btn ${modo === 'sede' ? 'active' : ''}`}
          onClick={() => handleCambiarModo('sede')}
        >
          <MapPinIcon size={14} /> Por Sede Física ({sedes.length})
        </button>
      </div>

      <div className="asignaciones-split-grid">
        {/* Columna Izquierda: Directorio según Modo */}
        <div className="content-panel" style={{ height: 'fit-content' }}>
          <div className="panel-header">
            <h2>
              {modo === 'colaborador' && 'Directorio de Personal'}
              {modo === 'area' && 'Áreas Operativas'}
              {modo === 'sede' && 'Sedes Institucionales'}
            </h2>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {modo === 'colaborador' && `${usuariosFiltrados.length} colaboradores`}
              {modo === 'area' && `${areasFiltradas.length} áreas`}
              {modo === 'sede' && `${sedesFiltradas.length} sedes`}
            </span>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <input
              type="text"
              className="select-filter"
              style={{ width: '100%' }}
              placeholder={
                modo === 'colaborador'
                  ? 'Buscar por nombre o cédula...'
                  : modo === 'area'
                  ? 'Buscar área operativa...'
                  : 'Buscar sede física...'
              }
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '550px', overflowY: 'auto' }}>
            {/* Lista: Colaboradores */}
            {modo === 'colaborador' &&
              usuariosFiltrados.map((u) => (
                <div
                  key={u.id}
                  onClick={() => seleccionarUsuario(u)}
                  className={`assignment-item-row ${selectedUser?.id === u.id ? 'selected' : ''}`}
                >
                  <div className="user-avatar" style={{ width: '30px', height: '30px', fontSize: '11px' }}>
                    {u.nombre_completo.charAt(0)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="item-name" style={{ fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {u.nombre_completo}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      C.C. {u.cedula} · {u.cargo || u.rol}
                    </div>
                  </div>
                </div>
              ))}

            {/* Lista: Áreas */}
            {modo === 'area' &&
              areasFiltradas.map((a, idx) => (
                <div
                  key={idx}
                  onClick={() => seleccionarArea(a)}
                  className={`assignment-item-row ${selectedArea?.area === a.area ? 'selected' : ''}`}
                  style={{ justifyContent: 'space-between' }}
                >
                  <div className="item-name" style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <BuildingIcon size={14} /> {a.area}
                  </div>
                  <span className="nav-badge">
                    {a.total_equipos} eq.
                  </span>
                </div>
              ))}

            {/* Lista: Sedes */}
            {modo === 'sede' &&
              sedesFiltradas.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => seleccionarSede(s)}
                  className={`assignment-item-row ${selectedSede?.sede === s.sede ? 'selected' : ''}`}
                  style={{ justifyContent: 'space-between' }}
                >
                  <div className="item-name" style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <MapPinIcon size={14} /> {s.sede}
                  </div>
                  <span className="nav-badge">
                    {s.total_equipos} eq.
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Columna Derecha: Equipos Reales Asignados */}
        <div>
          <div className="content-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div className="user-avatar" style={{ width: '46px', height: '46px', fontSize: '20px' }}>
                  {modo === 'colaborador' ? (selectedUser ? selectedUser.nombre_completo.charAt(0) : <UsersIcon size={20} />) : modo === 'area' ? <BuildingIcon size={20} /> : <MapPinIcon size={20} />}
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
                    {modo === 'colaborador' && (selectedUser?.nombre_completo || 'Selecciona un colaborador')}
                    {modo === 'area' && (selectedArea ? `Área: ${selectedArea.area}` : 'Selecciona un área')}
                    {modo === 'sede' && (selectedSede ? `Sede: ${selectedSede.sede}` : 'Selecciona una sede')}
                  </h2>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    {modo === 'colaborador' && selectedUser && (
                      <>Cédula: <b>{selectedUser.cedula}</b> · Correo: {selectedUser.email} · Rol: <span className="user-role-tag empleado">{selectedUser.rol}</span></>
                    )}
                    {modo === 'area' && selectedArea && (
                      <>Total activos registrados en esta área operativa: <b>{selectedArea.total_equipos}</b></>
                    )}
                    {modo === 'sede' && selectedSede && (
                      <>Total activos ubicados en esta sede física: <b>{selectedSede.total_equipos}</b></>
                    )}
                  </div>
                </div>
              </div>

              <button className="btn-primary-action" onClick={handleOpenModalAsignar}>
                <PlusIcon size={14} /> Vincular / Asignar Equipo
              </button>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                  Activos Asignados ({equiposAsignados.length})
                </h3>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Consultando activos en la base de datos...
                </div>
              ) : equiposAsignados.length === 0 ? (
                <div className="assignment-empty-box">
                  No se encontraron equipos asignados en este registro.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
                  {equiposAsignados.map((eq) => (
                    <div
                      key={eq.id}
                      className="assigned-hardware-card"
                      style={{
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span className="placa-badge">{eq.placa}</span>
                          <span className={`status-pill ${eq.estado === 'FUNCIONAL' ? 'funcional' : 'revisar'}`} style={{ fontSize: '10px' }}>
                            {eq.estado}
                          </span>
                        </div>

                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
                          {eq.marca} {eq.modelo || eq.nombre_equipo || ''}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          <b>Tipo:</b> {eq.tipo || 'Equipo TI'}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-light)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                          <b>S/N:</b> {eq.serial || 'S/N'}
                        </div>

                        <div className="assignment-spec-box">
                          <div><b>Sede:</b> {eq.sede || '—'}</div>
                          <div><b>Área:</b> {eq.area || '—'}</div>
                          {eq.responsable_nombre && (
                            <div><b>Responsable:</b> {eq.responsable_nombre}</div>
                          )}
                        </div>

                        {eq.observaciones && (
                          <div className="assignment-obs-box">
                            {eq.observaciones}
                          </div>
                        )}
                      </div>

                      <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '10px', gap: '8px' }}>
                        <button
                          className="btn-icon"
                          title="Descargar Acta de Entrega oficial en formato Word (.docx)"
                          onClick={() => handleDescargarActa(eq)}
                          disabled={descargandoActaId === eq.id}
                          style={{
                            width: 'auto',
                            padding: '4px 10px',
                            fontSize: '11.5px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            color: 'var(--primary)',
                            fontWeight: 600,
                          }}
                        >
                          <FileTextIcon size={13} />
                          {descargandoActaId === eq.id ? 'Generando...' : 'Descargar Acta'}
                        </button>

                        <button
                          className="btn-icon warn"
                          title="Retirar equipo y devolver a custodia"
                          onClick={() => handleDesasignar(eq)}
                          style={{ width: 'auto', padding: '4px 10px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          <RotateCcwIcon size={13} /> Desasignar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Historial de Movimientos (Visible en modo Colaborador) */}
          {modo === 'colaborador' && selectedUser && (
            <div className="content-panel">
              <div className="panel-header">
                <h2>Historial de Movimientos de {selectedUser.nombre_completo}</h2>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Trazabilidad registrada</span>
              </div>

              <div className="custom-table-wrap">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo Evento</th>
                      <th>Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventosUsuario.length === 0 ? (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                          No hay eventos recientes registrados para este colaborador.
                        </td>
                      </tr>
                    ) : (
                      eventosUsuario.map((ev) => (
                        <tr key={ev.id}>
                          <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {new Date(ev.fecha_evento).toLocaleString('es-CO')}
                          </td>
                          <td>
                            <span className="status-pill prestado">{ev.tipo_evento}</span>
                          </td>
                          <td style={{ fontSize: '13px' }}>{ev.descripcion}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Asignar Equipo Disponible */}
      {modalAsignarOpen && (
        <div className="modal-backdrop">
          <div className="modal-window" style={{ maxWidth: '500px' }}>
            <div className="modal-title-bar">
              <h3>
                Vincular Equipo a{' '}
                {modo === 'colaborador' ? selectedUser?.nombre_completo : modo === 'area' ? `Área ${selectedArea?.area}` : `Sede ${selectedSede?.sede}`}
              </h3>
              <button className="btn-close-modal" onClick={() => setModalAsignarOpen(false)}>
                <XIcon size={16} />
              </button>
            </div>
            <form onSubmit={handleConfirmarAsignacion} className="modal-body-content">
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Selecciona uno de los activos actualmente en <b>Custodia / Devolución</b> en el almacén de TI:
              </p>

              <div className="form-field-group">
                <label>Equipo Disponible *</label>
                <select
                  required
                  value={selectedEquipoId}
                  onChange={(e) => setSelectedEquipoId(e.target.value)}
                >
                  <option value="">-- Selecciona un equipo --</option>
                  {equiposDisponibles.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      [{eq.placa}] {eq.tipo} - {eq.marca} {eq.modelo} (S/N: {eq.serial || 'S/N'})
                    </option>
                  ))}
                </select>
              </div>

              {equiposDisponibles.length === 0 && (
                <div style={{ color: 'var(--danger)', fontSize: '12.5px', marginTop: '10px' }}>
                  No hay equipos disponibles en custodia en este momento.
                </div>
              )}

              <div className="modal-actions-bar" style={{ marginTop: '20px', padding: 0, background: 'transparent' }}>
                <button type="button" className="btn-logout" onClick={() => setModalAsignarOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary-action" disabled={equiposDisponibles.length === 0}>
                  Confirmar Asignación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Firmas Digitales y Descarga de Acta */}
      <ModalFirmaActa
        isOpen={modalFirmaActaOpen}
        onClose={() => {
          setModalFirmaActaOpen(false);
          setEquipoParaActa(null);
        }}
        equipo={equipoParaActa}
      />
    </div>
  );
}
