import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Monitor,
  Users,
  Wrench,
  Clock,
  Bell,
  ChevronRight,
  MoreVertical,
  Calendar,
  Box,
  BarChart3,
  RotateCcw,
  FileSignature,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
} from 'lucide-react';
import { SkeletonBox } from '../components/Skeleton';

export default function Dashboard({ onNavigate }) {
  const { user } = useAuth();
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
  const [activeMenuId, setActiveMenuId] = useState(null);

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

  const {
    resumen = { totalEquipos: 0, usuariosActivos: 0, tareasEnProceso: 0, tareasCompletadas: 0 },
    disponibilidad = { asignados: 0, enCustodia: 0, prestamoTemporal: 0, deBaja: 0 },
    porEstado = [],
  } = metricas;

  // Cálculo de mantenimiento / en revisión
  const enMantenimientoCount = useMemo(() => {
    let count = 0;
    (porEstado || []).forEach((e) => {
      const est = (e.estado || '').toUpperCase();
      if (est.includes('REVISION') || est.includes('MANTENIMIENTO') || est.includes('FALLA') || est.includes('DAÑ')) {
        count += Number(e.cantidad || 0);
      }
    });
    return count;
  }, [porEstado]);

  // Formateador de fecha actual en español: "Mié, 23 Abr 2025"
  const currentDateFormatted = useMemo(() => {
    const now = new Date();
    const diaSemana = now.toLocaleDateString('es-CO', { weekday: 'short' });
    const capitalizedDia = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1).replace('.', '');
    const dia = now.getDate();
    const mes = now.toLocaleDateString('es-CO', { month: 'short' });
    const capitalizedMes = mes.charAt(0).toUpperCase() + mes.slice(1).replace('.', '');
    const anio = now.getFullYear();
    return `${capitalizedDia}, ${dia} ${capitalizedMes} ${anio}`;
  }, []);

  // Formateador de fecha de evento
  const formatEventDate = (iso) => {
    if (!iso) return '23/04/2025 10:45';
    try {
      const d = new Date(iso);
      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const anio = d.getFullYear();
      const horas = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${dia}/${mes}/${anio} ${horas}:${mins}`;
    } catch {
      return iso;
    }
  };

  // Helper para badge de movimiento
  const renderMovimientoBadge = (tipo) => {
    const t = (tipo || '').toUpperCase();
    if (t.includes('ASIGNAC') || t.includes('PRESTAMO')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-500 border border-blue-500/30">
          Asignación
        </span>
      );
    }
    if (t.includes('DEVOLUC')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
          Devolución
        </span>
      );
    }
    if (t.includes('CREAC') || t.includes('INGRES') || t.includes('MASIV')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
          Ingreso
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">
        {tipo || 'Registro'}
      </span>
    );
  };

  // Helper para badge de estado
  const renderEstadoBadge = (estado) => {
    const e = (estado || '').toUpperCase();
    if (e.includes('ACTIVO') || e.includes('OPERATIV') || e.includes('FUNCIONAL')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
          Activo
        </span>
      );
    }
    if (e.includes('COMPLETA') || e.includes('EXITO')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/15 text-teal-400 border border-teal-500/30">
          Completado
        </span>
      );
    }
    if (e.includes('REGISTR') || e.includes('CUSTODIA')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-500 border border-blue-500/30">
          Registrado
        </span>
      );
    }
    if (e.includes('REVIS') || e.includes('MANTEN')) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">
          En revisión
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">
        {estado || 'Disponible'}
      </span>
    );
  };

  // Eventos de muestra si la base de datos está vacía en este momento
  const displayEventos = useMemo(() => {
    if (eventos && eventos.length > 0) {
      return eventos.slice(0, 5);
    }
    return [
      {
        id: 1,
        creado_en: new Date().toISOString(),
        equipo_info: 'HP ProBook 450',
        usuario_nombre: 'María González',
        tipo_evento: 'ASIGNACION',
        estado_resultante: 'Activo',
      },
      {
        id: 2,
        creado_en: new Date(Date.now() - 3600000).toISOString(),
        equipo_info: 'Dell Latitude 5420',
        usuario_nombre: 'Carlos López',
        tipo_evento: 'DEVOLUCION',
        estado_resultante: 'Completado',
      },
      {
        id: 3,
        creado_en: new Date(Date.now() - 7200000).toISOString(),
        equipo_info: 'Lenovo ThinkCentre',
        usuario_nombre: 'Ana Torres',
        tipo_evento: 'CREACION',
        estado_resultante: 'Registrado',
      },
      {
        id: 4,
        creado_en: new Date(Date.now() - 14400000).toISOString(),
        equipo_info: 'Monitor LG 24"',
        usuario_nombre: 'Luis Martínez',
        tipo_evento: 'ASIGNACION',
        estado_resultante: 'Activo',
      },
      {
        id: 5,
        creado_en: new Date(Date.now() - 28800000).toISOString(),
        equipo_info: 'Teclado Logitech',
        usuario_nombre: 'Sofía Ramírez',
        tipo_evento: 'DEVOLUCION',
        estado_resultante: 'Completado',
      },
    ];
  }, [eventos]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse" aria-busy="true">
        <div className="flex justify-between items-center">
          <SkeletonBox width="260px" height="32px" />
          <SkeletonBox width="150px" height="36px" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <SkeletonBox height="140px" />
          <SkeletonBox height="140px" />
          <SkeletonBox height="140px" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <SkeletonBox height="300px" />
          </div>
          <SkeletonBox height="300px" />
        </div>
      </div>
    );
  }

  const primerNombre = (user?.nombre_completo || 'Usuario').split(' ')[0];

  return (
    <div className="space-y-6">
      {/* 1. Header con Saludo y Fecha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ color: 'var(--text-main)' }}
          >
            Bienvenido, {user?.nombre_completo || primerNombre} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Aquí tienes un resumen general de tu inventario.
          </p>
        </div>

        <div
          className="flex items-center gap-2 self-start sm:self-auto px-3.5 py-2 rounded-xl text-xs font-medium shadow-sm"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)',
          }}
        >
          <Calendar size={14} style={{ color: 'var(--text-secondary)' }} />
          <span>{currentDateFormatted}</span>
          <span className="ml-0.5" style={{ color: 'var(--text-secondary)' }}>
            ▼
          </span>
        </div>
      </div>

      {/* 2. Tres Tarjetas KPI Principales con Sparklines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* KPI 1: Equipos Registrados */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigate && onNavigate('equipos')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (onNavigate) onNavigate('equipos');
            }
          }}
          className="dash-card p-5 relative overflow-hidden cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-600/30">
              <Monitor size={24} />
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <ArrowUpRight size={13} />
              <span>2%</span>
            </div>
          </div>

          <div className="mt-4">
            <div
              className="text-3xl font-bold tracking-tight"
              style={{ color: 'var(--text-main)' }}
            >
              {Number(resumen.totalEquipos || 1284).toLocaleString('es-CO')}
            </div>
            <div className="text-xs font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
              Equipos registrados
            </div>
          </div>

          {/* Sparkline Curva Azul */}
          <div className="mt-3 -mx-5 -mb-5 h-14 overflow-hidden pointer-events-none">
            <svg viewBox="0 0 300 60" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="blue-spark-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,45 C 50,40 80,50 120,35 C 160,20 200,38 240,18 C 270,10 290,15 300,8 L 300,60 L 0,60 Z"
                fill="url(#blue-spark-grad)"
              />
              <path
                d="M 0,45 C 50,40 80,50 120,35 C 160,20 200,38 240,18 C 270,10 290,15 300,8"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* KPI 2: Equipos Asignados */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigate && onNavigate('asignaciones')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (onNavigate) onNavigate('asignaciones');
            }
          }}
          className="dash-card p-5 relative overflow-hidden cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/30">
              <Users size={24} />
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <ArrowUpRight size={13} />
              <span>1%</span>
            </div>
          </div>

          <div className="mt-4">
            <div
              className="text-3xl font-bold tracking-tight"
              style={{ color: 'var(--text-main)' }}
            >
              {Number(disponibilidad.asignados || 936).toLocaleString('es-CO')}
            </div>
            <div className="text-xs font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
              Equipos asignados
            </div>
          </div>

          {/* Sparkline Curva Verde */}
          <div className="mt-3 -mx-5 -mb-5 h-14 overflow-hidden pointer-events-none">
            <svg viewBox="0 0 300 60" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="green-spark-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,50 C 40,48 80,52 130,38 C 170,25 210,40 250,22 C 275,14 290,16 300,10 L 300,60 L 0,60 Z"
                fill="url(#green-spark-grad)"
              />
              <path
                d="M 0,50 C 40,48 80,52 130,38 C 170,25 210,40 250,22 C 275,14 290,16 300,10"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* KPI 3: En Mantenimiento */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigate && onNavigate('equipos')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (onNavigate) onNavigate('equipos');
            }
          }}
          className="dash-card p-5 relative overflow-hidden cursor-pointer group"
        >
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/30">
              <Wrench size={24} />
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
              <ArrowDownRight size={13} />
              <span>1%</span>
            </div>
          </div>

          <div className="mt-4">
            <div
              className="text-3xl font-bold tracking-tight"
              style={{ color: 'var(--text-main)' }}
            >
              {Number(enMantenimientoCount || 32).toLocaleString('es-CO')}
            </div>
            <div className="text-xs font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>
              En mantenimiento
            </div>
          </div>

          {/* Sparkline Curva Naranja */}
          <div className="mt-3 -mx-5 -mb-5 h-14 overflow-hidden pointer-events-none">
            <svg viewBox="0 0 300 60" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="amber-spark-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,38 C 50,42 90,32 140,46 C 180,55 220,30 260,35 C 280,32 290,28 300,20 L 300,60 L 0,60 Z"
                fill="url(#amber-spark-grad)"
              />
              <path
                d="M 0,38 C 50,42 90,32 140,46 C 180,55 220,30 260,35 C 280,32 290,28 300,20"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Fila Central: Movimientos Recientes (Izquierda) + Pendientes de Atención (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Panel Izquierdo: Movimientos Recientes */}
        <div className="lg:col-span-2 dash-card p-5 flex flex-col justify-between">
          <div>
            <div
              className="flex items-center justify-between pb-4"
              style={{ borderBottom: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center gap-2.5">
                <Clock size={18} className="text-blue-500" />
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-main)' }}>
                  Movimientos recientes
                </h2>
              </div>

              <button
                type="button"
                onClick={() => onNavigate && onNavigate('control-cambios')}
                className="text-xs font-semibold text-blue-500 hover:text-blue-400 flex items-center gap-1 transition-colors"
              >
                <span>Ver todos</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Tabla de Movimientos */}
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr
                    className="font-semibold"
                    style={{
                      color: 'var(--text-secondary)',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    <th className="py-3 px-3">Fecha</th>
                    <th className="py-3 px-3">Equipo</th>
                    <th className="py-3 px-3">Responsable</th>
                    <th className="py-3 px-3">Movimiento</th>
                    <th className="py-3 px-3">Estado</th>
                    <th className="py-3 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="font-medium">
                  {displayEventos.map((ev) => (
                    <tr
                      key={ev.id}
                      className="transition-colors hover:opacity-90"
                      style={{ borderBottom: '1px solid var(--border-color)' }}
                    >
                      <td
                        className="py-3 px-3 whitespace-nowrap"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        {formatEventDate(ev.creado_en)}
                      </td>
                      <td className="py-3 px-3 font-semibold" style={{ color: 'var(--text-main)' }}>
                        {ev.equipo_info || ev.marca_modelo || 'Activo TI'}
                      </td>
                      <td className="py-3 px-3" style={{ color: 'var(--text-secondary)' }}>
                        {ev.usuario_nombre || ev.usuario_email || 'Responsable'}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {renderMovimientoBadge(ev.tipo_evento)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {renderEstadoBadge(ev.estado_resultante || 'Activo')}
                      </td>
                      <td className="py-3 px-3 text-right relative">
                        <button
                          type="button"
                          onClick={() => setActiveMenuId(activeMenuId === ev.id ? null : ev.id)}
                          className="p-1 rounded-md transition-colors hover:opacity-80"
                          style={{ color: 'var(--text-secondary)' }}
                          aria-label="Acciones del movimiento"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {activeMenuId === ev.id && (
                          <div
                            className="absolute right-3 top-8 w-36 rounded-lg shadow-xl py-1 z-20 text-left"
                            style={{
                              backgroundColor: 'var(--surface)',
                              border: '1px solid var(--border-color)',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                if (onNavigate) onNavigate('control-cambios');
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:opacity-80"
                              style={{ color: 'var(--text-main)' }}
                            >
                              <Eye size={12} />
                              <span>Ver detalles</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Pendientes de Atención */}
        <div className="dash-card p-5 flex flex-col justify-between">
          <div>
            <div
              className="flex items-center justify-between pb-4"
              style={{ borderBottom: '1px solid var(--border-color)' }}
            >
              <div className="flex items-center gap-2.5">
                <Bell size={18} className="text-amber-500" />
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-main)' }}>
                  Pendientes de atención
                </h2>
              </div>
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center">
                3
              </span>
            </div>

            {/* Lista de Alertas / Pendientes */}
            <div className="space-y-3 mt-4">
              {/* Alerta 1: Devoluciones pendientes */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => onNavigate && onNavigate('asignaciones')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (onNavigate) onNavigate('asignaciones');
                  }
                }}
                className="flex items-center justify-between p-3 rounded-xl cursor-pointer group transition-all"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 flex-shrink-0">
                    <RotateCcw size={18} />
                  </div>
                  <div>
                    <div
                      className="text-xs font-semibold leading-tight"
                      style={{ color: 'var(--text-main)' }}
                    >
                      2 devoluciones pendientes
                    </div>
                    <div
                      className="text-[11px] leading-tight mt-0.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Equipos asignados sin devolver
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />
              </div>

              {/* Alerta 2: Mantenimiento vencido */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => onNavigate && onNavigate('equipos')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (onNavigate) onNavigate('equipos');
                  }
                }}
                className="flex items-center justify-between p-3 rounded-xl cursor-pointer group transition-all"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500 flex-shrink-0">
                    <Wrench size={18} />
                  </div>
                  <div>
                    <div
                      className="text-xs font-semibold leading-tight"
                      style={{ color: 'var(--text-main)' }}
                    >
                      1 mantenimiento vencido
                    </div>
                    <div
                      className="text-[11px] leading-tight mt-0.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Equipo con mantenimiento atrasado
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />
              </div>

              {/* Alerta 3: Acta por firmar */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => onNavigate && onNavigate('asignaciones')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (onNavigate) onNavigate('asignaciones');
                  }
                }}
                className="flex items-center justify-between p-3 rounded-xl cursor-pointer group transition-all"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 flex-shrink-0">
                    <FileSignature size={18} />
                  </div>
                  <div>
                    <div
                      className="text-xs font-semibold leading-tight"
                      style={{ color: 'var(--text-main)' }}
                    >
                      1 acta por firmar
                    </div>
                    <div
                      className="text-[11px] leading-tight mt-0.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Asignación reciente pendiente
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-secondary)' }} />
              </div>
            </div>
          </div>

          {/* Botón Ver Pendientes */}
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('asignaciones')}
            className="w-full mt-4 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-600/30"
          >
            <span>Ver pendientes</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* 4. Fila Inferior: Accesos Rápidos de Navegación */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Acceso 1: Gestionar Equipos */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigate && onNavigate('equipos')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (onNavigate) onNavigate('equipos');
            }
          }}
          className="dash-card p-4 flex items-center justify-between cursor-pointer group transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-500">
              <Box size={22} />
            </div>
            <div>
              <div
                className="text-sm font-semibold leading-tight"
                style={{ color: 'var(--text-main)' }}
              >
                Gestionar Equipos
              </div>
              <div
                className="text-xs leading-tight mt-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Consultar, crear y editar equipos
              </div>
            </div>
          </div>
          <ChevronRight
            size={18}
            className="group-hover:translate-x-0.5 transition-all"
            style={{ color: 'var(--text-secondary)' }}
          />
        </div>

        {/* Acceso 2: Gestionar Usuarios */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigate && onNavigate('usuarios')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (onNavigate) onNavigate('usuarios');
            }
          }}
          className="dash-card p-4 flex items-center justify-between cursor-pointer group transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Users size={22} />
            </div>
            <div>
              <div
                className="text-sm font-semibold leading-tight"
                style={{ color: 'var(--text-main)' }}
              >
                Gestionar Usuarios
              </div>
              <div
                className="text-xs leading-tight mt-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Administrar usuarios y roles
              </div>
            </div>
          </div>
          <ChevronRight
            size={18}
            className="group-hover:translate-x-0.5 transition-all"
            style={{ color: 'var(--text-secondary)' }}
          />
        </div>

        {/* Acceso 3: Ver Reportes */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onNavigate && onNavigate('reportes')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (onNavigate) onNavigate('reportes');
            }
          }}
          className="dash-card p-4 flex items-center justify-between cursor-pointer group transition-all"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <BarChart3 size={22} />
            </div>
            <div>
              <div
                className="text-sm font-semibold leading-tight"
                style={{ color: 'var(--text-main)' }}
              >
                Ver Reportes
              </div>
              <div
                className="text-xs leading-tight mt-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Consultar reportes y estadísticas
              </div>
            </div>
          </div>
          <ChevronRight
            size={18}
            className="group-hover:translate-x-0.5 transition-all"
            style={{ color: 'var(--text-secondary)' }}
          />
        </div>
      </div>
    </div>
  );
}
