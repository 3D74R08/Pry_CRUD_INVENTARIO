import React, { useEffect, useState } from 'react';
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
} from '../components/Icons';

export default function Dashboard({ onNavigate }) {
  const { user, isAdmin, canManageInventory } = useAuth();
  const [metricas, setMetricas] = useState({
    resumen: { totalEquipos: 0, usuariosActivos: 0, tareasEnProceso: 0, tareasCompletadas: 0 },
    porTipo: [],
    porEstado: [],
    porSede: [],
  });
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [metRes, evRes] = await Promise.all([
          api.getMetricasDashboard().catch(() => ({
            resumen: { totalEquipos: 0, usuariosActivos: 0, tareasEnProceso: 0, tareasCompletadas: 0 },
            porTipo: [],
          })),
          api.getEventosRecientes().catch(() => ({ eventos: [] })),
        ]);
        setMetricas(metRes);
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

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando métricas ejecutivas...</div>;
  }

  const { resumen, porTipo } = metricas;
  const total = resumen.totalEquipos || 1;

  // Paleta de colores para el Donut
  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

  // Calcular arcos para el Donut SVG
  let currentAngle = 0;
  const slices = porTipo.slice(0, 5).map((item, idx) => {
    const pct = item.cantidad / total;
    const strokeDasharray = `${pct * 283} 283`;
    const strokeDashoffset = -currentAngle * 283;
    currentAngle += pct;
    return {
      ...item,
      color: COLORS[idx % COLORS.length],
      dasharray: strokeDasharray,
      dashoffset: strokeDashoffset,
      pct: Math.round(pct * 100),
    };
  });

  return (
    <div>
      {/* 1. Cuadrícula de KPIs Principales (Panel 2) */}
      <div className="kpi-grid">
        <div className="kpi-card" onClick={() => onNavigate && onNavigate('equipos')} style={{ cursor: 'pointer' }}>
          <div className="kpi-info">
            <div className="kpi-label">Total de Equipos</div>
            <div className="kpi-value">{resumen.totalEquipos}</div>
          </div>
          <div className="kpi-icon-wrap blue"><LaptopIcon size={24} /></div>
        </div>

        <div className="kpi-card" onClick={() => onNavigate && onNavigate('usuarios')} style={{ cursor: 'pointer' }}>
          <div className="kpi-info">
            <div className="kpi-label">Usuarios Activos</div>
            <div className="kpi-value">{resumen.usuariosActivos}</div>
          </div>
          <div className="kpi-icon-wrap green"><UsersIcon size={24} /></div>
        </div>

        <div className="kpi-card" onClick={() => onNavigate && onNavigate('tareas')} style={{ cursor: 'pointer' }}>
          <div className="kpi-info">
            <div className="kpi-label">Tareas en Proceso</div>
            <div className="kpi-value">{resumen.tareasEnProceso}</div>
          </div>
          <div className="kpi-icon-wrap amber"><ClockIcon size={24} /></div>
        </div>

        <div className="kpi-card" onClick={() => onNavigate && onNavigate('tareas')} style={{ cursor: 'pointer' }}>
          <div className="kpi-info">
            <div className="kpi-label">Tareas Completadas</div>
            <div className="kpi-value">{resumen.tareasCompletadas}</div>
          </div>
          <div className="kpi-icon-wrap purple"><CheckIcon size={24} /></div>
        </div>
      </div>

      {/* 2. Cuadrícula Dividida: Gráfico Donut de Equipos + Feed de Actividad */}
      <div className="dashboard-split-grid">
        {/* Donut Chart: Equipos por tipo */}
        <div className="content-panel">
          <div className="panel-header">
            <h2>Equipos por Tipo</h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Distribución en inventario</span>
          </div>

          <div className="donut-chart-container">
            <div className="donut-svg-wrap">
              <svg width="140" height="140" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="45" fill="transparent" stroke="#f1f5f9" strokeWidth="10" />
                {slices.map((s, i) => (
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
                <div className="donut-center-num">{resumen.totalEquipos}</div>
                <div className="donut-center-label">Equipos</div>
              </div>
            </div>

            <div className="donut-legend">
              {slices.map((s, i) => (
                <div key={i} className="donut-legend-item">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="legend-color-dot" style={{ background: s.color }} />
                    <span style={{ fontWeight: 600 }}>{s.tipo}</span>
                  </div>
                  <div>
                    <b>{s.cantidad}</b> <span style={{ color: 'var(--text-muted)' }}>({s.pct}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Últimas Actividades (Timeline) */}
        <div className="content-panel">
          <div className="panel-header">
            <h2>Últimas Actividades</h2>
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
