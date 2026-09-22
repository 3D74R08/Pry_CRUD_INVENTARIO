import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import HistorialModal from './HistorialModal';
import Pagination from '../components/Pagination';

export default function EquiposList({ moduloActivo = 'todos', onSelectModulo, onNavigate }) {
  const [equipos, setEquipos] = useState([]);
  const [conteos, setConteos] = useState({});
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [sedeFiltro, setSedeFiltro] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(50);

  // Modales
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [equipoEditando, setEquipoEditando] = useState(null);
  const [modalBajaOpen, setModalBajaOpen] = useState(false);
  const [equipoBaja, setEquipoBaja] = useState(null);
  const [motivoBaja, setMotivoBaja] = useState('');
  const [modalPrestamoOpen, setModalPrestamoOpen] = useState(false);
  const [equipoPrestamo, setEquipoPrestamo] = useState(null);
  const [formPrestamo, setFormPrestamo] = useState({ responsable_nombre: '', cedula_responsable: '', sede: '', observaciones: '' });
  const [historialEquipo, setHistorialEquipo] = useState(null);

  // Form State
  const initialForm = {
    placa: '',
    nombre_equipo: '',
    tipo: 'Laptop',
    marca: '',
    modelo: '',
    serial: '',
    procesador: '',
    ram: '',
    almacenamiento: '',
    sistema_operativo: '',
    estado: 'FUNCIONAL',
    sede: '',
    area: '',
    cedula_responsable: '',
    responsable_nombre: '',
    fecha_mantenimiento: '',
    observaciones: '',
    categoria: 'EQUIPOS_PRESTAMOS',
    modalidad: 'PROPIO',
    fecha_operacion: '',
    solicitante: '',
    recibido_por: '',
    ip: '',
    color: '',
    potencia: '',
    baterias: '',
    peso: '',
    proteccion: '',
    voltaje_entrada: '',
    voltaje_salida: '',
    disponibilidad: 'OK',
    board: '',
  };
  const [formData, setFormData] = useState(initialForm);

  const TABS_CONFIG = [
    { key: 'todos', label: 'Todos', icon: '💻', countKey: 'todos' },
    { key: 'equipos_prestamos', label: 'Equipos en Préstamo (Indefinido)', icon: '👥', countKey: 'equipos_prestamos' },
    { key: 'alquiler', label: 'Alquiler', icon: '📦', countKey: 'alquiler' },
    { key: 'prestamos', label: 'Préstamos Temporales (Por días)', icon: '⏳', countKey: 'prestamos' },
    { key: 'devoluciones', label: 'Devoluciones', icon: '↩', countKey: 'devoluciones' },
    { key: 'impresoras', label: 'Impresoras', icon: '🖨️', countKey: 'impresoras' },
    { key: 'elementos', label: 'Elementos', icon: '▥', countKey: 'elementos' },
    { key: 'perifericos', label: 'Periféricos', icon: '🎧', countKey: 'perifericos' },
    { key: 'ups', label: 'UPS', icon: '⚡', countKey: 'ups' },
    { key: 'bajas', label: 'Bajas', icon: '⊘', countKey: 'bajas' },
    { key: 'control_cambios', label: 'Control de Cambios', icon: '🕒', countKey: null },
  ];

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [dataEquipos, dataConteos] = await Promise.all([
        api.getEquipos({
          busqueda,
          estado: estadoFiltro,
          tipo: tipoFiltro,
          sede: sedeFiltro,
          modulo: moduloActivo === 'todos' ? '' : moduloActivo,
        }),
        api.getConteos().catch(() => ({ conteos: {} })),
      ]);
      setEquipos(dataEquipos.equipos || []);
      setConteos(dataConteos.conteos || {});
      setPaginaActual(1);
    } catch (err) {
      alert('Error al cargar datos del inventario: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [moduloActivo, estadoFiltro, tipoFiltro, sedeFiltro]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    cargarDatos();
  };

  const handleTabClick = (tabKey) => {
    if (tabKey === 'control_cambios') {
      if (onNavigate) onNavigate('control-cambios');
      return;
    }
    if (onSelectModulo) {
      onSelectModulo(tabKey);
    }
  };

  // Paginación
  const totalPaginas = Math.ceil(equipos.length / itemsPorPagina) || 1;
  const indexInicio = (paginaActual - 1) * itemsPorPagina;
  const equiposPaginados = equipos.slice(indexInicio, indexInicio + itemsPorPagina);

  // Handlers de Formulario
  const handleOpenNuevo = () => {
    setEquipoEditando(null);
    let cat = 'EQUIPOS_PRESTAMOS';
    let mod = 'PROPIO';
    let tip = 'Laptop';
    let est = 'FUNCIONAL';

    if (moduloActivo === 'impresoras') {
      cat = 'IMPRESORAS';
      tip = 'Impresora';
    } else if (moduloActivo === 'ups') {
      cat = 'UPS';
      tip = 'UPS';
    } else if (moduloActivo === 'perifericos') {
      cat = 'PERIFERICOS';
      tip = 'HUELLERO';
    } else if (moduloActivo === 'elementos') {
      cat = 'ELEMENTOS';
      tip = 'TABLETA';
    } else if (moduloActivo === 'alquiler') {
      cat = 'ALQUILER';
      mod = 'ALQUILER';
    } else if (moduloActivo === 'prestamos') {
      cat = 'PRESTAMOS';
      mod = 'PRESTAMO_TEMPORAL';
    } else if (moduloActivo === 'devoluciones') {
      cat = 'DEVOLUCIONES';
      mod = 'DEVOLUCION';
    } else if (moduloActivo === 'bajas') {
      cat = 'BAJAS';
      mod = 'BAJA';
      est = 'DE_BAJA';
    }

    setFormData({
      ...initialForm,
      tipo: tip,
      categoria: cat,
      modalidad: mod,
      estado: est,
    });
    setModalFormOpen(true);
  };

  const handleOpenEditar = (eq) => {
    setEquipoEditando(eq);
    setFormData({
      placa: eq.placa || '',
      nombre_equipo: eq.nombre_equipo || '',
      tipo: eq.tipo || 'Laptop',
      marca: eq.marca || '',
      modelo: eq.modelo || '',
      serial: eq.serial || '',
      procesador: eq.procesador || '',
      ram: eq.ram || '',
      almacenamiento: eq.almacenamiento || '',
      sistema_operativo: eq.sistema_operativo || '',
      estado: eq.estado || 'FUNCIONAL',
      sede: eq.sede || '',
      area: eq.area || '',
      cedula_responsable: eq.cedula_responsable || '',
      responsable_nombre: eq.responsable_nombre || '',
      fecha_mantenimiento: eq.fecha_mantenimiento ? eq.fecha_mantenimiento.slice(0, 10) : '',
      observaciones: eq.observaciones || '',
      categoria: eq.categoria || 'EQUIPOS_PRESTAMOS',
      modalidad: eq.modalidad || 'PROPIO',
      fecha_operacion: eq.fecha_operacion ? eq.fecha_operacion.slice(0, 10) : '',
      solicitante: eq.solicitante || '',
      recibido_por: eq.recibido_por || '',
      ip: eq.ip || '',
      color: eq.color || '',
      potencia: eq.potencia || '',
      baterias: eq.baterias || '',
      peso: eq.peso || '',
      proteccion: eq.proteccion || '',
      voltaje_entrada: eq.voltaje_entrada || '',
      voltaje_salida: eq.voltaje_salida || '',
      disponibilidad: eq.disponibilidad || 'OK',
      board: eq.board || '',
    });
    setModalFormOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      if (equipoEditando) {
        await api.updateEquipo(equipoEditando.id, formData);
      } else {
        await api.createEquipo(formData);
      }
      setModalFormOpen(false);
      cargarDatos();
    } catch (err) {
      alert('Error al guardar equipo: ' + err.message);
    }
  };

  // Préstamos y Devoluciones
  const handleOpenPrestamo = (eq) => {
    setEquipoPrestamo(eq);
    setFormPrestamo({
      responsable_nombre: '',
      cedula_responsable: '',
      solicitante: '',
      sede: eq.sede || '',
      observaciones: '',
    });
    setModalPrestamoOpen(true);
  };

  const handleSubmitPrestamo = async (e) => {
    e.preventDefault();
    try {
      await api.registrarPrestamo(equipoPrestamo.id, formPrestamo);
      setModalPrestamoOpen(false);
      cargarDatos();
    } catch (err) {
      alert('Error al registrar préstamo: ' + err.message);
    }
  };

  const handleDevolucionDirecta = async (eq) => {
    const quien = prompt(`Registrar devolución de ${eq.placa} a Custodia TI. ¿Quién recibe?`, 'Almacén TI');
    if (!quien) return;
    try {
      await api.registrarDevolucion(eq.id, {
        quien_recibe: quien,
        observaciones: 'Devuelto a custodia TI',
      });
      cargarDatos();
    } catch (err) {
      alert('Error al registrar devolución: ' + err.message);
    }
  };

  // Dar de Baja
  const handleOpenBaja = (eq) => {
    setEquipoBaja(eq);
    setMotivoBaja('');
    setModalBajaOpen(true);
  };

  const handleSubmitBaja = async (e) => {
    e.preventDefault();
    if (!motivoBaja.trim()) {
      alert('Debes indicar un motivo para la baja');
      return;
    }
    try {
      await api.darDeBaja(equipoBaja.id, motivoBaja);
      setModalBajaOpen(false);
      cargarDatos();
    } catch (err) {
      alert('Error al dar de baja: ' + err.message);
    }
  };

  // Eliminar
  const handleDelete = async (eq) => {
    if (confirm(`¿Estás seguro de eliminar el equipo con placa ${eq.placa}? Esta acción no se puede deshacer.`)) {
      try {
        await api.deleteEquipo(eq.id);
        cargarDatos();
      } catch (err) {
        alert('Error al eliminar equipo: ' + err.message);
      }
    }
  };

  const getStatusClass = (estado, area, cat) => {
    if (cat === 'BAJAS' || estado === 'DE_BAJA') return 'status-badge baja';
    if (area && area.toUpperCase().includes('PREST')) return 'status-badge revisar';
    if (area && area.toUpperCase().includes('CUSTOD')) return 'status-badge funcional';
    switch (estado) {
      case 'FUNCIONAL':
        return 'status-badge funcional';
      case 'REVISAR':
        return 'status-badge revisar';
      case 'DAÑADO':
        return 'status-badge danado';
      default:
        return 'status-badge funcional';
    }
  };

  return (
    <div className="equipos-module-container">
      {/* 1. Barra Horizontal de Módulos (Réplica de Sistema Anterior) */}
      <div className="legacy-tabs-bar">
        {TABS_CONFIG.map((tab) => {
          const isActive = moduloActivo === tab.key;
          const count = tab.countKey && conteos[tab.countKey] !== undefined ? conteos[tab.countKey] : null;
          return (
            <button
              key={tab.key}
              className={`legacy-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.key)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-text">{tab.label}</span>
              {count !== null && <span className="tab-badge">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Banner Informativo de Módulo: Equipos en Préstamo (Indefinido) vs Préstamos (Temporales) */}
      {moduloActivo === 'equipos_prestamos' && (
        <div className="module-info-banner indefinite">
          <span className="module-info-icon">👥</span>
          <div>
            <div className="module-info-title">
              Equipos en Préstamo — Dotación Indefinida a Colaboradores
            </div>
            <div className="module-info-desc">
              Equipos de la empresa asignados de manera permanente/indefinida a los empleados como dotación laboral fija para sus puestos de trabajo y funciones diarias.
            </div>
          </div>
        </div>
      )}

      {moduloActivo === 'prestamos' && (
        <div className="module-info-banner temporary">
          <span className="module-info-icon">⏳</span>
          <div>
            <div className="module-info-title">
              Préstamos Temporales — Salidas por Días con Retorno Obligatorio
            </div>
            <div className="module-info-desc">
              Equipos prestados a funcionarios por unos pocos días para contingencias o comisiones. Tienen solicitante registrado y deben ser devueltos a Custodia/Almacén TI al finalizar el plazo.
            </div>
          </div>
        </div>
      )}

      {/* 2. Barra de Filtros y Búsqueda */}
      <div className="table-controls-card">
        <form onSubmit={handleSearchSubmit} className="search-box-wrap">
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por placa, modelo, serial, responsable, área o IP..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <button type="submit" className="btn-search">
            🔍 Buscar
          </button>
        </form>

        <div className="filters-row">
          <select
            className="select-filter"
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="FUNCIONAL">Funcional</option>
            <option value="REVISAR">En Revisión</option>
            <option value="DAÑADO">Dañado</option>
            <option value="DE_BAJA">De Baja</option>
          </select>

          <select
            className="select-filter"
            value={sedeFiltro}
            onChange={(e) => setSedeFiltro(e.target.value)}
          >
            <option value="">Todas las sedes</option>
            <option value="AMERICAS">Américas</option>
            <option value="105">Sede 105</option>
            <option value="106">Sede 106</option>
            <option value="BRIGADAS">Brigadas</option>
            <option value="SOLEDAD">Soledad</option>
            <option value="FFMM">FFMM</option>
          </select>

          <button className="btn-primary-action" onClick={handleOpenNuevo}>
            <span>+</span> Nuevo Activo
          </button>
        </div>
      </div>

      {/* 3. Tabla Dinámica de Datos Adaptada al Módulo */}
      <div className="custom-table-wrap">
        <table className="custom-table">
          <thead>
            {moduloActivo === 'impresoras' ? (
              <tr>
                <th>Placa</th>
                <th>Marca / Modelo</th>
                <th>IP de Red</th>
                <th>Color</th>
                <th>Serial</th>
                <th>Sede / Área</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            ) : moduloActivo === 'ups' ? (
              <tr>
                <th>Placa</th>
                <th>Marca / Modelo</th>
                <th>Serial</th>
                <th>Potencia</th>
                <th>Baterías</th>
                <th>Voltaje E/S</th>
                <th>Sede / Área</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            ) : moduloActivo === 'perifericos' ? (
              <tr>
                <th>Tipo</th>
                <th>Marca / Modelo</th>
                <th>Serial</th>
                <th>Ubicación</th>
                <th>Área</th>
                <th>Disponibilidad</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            ) : moduloActivo === 'bajas' ? (
              <tr>
                <th>Placa</th>
                <th>Tipo</th>
                <th>Marca / Modelo</th>
                <th>Serial</th>
                <th>Fecha de Baja</th>
                <th>Motivo de Baja / Daño Reportado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            ) : moduloActivo === 'alquiler' ? (
              <tr>
                <th>Placa</th>
                <th>Tipo</th>
                <th>Marca / Modelo</th>
                <th>Responsable</th>
                <th>Sede / Área</th>
                <th>Quién Solicita</th>
                <th>Fecha</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            ) : moduloActivo === 'devoluciones' ? (
              <tr>
                <th>Placa</th>
                <th>Tipo</th>
                <th>Marca / Modelo</th>
                <th>Responsable Anterior</th>
                <th>Sede / Área</th>
                <th>Quién Recibe (TI)</th>
                <th>Fecha Devolución</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            ) : moduloActivo === 'prestamos' ? (
              <tr>
                <th>Placa</th>
                <th>Tipo</th>
                <th>Marca / Modelo</th>
                <th>Responsable</th>
                <th>Sede / Área</th>
                <th>Quién Solicita</th>
                <th>Fecha Préstamo</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            ) : (
              /* Columnas Estándar (Todos / Equipos en Préstamos / Elementos) */
              <tr>
                <th>Placa</th>
                <th>Tipo</th>
                <th>Marca / Modelo</th>
                <th>Serial</th>
                <th>Sede / Área</th>
                <th>Asignado a</th>
                <th>Estado</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            )}
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                  Cargando inventario tecnológico...
                </td>
              </tr>
            ) : equiposPaginados.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No se encontraron equipos registrados en este módulo con los filtros aplicados.
                </td>
              </tr>
            ) : (
              equiposPaginados.map((eq) => (
                <tr key={eq.id}>
                  {moduloActivo === 'impresoras' ? (
                    <>
                      <td><span className="placa-badge">{eq.placa}</span></td>
                      <td><b>{eq.marca}</b> <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{eq.modelo}</span></td>
                      <td>
                        <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}>
                          {eq.ip || 'Sin IP'}
                        </span>
                      </td>
                      <td>{eq.color || '—'}</td>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{eq.serial || '—'}</span></td>
                      <td>{eq.sede || '—'} - <small>{eq.area || 'General'}</small></td>
                      <td><span className="status-badge funcional">{eq.estado || 'FUNCIONAL'}</span></td>
                    </>
                  ) : moduloActivo === 'ups' ? (
                    <>
                      <td><span className="placa-badge">{eq.placa}</span></td>
                      <td><b>{eq.marca}</b> <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{eq.modelo}</span></td>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{eq.serial || '—'}</span></td>
                      <td><b>{eq.potencia || '—'}</b></td>
                      <td>{eq.baterias || '—'}</td>
                      <td style={{ fontSize: '11px' }}>{eq.voltaje_entrada || '110V'} / {eq.voltaje_salida || '110V'}</td>
                      <td>{eq.sede || '—'} - <small>{eq.area || 'General'}</small></td>
                    </>
                  ) : moduloActivo === 'perifericos' ? (
                    <>
                      <td><b>{eq.tipo || 'HUELLERO'}</b></td>
                      <td><b>{eq.marca}</b> <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{eq.modelo}</span></td>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{eq.serial || eq.placa || '—'}</span></td>
                      <td>{eq.sede || '106'}</td>
                      <td>{eq.area || 'TI'}</td>
                      <td>
                        <span className={`status-badge ${eq.disponibilidad === 'OK' ? 'funcional' : 'revisar'}`}>
                          {eq.disponibilidad || 'OK'}
                        </span>
                      </td>
                    </>
                  ) : moduloActivo === 'bajas' ? (
                    <>
                      <td><span className="placa-badge">{eq.placa}</span></td>
                      <td><b>{eq.tipo}</b></td>
                      <td><b>{eq.marca}</b> {eq.modelo}</td>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{eq.serial || '—'}</span></td>
                      <td><small>{eq.fecha_operacion ? eq.fecha_operacion.slice(0, 10) : 'Registrada'}</small></td>
                      <td className="cell-wrap-text" style={{ fontSize: '12px', color: '#b91c1c' }}>
                        {eq.observaciones || 'Desincorporado por daño irreparable u obsolescencia'}
                      </td>
                    </>
                  ) : moduloActivo === 'alquiler' ? (
                    <>
                      <td><span className="placa-badge">{eq.placa}</span></td>
                      <td><b>{eq.tipo}</b></td>
                      <td><b>{eq.marca}</b> {eq.modelo}</td>
                      <td>
                        <div><b>{eq.responsable_nombre || 'BRIGADAS'}</b></div>
                        {eq.cedula_responsable && <small style={{ color: 'var(--text-muted)' }}>C.C. {eq.cedula_responsable}</small>}
                      </td>
                      <td>{eq.sede} - <small>{eq.area}</small></td>
                      <td><b>{eq.solicitante || '—'}</b></td>
                      <td><small>{eq.fecha_operacion ? eq.fecha_operacion.slice(0, 10) : '—'}</small></td>
                    </>
                  ) : moduloActivo === 'devoluciones' ? (
                    <>
                      <td><span className="placa-badge">{eq.placa}</span></td>
                      <td><b>{eq.tipo}</b></td>
                      <td><b>{eq.marca}</b> {eq.modelo}</td>
                      <td>
                        <div><b>{eq.responsable_nombre || 'Sin nombre'}</b></div>
                        {eq.cedula_responsable && <small style={{ color: 'var(--text-muted)' }}>C.C. {eq.cedula_responsable}</small>}
                      </td>
                      <td>{eq.sede} - <small>{eq.area}</small></td>
                      <td><b>{eq.recibido_por || 'Custodia TI'}</b></td>
                      <td><small>{eq.fecha_operacion ? eq.fecha_operacion.slice(0, 10) : '—'}</small></td>
                    </>
                  ) : moduloActivo === 'prestamos' ? (
                    <>
                      <td><span className="placa-badge">{eq.placa}</span></td>
                      <td><b>{eq.tipo}</b></td>
                      <td><b>{eq.marca}</b> {eq.modelo}</td>
                      <td>
                        <div><b>{eq.responsable_nombre || 'Sin nombre'}</b></div>
                        {eq.cedula_responsable && <small style={{ color: 'var(--text-muted)' }}>C.C. {eq.cedula_responsable}</small>}
                      </td>
                      <td>{eq.sede} - <small>{eq.area}</small></td>
                      <td><b>{eq.solicitante || '—'}</b></td>
                      <td><small>{eq.fecha_operacion ? eq.fecha_operacion.slice(0, 10) : '—'}</small></td>
                    </>
                  ) : (
                    /* Celdas Estándar */
                    <>
                      <td><span className="placa-badge">{eq.placa}</span></td>
                      <td>{eq.tipo}</td>
                      <td><b>{eq.marca}</b> <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{eq.modelo}</span></td>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{eq.serial || '—'}</span></td>
                      <td>{eq.sede || '—'} - <small>{eq.area || 'General'}</small></td>
                      <td>
                        <div><b>{eq.responsable_nombre || 'En Almacén'}</b></div>
                        {eq.cedula_responsable && <small style={{ color: 'var(--text-muted)' }}>C.C. {eq.cedula_responsable}</small>}
                      </td>
                      <td>
                        <span className={getStatusClass(eq.estado, eq.area, eq.categoria)}>
                          {eq.estado}
                        </span>
                      </td>
                    </>
                  )}

                  <td style={{ textAlign: 'center', width: '130px', minWidth: '130px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center', justifyContent: 'center' }}>
                      <button
                        className="btn-icon"
                        title="Ver Historial y Trazabilidad"
                        onClick={() => setHistorialEquipo(eq)}
                      >
                        👁️
                      </button>

                      {eq.estado !== 'DE_BAJA' && moduloActivo !== 'bajas' && (
                        <>
                          <button
                            className="btn-icon"
                            title="Prestar equipo"
                            onClick={() => handleOpenPrestamo(eq)}
                          >
                            ⇄
                          </button>
                          {eq.responsable_nombre && eq.responsable_nombre !== 'CUSTODIA' && (
                            <button
                              className="btn-icon"
                              title="Devolver a custodia"
                              onClick={() => handleDevolucionDirecta(eq)}
                            >
                              ↩
                            </button>
                          )}
                        </>
                      )}

                      <button
                        className="btn-icon"
                        title="Editar equipo"
                        onClick={() => handleOpenEditar(eq)}
                      >
                        ✎
                      </button>

                      {eq.estado !== 'DE_BAJA' && moduloActivo !== 'bajas' && (
                        <button
                          className="btn-icon warn"
                          title="Dar de baja"
                          onClick={() => handleOpenBaja(eq)}
                        >
                          ⊘
                        </button>
                      )}

                      <button
                        className="btn-icon danger"
                        title="Eliminar equipo"
                        onClick={() => handleDelete(eq)}
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 4. Paginador Moderno */}
      <Pagination
        paginaActual={paginaActual}
        totalItems={equipos.length}
        itemsPorPagina={itemsPorPagina}
        onCambiarPagina={(pag) => setPaginaActual(pag)}
        onCambiarItemsPorPagina={(tamano) => setItemsPorPagina(tamano)}
        opcionesItemsPorPagina={[10, 25, 50, 100]}
      />

      {/* Modal Historial de Trazabilidad */}
      {historialEquipo && (
        <HistorialModal
          equipo={historialEquipo}
          onClose={() => setHistorialEquipo(null)}
        />
      )}

      {/* Modal Formulario Adaptativo (Crear / Editar) */}
      {modalFormOpen && (
        <div className="modal-backdrop" onClick={() => setModalFormOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {equipoEditando ? `Editar Activo: ${equipoEditando.placa}` : `Registrar en ${moduloActivo.toUpperCase()}`}
              </h3>
              <button className="btn-icon" onClick={() => setModalFormOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm}>
              <div className="form-2col">
                <div className="form-field-group">
                  <label>Placa / Identificador *</label>
                  <input
                    value={formData.placa}
                    onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                    placeholder="Ej. HP-042 o dejar vacío para auto-asignar"
                  />
                </div>

                <div className="form-field-group">
                  <label>Tipo de Equipo *</label>
                  <input
                    required
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    placeholder="Laptop, Impresora, UPS, HUELLERO, etc."
                  />
                </div>

                <div className="form-field-group">
                  <label>Marca *</label>
                  <input
                    required
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    placeholder="Ej. HP, Lenovo, Canon, VME, Futronic"
                  />
                </div>

                <div className="form-field-group">
                  <label>Modelo</label>
                  <input
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    placeholder="Ej. ThinkPad T14, G4170, FS88H"
                  />
                </div>

                <div className="form-field-group">
                  <label>Serial</label>
                  <input
                    value={formData.serial}
                    onChange={(e) => setFormData({ ...formData, serial: e.target.value })}
                    placeholder="Número de serie físico"
                  />
                </div>

                <div className="form-field-group">
                  <label>Estado</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  >
                    <option value="FUNCIONAL">Funcional</option>
                    <option value="REVISAR">A Revisar</option>
                    <option value="DAÑADO">Dañado</option>
                    <option value="DE_BAJA">De Baja</option>
                  </select>
                </div>

                <div className="form-field-group">
                  <label>Sede / Ubicación</label>
                  <input
                    value={formData.sede}
                    onChange={(e) => setFormData({ ...formData, sede: e.target.value })}
                    placeholder="Ej. Américas, 105, 106, Brigadas"
                  />
                </div>

                <div className="form-field-group">
                  <label>Área</label>
                  <input
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder="Ej. Tecnología, Recepción, Laboratorio"
                  />
                </div>

                {/* Campos Especializados para Impresoras */}
                {moduloActivo === 'impresoras' && (
                  <>
                    <div className="form-field-group">
                      <label>IP de Red LAN</label>
                      <input
                        value={formData.ip}
                        onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                        placeholder="Ej. 192.168.11.50"
                      />
                    </div>
                    <div className="form-field-group">
                      <label>Color</label>
                      <input
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        placeholder="Negra, Blanca..."
                      />
                    </div>
                  </>
                )}

                {/* Campos Especializados para UPS */}
                {moduloActivo === 'ups' && (
                  <>
                    <div className="form-field-group">
                      <label>Potencia (VA/W)</label>
                      <input
                        value={formData.potencia}
                        onChange={(e) => setFormData({ ...formData, potencia: e.target.value })}
                        placeholder="Ej. 2000VA/1800W"
                      />
                    </div>
                    <div className="form-field-group">
                      <label>Baterías</label>
                      <input
                        value={formData.baterias}
                        onChange={(e) => setFormData({ ...formData, baterias: e.target.value })}
                        placeholder="Ej. 4 de 12VDC/9 Ah"
                      />
                    </div>
                    <div className="form-field-group">
                      <label>Voltaje Entrada</label>
                      <input
                        value={formData.voltaje_entrada}
                        onChange={(e) => setFormData({ ...formData, voltaje_entrada: e.target.value })}
                        placeholder="110VAC-127VAC"
                      />
                    </div>
                    <div className="form-field-group">
                      <label>Voltaje Salida</label>
                      <input
                        value={formData.voltaje_salida}
                        onChange={(e) => setFormData({ ...formData, voltaje_salida: e.target.value })}
                        placeholder="110VAC-127VAC"
                      />
                    </div>
                  </>
                )}

                {/* Campos Especializados para Periféricos */}
                {moduloActivo === 'perifericos' && (
                  <div className="form-field-group">
                    <label>Disponibilidad</label>
                    <select
                      value={formData.disponibilidad}
                      onChange={(e) => setFormData({ ...formData, disponibilidad: e.target.value })}
                    >
                      <option value="OK">OK (Disponible)</option>
                      <option value="ASIGNADO">ASIGNADO</option>
                    </select>
                  </div>
                )}

                {/* Campos para Préstamos / Alquiler / Devoluciones */}
                {['prestamos', 'alquiler', 'devoluciones'].includes(moduloActivo) && (
                  <>
                    <div className="form-field-group">
                      <label>Cédula Responsable</label>
                      <input
                        value={formData.cedula_responsable}
                        onChange={(e) => setFormData({ ...formData, cedula_responsable: e.target.value })}
                        placeholder="C.C. Colaborador"
                      />
                    </div>
                    <div className="form-field-group">
                      <label>Nombre Responsable</label>
                      <input
                        value={formData.responsable_nombre}
                        onChange={(e) => setFormData({ ...formData, responsable_nombre: e.target.value })}
                        placeholder="Nombre y apellido"
                      />
                    </div>
                    <div className="form-field-group">
                      <label>{moduloActivo === 'devoluciones' ? 'Quién Recibe (TI)' : 'Quién Solicita'}</label>
                      <input
                        value={moduloActivo === 'devoluciones' ? formData.recibido_por : formData.solicitante}
                        onChange={(e) =>
                          moduloActivo === 'devoluciones'
                            ? setFormData({ ...formData, recibido_por: e.target.value })
                            : setFormData({ ...formData, solicitante: e.target.value })
                        }
                        placeholder="Funcionario solicitante o receptor"
                      />
                    </div>
                    <div className="form-field-group">
                      <label>Fecha de Operación</label>
                      <input
                        type="date"
                        value={formData.fecha_operacion}
                        onChange={(e) => setFormData({ ...formData, fecha_operacion: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {/* Especificaciones Técnicas Estándar para PCs y Laptops */}
                {['todos', 'equipos_prestamos'].includes(moduloActivo) && (
                  <>
                    <div className="form-field-group">
                      <label>Cédula Responsable</label>
                      <input
                        value={formData.cedula_responsable}
                        onChange={(e) => setFormData({ ...formData, cedula_responsable: e.target.value })}
                        placeholder="Ej. 1001234567"
                      />
                    </div>
                    <div className="form-field-group">
                      <label>Nombre Responsable</label>
                      <input
                        value={formData.responsable_nombre}
                        onChange={(e) => setFormData({ ...formData, responsable_nombre: e.target.value })}
                        placeholder="Ej. Juan Pérez"
                      />
                    </div>
                    <div className="form-field-group">
                      <label>Procesador</label>
                      <input
                        value={formData.procesador}
                        onChange={(e) => setFormData({ ...formData, procesador: e.target.value })}
                        placeholder="Ej. Intel Core i5-1135G7"
                      />
                    </div>
                    <div className="form-field-group">
                      <label>Memoria RAM</label>
                      <input
                        value={formData.ram}
                        onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                        placeholder="Ej. 16 GB"
                      />
                    </div>
                    <div className="form-field-group">
                      <label>Disco / Almacenamiento</label>
                      <input
                        value={formData.almacenamiento}
                        onChange={(e) => setFormData({ ...formData, almacenamiento: e.target.value })}
                        placeholder="Ej. 512 GB SSD"
                      />
                    </div>
                    <div className="form-field-group">
                      <label>Sistema Operativo</label>
                      <input
                        value={formData.sistema_operativo}
                        onChange={(e) => setFormData({ ...formData, sistema_operativo: e.target.value })}
                        placeholder="Ej. Windows 11 Pro"
                      />
                    </div>
                  </>
                )}

                <div className="form-field-group full-width">
                  <label>
                    {moduloActivo === 'bajas' ? 'Motivo Detallado de Baja / Daño Reportado *' : 'Observaciones y Accesorios'}
                  </label>
                  <textarea
                    rows="3"
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    placeholder={moduloActivo === 'bajas' ? 'Describir la falla irreparable...' : 'Cargador, mouse, base, observaciones generales...'}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalFormOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {equipoEditando ? 'Guardar Cambios' : 'Registrar Activo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Préstamo */}
      {modalPrestamoOpen && (
        <div className="modal-backdrop" onClick={() => setModalPrestamoOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Préstamo Temporal: {equipoPrestamo?.placa}</h3>
              <button className="btn-icon" onClick={() => setModalPrestamoOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitPrestamo}>
              <div className="form-2col" style={{ gridTemplateColumns: '1fr' }}>
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#92400e', lineHeight: 1.4 }}>
                  ⏳ <b>Préstamo Temporal (Por Días):</b> Este equipo se registrará como préstamo temporal por unos días y requerirá retorno a Custodia/Almacén TI. (Las asignaciones indefinidas para puestos de trabajo se gestionan como <i>Equipos en Préstamo</i>).
                </div>
                <div className="form-field-group">
                  <label>Nombre del Responsable * (Quién se lleva el equipo)</label>
                  <input
                    required
                    value={formPrestamo.responsable_nombre}
                    onChange={(e) => setFormPrestamo({ ...formPrestamo, responsable_nombre: e.target.value })}
                    placeholder="Nombre y Apellido del funcionario"
                  />
                </div>
                <div className="form-field-group">
                  <label>Cédula de Identidad *</label>
                  <input
                    required
                    value={formPrestamo.cedula_responsable}
                    onChange={(e) => setFormPrestamo({ ...formPrestamo, cedula_responsable: e.target.value })}
                    placeholder="Ej. 1001234567"
                  />
                </div>
                <div className="form-field-group">
                  <label>Quién Solicita (Funcionario / Área / Jefe)</label>
                  <input
                    value={formPrestamo.solicitante}
                    onChange={(e) => setFormPrestamo({ ...formPrestamo, solicitante: e.target.value })}
                    placeholder="Ej. Coordinación Administrativa / Dra. Marcela"
                  />
                </div>
                <div className="form-field-group">
                  <label>Sede de Entrega</label>
                  <input
                    value={formPrestamo.sede}
                    onChange={(e) => setFormPrestamo({ ...formPrestamo, sede: e.target.value })}
                    placeholder="Ej. Américas, 106, Brigadas"
                  />
                </div>
                <div className="form-field-group">
                  <label>Observaciones y Tiempo Estimado de Préstamo</label>
                  <textarea
                    rows="3"
                    value={formPrestamo.observaciones}
                    onChange={(e) => setFormPrestamo({ ...formPrestamo, observaciones: e.target.value })}
                    placeholder="Días de préstamo estimados, motivo de la comisión o contingencia, accesorios entregados..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalPrestamoOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar Préstamo Temporal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dar de Baja */}
      {modalBajaOpen && (
        <div className="modal-backdrop" onClick={() => setModalBajaOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#b91c1c' }}>
                ⚠️ Confirmar Baja Definitiva: {equipoBaja?.placa}
              </h3>
              <button className="btn-icon" onClick={() => setModalBajaOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitBaja}>
              <div style={{ padding: '8px 0 16px 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                Esta acción desincorporará el activo del inventario operativo marcándolo con estado <b>DE_BAJA</b> y registrando un evento de auditoría formal.
              </div>
              <div className="form-field-group">
                <label>Motivo Técnico de la Baja *</label>
                <textarea
                  required
                  rows="4"
                  value={motivoBaja}
                  onChange={(e) => setMotivoBaja(e.target.value)}
                  placeholder="Explica la causa técnica (ej. cortocircuito en placa, rotura irreparable de pantalla, obsolescencia tecnológica)..."
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalBajaOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-danger">
                  Dar de Baja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
