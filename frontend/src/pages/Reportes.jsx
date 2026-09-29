import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { DownloadIcon, LaptopIcon, BuildingIcon, ActivityIcon } from '../components/Icons';

export default function Reportes() {
  const [tabActivo, setTabActivo] = useState('inventario');
  const [metricas, setMetricas] = useState(null);
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoading(true);
        const [dataMetricas, dataEquipos] = await Promise.all([
          api.getMetricasDashboard().catch(() => null),
          api.getEquipos({ limit: 500 }).catch(() => ({ equipos: [] })),
        ]);
        setMetricas(dataMetricas);
        setEquipos(dataEquipos.equipos || []);
      } catch (err) {
        console.error('Error al cargar datos de reportes:', err);
      } finally {
        setLoading(false);
      }
    }
    cargarDatos();
  }, []);

  // Exportar a CSV
  const handleExportarCSV = () => {
    if (!equipos || equipos.length === 0) {
      alert('No hay datos disponibles para exportar');
      return;
    }

    const headers = [
      'Placa',
      'Nombre_Equipo',
      'Tipo',
      'Marca',
      'Modelo',
      'Serial',
      'Estado',
      'Sede',
      'Area',
      'Cedula_Responsable',
      'Responsable',
      'Procesador',
      'RAM',
      'Almacenamiento',
      'Sistema_Operativo',
      'Observaciones',
    ];

    const rows = equipos.map((eq) => [
      `"${eq.placa || ''}"`,
      `"${eq.nombre_equipo || ''}"`,
      `"${eq.tipo || ''}"`,
      `"${eq.marca || ''}"`,
      `"${eq.modelo || ''}"`,
      `"${eq.serial || ''}"`,
      `"${eq.estado || ''}"`,
      `"${eq.sede || ''}"`,
      `"${eq.area || ''}"`,
      `"${eq.cedula_responsable || ''}"`,
      `"${eq.responsable_nombre || ''}"`,
      `"${eq.procesador || ''}"`,
      `"${eq.ram || ''}"`,
      `"${eq.almacenamiento || ''}"`,
      `"${eq.sistema_operativo || ''}"`,
      `"${(eq.observaciones || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_activos_ti_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const maxSedeCount = metricas?.porSede ? Math.max(...metricas.porSede.map((s) => s.cantidad), 1) : 1;

  return (
    <div>
      {/* Header con botón de exportación */}
      <div className="card-header" style={{ marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Centro de Reportes y Analítica</h2>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Consolidado gerencial de infraestructura de hardware, asignaciones y sedes
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleExportarCSV} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <DownloadIcon size={14} /> Exportar Inventario Completo (CSV)
        </button>
      </div>

      {/* Pestañas de Reporte */}
      <div className="tab-bar-container" style={{ marginBottom: '20px' }}>
        <button
          className={`tab-btn ${tabActivo === 'inventario' ? 'active' : ''}`}
          onClick={() => setTabActivo('inventario')}
        >
          <LaptopIcon size={14} /> Inventario por Tipos
        </button>
        <button
          className={`tab-btn ${tabActivo === 'sedes' ? 'active' : ''}`}
          onClick={() => setTabActivo('sedes')}
        >
          <BuildingIcon size={14} /> Distribución por Sede
        </button>
        <button
          className={`tab-btn ${tabActivo === 'estados' ? 'active' : ''}`}
          onClick={() => setTabActivo('estados')}
        >
          <ActivityIcon size={14} /> Salud y Estados
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Calculando métricas agregadas...</div>
      ) : (
        <>
          {/* Pestaña: Inventario por Tipo */}
          {tabActivo === 'inventario' && (
            <div className="reportes-two-col-grid">
              <div className="card">
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>
                  Resumen por Categoría de Hardware
                </h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Categoría / Tipo</th>
                        <th style={{ textAlign: 'right' }}>Equipos</th>
                        <th style={{ textAlign: 'right' }}>% del Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metricas?.porTipo?.map((item) => {
                        const total = metricas.resumen.totalEquipos || 1;
                        const pct = ((item.cantidad / total) * 100).toFixed(1);
                        return (
                          <tr key={item.tipo}>
                            <td>
                              <b>{item.tipo}</b>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{item.cantidad}</td>
                            <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{pct}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>
                  Resumen Ejecutivo
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total Activos Registrados:</span>
                    <b style={{ fontSize: '16px' }}>{metricas?.resumen.totalEquipos || 0}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Usuarios Activos en Sistema:</span>
                    <b style={{ fontSize: '16px', color: 'var(--accent)' }}>{metricas?.resumen.usuariosActivos || 0}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Cargas Masivas Procesadas:</span>
                    <b style={{ fontSize: '16px', color: 'var(--primary)' }}>{metricas?.resumen.tareasCompletadas || 0}</b>
                  </div>
                </div>

                <div className="devsecops-audit-box">
                  <div className="audit-title">Auditoría DevSecOps:</div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Todos los movimientos físicos y lógicos de los activos generan firmas inmutables en la tabla de auditoría, garantizando trazabilidad ante revisiones contables y de seguridad.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pestaña: Distribución por Sede (Bar Chart Panel 9) */}
          {tabActivo === 'sedes' && (
            <div className="card">
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px' }}>
                Volumen de Equipos por Sede Institucional
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '700px' }}>
                {metricas?.porSede?.map((s) => {
                  const pct = Math.round((s.cantidad / maxSedeCount) * 100);
                  return (
                    <div className="report-bar-row" key={s.sede}>
                      <div className="report-bar-label" title={s.sede}>
                        {s.sede}
                      </div>
                      <div className="report-bar-track">
                        <div className="report-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="report-bar-num">{s.cantidad}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pestaña: Salud y Estados */}
          {tabActivo === 'estados' && (
            <div className="reportes-two-col-grid">
              <div className="card">
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>
                  Estado Operativo del Hardware
                </h3>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Estado</th>
                        <th style={{ textAlign: 'right' }}>Equipos</th>
                        <th style={{ textAlign: 'right' }}>Porcentaje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metricas?.porEstado?.map((item) => {
                        const total = metricas.resumen.totalEquipos || 1;
                        const pct = ((item.cantidad / total) * 100).toFixed(1);
                        return (
                          <tr key={item.estado}>
                            <td>
                              <span
                                className={`badge ${
                                  item.estado === 'FUNCIONAL'
                                    ? 'badge-funcional'
                                    : item.estado === 'REVISAR'
                                    ? 'badge-revisar'
                                    : item.estado === 'DAÑADO'
                                    ? 'badge-danado'
                                    : 'badge-baja'
                                }`}
                              >
                                {item.estado}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }}>{item.cantidad}</td>
                            <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{pct}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>
                  Directrices de Mantenimiento
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                  <div style={{ padding: '10px', background: 'var(--accent-light)', borderRadius: '6px', color: '#065f46' }}>
                    <b>Equipos Funcionales:</b> Disponibles para asignación directa o en operación normal sin incidencias activas.
                  </div>
                  <div style={{ padding: '10px', background: 'var(--warning-light)', borderRadius: '6px', color: '#92400e' }}>
                    <b>Equipos a Revisar:</b> Reportados por empleados o pendientes de mantenimiento preventivo semestral.
                  </div>
                  <div style={{ padding: '10px', background: 'var(--danger-light)', borderRadius: '6px', color: '#991b1b' }}>
                    <b>Equipos Dañados / Bajas:</b> Activos desincorporados del inventario activo por obsolescencia o daño irreparable.
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
