import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function CargaMasiva({ onNavigate }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tareaActiva, setTareaActiva] = useState(null);
  const [historialTareas, setHistorialTareas] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Stepper state: 1 = Subir archivo, 2 = Procesando en Worker, 3 = Resultado
  const getPasoActual = () => {
    if (!tareaActiva) return 1;
    if (['PENDIENTE', 'EN_PROCESO'].includes(tareaActiva.estado)) return 2;
    if (['COMPLETADO', 'FALLIDO'].includes(tareaActiva.estado)) return 3;
    return 1;
  };

  const pasoActual = getPasoActual();

  const cargarHistorial = async () => {
    try {
      const data = await api.getTareas();
      setHistorialTareas(data.tareas || []);
    } catch (err) {
      console.error('Error al cargar historial de tareas:', err);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  // Polling del estado de la tarea activa mientras esté PENDIENTE o EN_PROCESO
  useEffect(() => {
    if (!tareaActiva || ['COMPLETADO', 'FALLIDO'].includes(tareaActiva.estado)) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const data = await api.getTareaById(tareaActiva.id);
        setTareaActiva(data.tarea);

        if (data.tarea.estado === 'COMPLETADO') {
          setMensaje('¡Carga masiva procesada exitosamente por el Worker asíncrono!');
          cargarHistorial();
        } else if (data.tarea.estado === 'FALLIDO') {
          setError('El Worker reportó un fallo: ' + (data.tarea.error_mensaje || 'Error desconocido'));
          cargarHistorial();
        }
      } catch (err) {
        console.error('Error en sondeo de tarea:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [tareaActiva]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setMensaje('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError('');
      setMensaje('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Por favor selecciona o arrastra un archivo CSV o Excel.');
      return;
    }

    setLoading(true);
    setError('');
    setMensaje('');

    try {
      const formData = new FormData();
      formData.append('archivo', file);
      formData.append('modo', 'append');

      // Respuesta instantánea HTTP 202 Accepted
      const res = await api.subirCargaMasiva(formData);
      setMensaje(res.message || 'Archivo recibido y encolado en segundo plano');
      setTareaActiva({
        id: res.tareaId,
        estado: res.estado || 'PENDIENTE',
        archivo_nombre: res.archivo || file.name,
      });
      setFile(null);
      cargarHistorial();
    } catch (err) {
      setError(err.message || 'Error al enviar archivo al servidor');
    } finally {
      setLoading(false);
    }
  };

  const [descargandoPlantilla, setDescargandoPlantilla] = useState(false);

  const handleDescargarPlantillaOficial = async () => {
    setDescargandoPlantilla(true);
    try {
      await api.descargarPlantilla();
    } catch (err) {
      setError('No se pudo descargar la plantilla oficial: ' + (err.message || 'Error del servidor'));
    } finally {
      setDescargandoPlantilla(false);
    }
  };

  const handleDescargarPlantilla = () => {
    const headers = 'Placa,NombreEquipo,Tipo,Marca,Modelo,Serial,Procesador,RAM,Almacenamiento,SistemaOperativo,Estado,Sede,Area,Cedula,Responsable,Observaciones\n';
    const sample1 = 'EQ-2026-101,LAP-DEV-01,Laptop,Lenovo,ThinkPad T14,SN-LN9871,Intel Core i7,16GB,512GB SSD,Windows 11 Pro,FUNCIONAL,Sede Central,Tecnologia,1001234567,Carlos Mendoza,Asignado a desarrollo\n';
    const sample2 = 'EQ-2026-102,IMP-PISO2-01,Impresora,Kyocera,ECOSYS M2040dn,SN-KC4412,,,Red LAN,,FUNCIONAL,Sede Norte,Operaciones,,,Impresora compartida\n';
    const blob = new Blob([headers + sample1 + sample2], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'plantilla_activos_inventario.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNuevaCarga = () => {
    setTareaActiva(null);
    setFile(null);
    setMensaje('');
    setError('');
  };

  return (
    <div>
      {/* Banner Explicativo Arquitectura Worker */}
      <div
        style={{
          background: 'linear-gradient(90deg, #eff6ff 0%, #f0fdf4 100%)',
          border: '1px solid #bfdbfe',
          borderRadius: 'var(--radius)',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>⚡</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#1e3a8a' }}>
              Procesamiento Asíncrono Desacoplado (DevSecOps)
            </div>
            <div style={{ fontSize: '12px', color: '#3b82f6' }}>
              La API responde inmediatamente con <b>HTTP 202 Accepted</b> y el Worker en segundo plano realiza validaciones y registros sin bloquear el servidor.
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={handleDescargarPlantillaOficial}
            disabled={descargandoPlantilla}
            title="Descargar libro maestro oficial FRMA-07 (.xltx) con todas las 9 hojas del inventario"
          >
            {descargandoPlantilla ? '⏳ Descargando...' : '📥 Descargar Plantilla Maestra (.xltx)'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleDescargarPlantilla}
            title="Descargar plantilla CSV simple"
          >
            📄 Plantilla CSV
          </button>
        </div>
      </div>

      {/* Stepper Visual de 3 Pasos (Panel 6) */}
      <div className="stepper-container">
        <div className={`stepper-item ${pasoActual === 1 ? 'active' : pasoActual > 1 ? 'completed' : ''}`}>
          <div className="stepper-circle">{pasoActual > 1 ? '✓' : '1'}</div>
          <span>1. Subir Archivo</span>
        </div>

        <div style={{ width: '40px', height: '2px', background: pasoActual > 1 ? 'var(--accent)' : 'var(--border)' }} />

        <div className={`stepper-item ${pasoActual === 2 ? 'active' : pasoActual > 2 ? 'completed' : ''}`}>
          <div className="stepper-circle">{pasoActual > 2 ? '✓' : '2'}</div>
          <span>2. Procesando en Worker</span>
        </div>

        <div style={{ width: '40px', height: '2px', background: pasoActual > 2 ? 'var(--accent)' : 'var(--border)' }} />

        <div className={`stepper-item ${pasoActual === 3 ? 'active' : ''}`}>
          <div className="stepper-circle">3</div>
          <span>3. Resultado & Verificación</span>
        </div>
      </div>

      {/* Mensajes de Notificación */}
      {mensaje && (
        <div
          style={{
            background: 'var(--accent-light)',
            color: '#065f46',
            padding: '12px 16px',
            borderRadius: 'var(--radius)',
            marginBottom: '16px',
            fontSize: '13.5px',
            fontWeight: 500,
            border: '1px solid #a7f3d0',
          }}
        >
          {mensaje}
        </div>
      )}

      {error && (
        <div
          style={{
            background: 'var(--danger-light)',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: 'var(--radius)',
            marginBottom: '16px',
            fontSize: '13.5px',
            fontWeight: 500,
            border: '1px solid #fecaca',
          }}
        >
          {error}
        </div>
      )}

      {/* Área Principal de Carga y Monitor */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Formulario de Subida con Drag & Drop */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>
            {pasoActual === 3 ? 'Subida Finalizada' : 'Seleccionar Archivo de Hardware'}
          </h3>

          {pasoActual === 3 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px' }}>
              <div style={{ fontSize: '42px', marginBottom: '10px' }}>🎉</div>
              <h4 style={{ fontSize: '16px', fontWeight: 700 }}>Procesamiento Finalizado</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '8px 0 20px 0' }}>
                Los registros válidos han sido incorporados en la base de datos PostgreSQL y auditados en el historial.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={handleNuevaCarga}>
                  + Cargar Otro Archivo
                </button>
                {onNavigate && (
                  <button className="btn btn-secondary" onClick={() => onNavigate('equipos')}>
                    💻 Ver Inventario General
                  </button>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div
                className={`dropzone-box ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput').click()}
              >
                <div className="dropzone-icon">📁</div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
                  {file ? file.name : 'Haz clic o arrastra un archivo CSV o Excel aquí'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Archivos soportados: <b>.xltx</b>, <b>.xlsx</b>, <b>.xls</b>, <b>.csv</b> (Hasta 20MB)
                </div>
                {file && (
                  <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--primary)', fontWeight: 600 }}>
                    Tamaño: {(file.size / 1024).toFixed(1)} KB · Listo para procesar
                  </div>
                )}
                <input
                  id="fileInput"
                  type="file"
                  accept=".csv, .xlsx, .xls, .xltx"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Modo: <b>Adición / Actualización inteligente</b>
                </span>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !file || pasoActual === 2}
                  style={{ minWidth: '180px', justifyContent: 'center' }}
                >
                  {loading ? 'Subiendo...' : pasoActual === 2 ? '⚙️ Worker Trabajando...' : '⚡ Iniciar Carga Masiva'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Monitor de Estado de Tarea Activa */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>
            Monitor de Tarea en Segundo Plano
          </h3>

          {!tareaActiva ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '30px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏱️</div>
              <div style={{ fontWeight: 600 }}>No hay tarea activa en este momento</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Al cargar un archivo, se activará el sondeo automático con el Worker de base de datos.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ID de Tarea:</span>
                <span className="placa-tag" style={{ fontSize: '11.5px' }}>{tareaActiva.id}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Archivo:</span>
                <span style={{ fontWeight: 600, fontSize: '13px' }}>{tareaActiva.archivo_nombre || 'N/A'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Estado Worker:</span>
                <span
                  className={`badge ${
                    tareaActiva.estado === 'COMPLETADO'
                      ? 'badge-funcional'
                      : tareaActiva.estado === 'FALLIDO'
                      ? 'badge-danado'
                      : 'badge-revisar'
                  }`}
                  style={{ fontSize: '12px', padding: '4px 10px' }}
                >
                  {tareaActiva.estado === 'PENDIENTE' && '⏳ PENDIENTE (En cola)'}
                  {tareaActiva.estado === 'EN_PROCESO' && '⚙️ PROCESANDO EN WORKER...'}
                  {tareaActiva.estado === 'COMPLETADO' && '✅ COMPLETADO'}
                  {tareaActiva.estado === 'FALLIDO' && '❌ FALLIDO'}
                </span>
              </div>

              {/* Tarjeta de Métricas de Resultados */}
              {tareaActiva.resultado && (
                <div
                  style={{
                    background: '#f8fafc',
                    padding: '14px',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
                    Resumen de Importación:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ background: '#fff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total leídos</div>
                      <div style={{ fontSize: '16px', fontWeight: 800 }}>{tareaActiva.resultado.totalLeidos || 0}</div>
                    </div>
                    <div style={{ background: '#fff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: 'var(--accent)' }}>Nuevos insertados</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent)' }}>
                        {tareaActiva.resultado.insertados || 0}
                      </div>
                    </div>
                    <div style={{ background: '#fff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: 'var(--primary)' }}>Actualizados</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--primary)' }}>
                        {tareaActiva.resultado.actualizados || 0}
                      </div>
                    </div>
                    <div style={{ background: '#fff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '11px', color: 'var(--danger)' }}>Fallidos / Omitidos</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--danger)' }}>
                        {tareaActiva.resultado.fallidos || 0}
                      </div>
                    </div>
                  </div>

                  {tareaActiva.resultado.errores && tareaActiva.resultado.errores.length > 0 && (
                    <div style={{ marginTop: '10px', color: 'var(--danger)', fontSize: '11.5px' }}>
                      <b>Errores detectados en filas:</b>
                      <ul style={{ paddingLeft: '16px', marginTop: '4px', maxHeight: '100px', overflowY: 'auto' }}>
                        {tareaActiva.resultado.errores.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Historial Reciente de Tareas de Worker */}
      <div className="card">
        <div className="card-header" style={{ marginBottom: '12px' }}>
          <div>
            <h3 className="card-title">Últimas Tareas Procesadas por el Worker</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Cola asíncrona registrada en la tabla <code>tareas_worker</code>
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={cargarHistorial}>
            🔄 Actualizar Historial
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha de Creación</th>
                <th>Tipo de Tarea</th>
                <th>Archivo</th>
                <th>Estado</th>
                <th>Registros</th>
                <th>Finalizado</th>
                <th>Solicitante</th>
              </tr>
            </thead>
            <tbody>
              {historialTareas.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No hay tareas en el historial.
                  </td>
                </tr>
              ) : (
                historialTareas.slice(0, 10).map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontSize: '12px' }}>{new Date(t.created_at).toLocaleString('es-CO')}</td>
                    <td><b>{t.tipo_tarea}</b></td>
                    <td>
                      <span className="placa-tag" style={{ fontSize: '11.5px' }}>
                        {t.archivo_nombre || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          t.estado === 'COMPLETADO'
                            ? 'badge-funcional'
                            : t.estado === 'FALLIDO'
                            ? 'badge-danado'
                            : 'badge-revisar'
                        }`}
                      >
                        {t.estado}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {t.resultado ? `${t.resultado.insertados || 0} nuevos / ${t.resultado.actualizados || 0} act.` : '—'}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {t.completed_at ? new Date(t.completed_at).toLocaleTimeString('es-CO') : 'En cola'}
                    </td>
                    <td style={{ fontSize: '12px' }}>{t.creado_por_nombre || 'Admin'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
