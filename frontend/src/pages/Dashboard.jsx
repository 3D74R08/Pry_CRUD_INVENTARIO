import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  LaptopIcon,
  UsersIcon,
  ClockIcon,
  CheckIcon,
  PlusIcon,
  TagIcon,
  ArrowLeftRightIcon,
  RotateCcwIcon,
  AlertTriangleIcon,
  UploadCloudIcon,
  ArchiveIcon,
  PackageIcon,
  BuildingIcon,
} from '../components/Icons';

export default function Dashboard({ onNavigate }) {
  const { user, isAdmin, canManageInventory } = useAuth();
  const [metricas, setMetricas] = useState({
    resumen: { totalEquipos: 0, usuariosActivos: 0, tareasEnProceso: 0, tareasCompletadas: 0 },
    disponibilidad: { asignados: 0, enCustodia: 0, prestamoTemporal: 0, deBaja: 0 },
    porTipo: [],
    porEstado: [],
    porSede: [],
    porMarca: [],
    porSO: [],
  });
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabDistribucion, setTabDistribucion] = useState('marcas');

  useEffect(() => {
    async function loadData() {
      try {
        const [metRes, evRes] = await Promise.all([
          api.getMetricasDashboard().catch(() => ({
            resumen: { totalEquipos: 0, usuariosActivos: 0, tareasEnProceso: 0, tareasCompletadas: 0 },
            disponibilidad: { asignados: 0, enCustodia: 0, prestamoTemporal: 0, deBaja: 0 },
            porTipo: [],
            porEstado: [],
            porSede: [],
            porMarca: [],
            porSO: [],
          })),
          api.getEventosRecientes().catch(() => ({ eventos: [] })),
        ]);
        setMetricas(metRes || {});
        setEventos(evRes.eventos || []);
      } catch (err) {
        console.error('Error al cargar dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const timeAgo = (iso) => {
    if (!iso) return '';
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'Hace instantes';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return `Hace ${Math.floor(diff / 86400)} d`;
  };

  const getEventBadgeClass = (tipo) => {
    switch (tipo) {
      case 'CREACION': return 'activity-icon-badge create';
      case 'ASIGNACION':
      case 'PRESTAMO': return 'activity-icon-badge asignacion';
      case 'DEVOLUCION': return 'activity-icon-badge devolucion';
      case 'REPORTE_FALLO': return 'activity-icon-badge fallo';
      case 'CARGA_MASIVA': return 'activity-icon-badge masiva';
      case 'DE_BAJA': return 'activity-icon-badge baja';
      default: return 'activity-icon-badge create';
    }
  };

  const getEventIcon = (tipo) => {
    switch (tipo) {
      case 'CREACION': return <PlusIcon size={14} />;
      case 'ASIGNACION': return <TagIcon size={14} />;
      case 'PRESTAMO': return <ArrowLeftRightIcon size={14} />;
      case 'DEVOLUCION': return <RotateCcwIcon size={14} />;
      case 'REPORTE_FALLO': return <AlertTriangleIcon size={14} />;
      case 'CARGA_MASIVA': return <UploadCloudIcon size={14} />;
      case 'DE_BAJA': return <ArchiveIcon size={14} />;
      default: return <TagIcon size={14} />;
    }
  };

  const {
    resumen = { totalEquipos: 0, usuariosActivos: 0, tareasEnProceso: 0, tareasCompletadas: 0 },
    disponibilidad = { asignados: 0, enCustodia: 0, prestamoTemporal: 0, deBaja: 0 },
    porTipo = [],
    porEstado = [],
    porSede = [],
    porMarca = [],
    porSO = [],
  } = metricas;

  // Disponibilidad Operativa (Donut SVG)
  const itemsDisponibilidad = useMemo(() => [
    { label: 'Asignados', cantidad: disponibilidad?.asignados || 0, color: '#2563eb' },
    { label: 'En Custodia TI', cantidad: disponibilidad?.enCustodia || 0, color: '#10b981' },
    { label: 'Préstamo Temporal', cantidad: disponibilidad?.prestamoTemporal || 0, color: '#f59e0b' },
    { label: 'De Baja', cantidad: disponibilidad?.deBaja || 0, color: '#94a3b8' },
  ], [disponibilidad]);

  const totalDisponibilidad = useMemo(() => {
    return itemsDisponibilidad.reduce((acc, curr) => acc + curr.cantidad, 0) || 1;
  }, [itemsDisponibilidad]);

  const slicesDisponibilidad = useMemo(() => {
    let currentAngle = 0;
    return itemsDisponibilidad.map((item) => {
      const pct = item.cantidad / totalDisponibilidad;
      const strokeDasharray = `${pct * 283} 283`;
      const strokeDashoffset = -currentAngle * 283;
      currentAngle += pct;
      return {
        ...item,
        dasharray: strokeDasharray,
        dashoffset: strokeDashoffset,
        pct: Math.round(pct * 100),
      };
    });
  }, [itemsDisponibilidad, totalDisponibilidad]);

  // Salud del Parque Tecnológico (Semáforo de Estados)
  const saludData = useMemo(() => {
    const findCount = (queryArr) => {
      let sum = 0;
      (porEstado || []).forEach((e) => {
        const est = (e.estado || '').toUpperCase();
        if (queryArr.some((q) => est.includes(q))) {
          sum += (e.cantidad || 0);
        }
      });
      return sum;
    };

    const funcionales = findCount(['FUNCIONAL', 'OPERATIVO']);
    const enRevision = findCount(['REVISION', 'MANTENIMIENTO']);
    const danados = findCount(['DANADO', 'DAÑADO', 'FALLA']);
    const deBaja = findCount(['BAJA', 'OBSOLETO', 'DESCARTE']);

    const totalSalud = (funcionales + enRevision + danados + deBaja) || 1;
    return {
      funcionales,
      enRevision,
      danados,
      deBaja,
      totalSalud,
      pctFuncional: Math.round((funcionales / totalSalud) * 100),
      pctRevision: Math.round((enRevision / totalSalud) * 100),
      pctDanado: Math.round((danados / totalSalud) * 100),
      pctBaja: Math.round((deBaja / totalSalud) * 100),
    };
  }, [porEstado]);

  // Distribución por Sede
  const maxSedeCount = useMemo(() => {
    return Math.max(...(porSede.map((s) => s.cantidad) || [1]), 1);
  }, [porSede]);

  // Ecosistema Hardware / Software (Pestañas dinámicas)
  const ecosystemData = useMemo(() => {
    if (tabDistribucion === 'marcas') {
      return (porMarca || []).map((m) => ({ label: m.marca, cantidad: m.cantidad, type: 'marca' }));
    }
    if (tabDistribucion === 'tipos') {
      return (porTipo || []).map((t) => ({ label: t.tipo, cantidad: t.cantidad, type: 'tipo' }));
    }
    return (porSO || []).map((s) => ({ label: s.so, cantidad: s.cantidad, type: 'so' }));
  }, [tabDistribucion, porMarca, porTipo, porSO]);

  const maxEcosystemCount = useMemo(() => {
    return Math.max(...(ecosystemData.map((d) => d.cantidad) || [1]), 1);
  }, [ecosystemData]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando métricas ejecutivas...</div>;
  }

  return (
    <div>
      {/* 1. Cuadrícula de KPIs Principales */}
      <div className="kpi-grid">
        <div className="kpi-card" onClick={() => onNavigate && onNavigate('equipos')} style={{ cursor: 'pointer' }}>
          <div className="kpi-info">
            <div className="kpi-label">Total de Equipos</div>
            <div className="kpi-value">{resumen.totalEquipos}</div>
          </div>
          <div className="kpi-icon-wrap blue"><LaptopIcon size={24} /></div>
        </div>

        <div className="kpi-card" onClick={() => onNavigate && onNavigate('equipos')} style={{ cursor: 'pointer' }}>
          <div className="kpi-info">
            <div className="kpi-label">Libres en Custodia TI</div>
            <div className="kpi-value">{disponibilidad.enCustodia || 0}</div>
          </div>
          <div className="kpi-icon-wrap green"><PackageIcon size={24} /></div>
        </div>

        <div className="kpi-card" onClick={() => onNavigate && onNavigate('equipos')} style={{ cursor: 'pointer' }}>
          <div className="kpi-info">
            <div className="kpi-label">Asignados y Préstamos</div>
            <div className="kpi-value">{(disponibilidad.asignados || 0) + (disponibilidad.prestamoTemporal || 0)}</div>
          </div>
          <div className="kpi-icon-wrap purple"><TagIcon size={24} /></div>
        </div>

        <div className="kpi-card" onClick={() => onNavigate && onNavigate('usuarios')} style={{ cursor: 'pointer' }}>
          <div className="kpi-info">
            <div className="kpi-label">Usuarios Activos</div>
            <div className="kpi-value">{resumen.usuariosActivos}</div>
          </div>
          <div className="kpi-icon-wrap amber"><UsersIcon size={24} /></div>
        </div>
      </div>

      {/* 2. Grid de Diagnóstico Operativo: Disponibilidad + Salud Parque + Distribución por Sede */}
      <div className="dashboard-grid-3col">
        {/* Card 1: Disponibilidad Operativa (Donut SVG) */}
        <div className="content-panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div>
              <h2>Disponibilidad del Parque</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Custodia vs. Asignados</span>
            </div>
          </div>

          <div className="donut-chart-container" style={{ padding: '4px 0' }}>
            <div className="donut-svg-wrap" style={{ width: '120px', height: '120px' }}>
              <svg width="120" height="120" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="45" fill="transparent" stroke="#f1f5f9" strokeWidth="10" />
                {slicesDisponibilidad.map((s, i) => (
                  <circle
                    key={i}
                    cx="50"
                    cy="50"
                    r="45"
                    fill="transparent"
                    stroke={s.color}
                    strokeWidth="10"
                    strokeDasharray={s.dasharray}
                    strokeDashoffset={s.dashoffset}
                  />
                ))}
              </svg>
              <div className="donut-center-text">
                <div className="donut-center-num" style={{ fontSize: '20px' }}>{resumen.totalEquipos}</div>
                <div className="donut-center-label">Activos</div>
              </div>
            </div>

            <div className="donut-legend" style={{ gap: '6px' }}>
              {slicesDisponibilidad.map((s, i) => (
                <div key={i} className="donut-legend-item" style={{ fontSize: '11.5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="legend-color-dot" style={{ background: s.color, width: '8px', height: '8px', marginRight: '6px' }} />
                    <span style={{ fontWeight: 600 }}>{s.label}</span>
                  </div>
                  <div>
                    <b>{s.cantidad}</b> <span style={{ color: 'var(--text-muted)' }}>({s.pct}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Salud del Parque Tecnológico (Semáforo de Estados) */}
        <div className="content-panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div>
              <h2>Salud del Hardware</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Condición técnica del parque</span>
            </div>
          </div>

          <div style={{ paddingTop: '4px' }}>
            {/* Multi-segment progress bar */}
            <div className="health-bar-multi">
              <div
                className="health-bar-segment funcional"
                style={{ width: `${(saludData.funcionales / saludData.totalSalud) * 100}%` }}
                title={`Funcionales: ${saludData.funcionales}`}
              />
              <div
                className="health-bar-segment revisar"
                style={{ width: `${(saludData.enRevision / saludData.totalSalud) * 100}%` }}
                title={`En Revisión: ${saludData.enRevision}`}
              />
              <div
                className="health-bar-segment danado"
                style={{ width: `${(saludData.danados / saludData.totalSalud) * 100}%` }}
                title={`Dañados: ${saludData.danados}`}
              />
              <div
                className="health-bar-segment baja"
                style={{ width: `${(saludData.deBaja / saludData.totalSalud) * 100}%` }}
                title={`De Baja: ${saludData.deBaja}`}
              />
            </div>

            {/* Status Pills Grid */}
            <div className="status-pills-grid">
              <div className="status-pill-card funcional">
                <div className="status-pill-left">
                  <span className="status-pill-dot" />
                  <span className="status-pill-name">Funcionales</span>
                </div>
                <div className="status-pill-val">
                  {saludData.funcionales} <span className="status-pill-pct">({saludData.pctFuncional}%)</span>
                </div>
              </div>

              <div className="status-pill-card revisar">
                <div className="status-pill-left">
                  <span className="status-pill-dot" />
                  <span className="status-pill-name">En Revisión</span>
                </div>
                <div className="status-pill-val">
                  {saludData.enRevision} <span className="status-pill-pct">({saludData.pctRevision}%)</span>
                </div>
              </div>

              <div className="status-pill-card danado">
                <div className="status-pill-left">
                  <span className="status-pill-dot" />
                  <span className="status-pill-name">Dañados</span>
                </div>
                <div className="status-pill-val">
                  {saludData.danados} <span className="status-pill-pct">({saludData.pctDanado}%)</span>
                </div>
              </div>

              <div className="status-pill-card baja">
                <div className="status-pill-left">
                  <span className="status-pill-dot" />
                  <span className="status-pill-name">De Baja</span>
                </div>
                <div className="status-pill-val">
                  {saludData.deBaja} <span className="status-pill-pct">({saludData.pctBaja}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Distribución por Sede / Ubicación */}
        <div className="content-panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div>
              <h2>Distribución por Sede</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Presencia física en sedes</span>
            </div>
          </div>

          <div className="sede-bar-list">
            {porSede.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '12.5px', textAlign: 'center', padding: '24px 0' }}>
                No hay sedes registradas aún
              </div>
            ) : (
              porSede.map((item, idx) => {
                const pct = Math.round((item.cantidad / (resumen.totalEquipos || 1)) * 100);
                const barPct = Math.round((item.cantidad / maxSedeCount) * 100);
                return (
                  <div key={idx} className="sede-bar-row">
                    <div className="sede-bar-info">
                      <span className="sede-name" title={item.sede}>
                        <BuildingIcon size={13} color="#64748b" />
                        {item.sede}
                      </span>
                      <span className="sede-badge">{item.cantidad} ({pct}%)</span>
                    </div>
                    <div className="sede-bar-track">
                      <div className="sede-bar-fill" style={{ width: `${barPct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 3. Grid Dividido: Ecosistema Tecnológico + Feed de Actividades */}
      <div className="dashboard-split-grid" style={{ marginTop: '22px' }}>
        {/* Ecosistema de TI con pestañas dinámicas */}
        <div className="content-panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div>
              <h2>Ecosistema de TI</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Desglose por especificación</span>
            </div>
            <div className="tab-pills-bar">
              <button
                type="button"
                className={`tab-pill-btn ${tabDistribucion === 'marcas' ? 'active' : ''}`}
                onClick={() => setTabDistribucion('marcas')}
              >
                🏷️ Marcas
              </button>
              <button
                type="button"
                className={`tab-pill-btn ${tabDistribucion === 'tipos' ? 'active' : ''}`}
                onClick={() => setTabDistribucion('tipos')}
              >
                💻 Tipos
              </button>
              <button
                type="button"
                className={`tab-pill-btn ${tabDistribucion === 'so' ? 'active' : ''}`}
                onClick={() => setTabDistribucion('so')}
              >
                💿 Sist. Op.
              </button>
            </div>
          </div>

          <div className="ecosystem-list">
            {ecosystemData.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '12.5px', textAlign: 'center', padding: '30px 0' }}>
                Sin datos registrados en esta categoría
              </div>
            ) : (
              ecosystemData.map((d, i) => {
                const pctTotal = Math.round((d.cantidad / (resumen.totalEquipos || 1)) * 100);
                const barPct = Math.round((d.cantidad / maxEcosystemCount) * 100);
                return (
                  <div key={i} className="ecosystem-row">
                    <div className="ecosystem-row-info">
                      <span className="ecosystem-name" title={d.label}>{d.label}</span>
                      <span className="ecosystem-stat">
                        {d.cantidad} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({pctTotal}%)</span>
                      </span>
                    </div>
                    <div className="ecosystem-track">
                      <div className={`ecosystem-fill ${d.type}`} style={{ width: `${barPct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Últimas Actividades (Timeline) */}
        <div className="content-panel" style={{ marginBottom: 0 }}>
          <div className="panel-header">
            <div>
              <h2>Últimas Actividades</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Trazabilidad en tiempo real</span>
            </div>
            <button
              style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '12.5px', fontWeight: 600 }}
              onClick={() => onNavigate && onNavigate('control-cambios')}
            >
              Ver todas →
            </button>
          </div>

          <div className="activity-list">
            {eventos.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '20px', textAlign: 'center' }}>
                No hay actividades registradas recientemente.
              </div>
            ) : (
              eventos.slice(0, 6).map((ev) => (
                <div key={ev.id} className="activity-row">
                  <div className={getEventBadgeClass(ev.tipo_evento)}>
                    {getEventIcon(ev.tipo_evento)}
                  </div>
                  <div className="activity-detail">
                    <div className="activity-desc">
                      <b>{ev.equipo_placa ? `[${ev.equipo_placa}] ` : ''}</b>
                      {ev.descripcion}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                      <span className="activity-author-tag">
                        👤 {ev.usuario_nombre || 'Administrador TI / Sistema'}
                      </span>
                      <span className="activity-time">
                        🕒 {timeAgo(ev.fecha_evento)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
