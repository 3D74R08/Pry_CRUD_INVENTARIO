import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api/client';
import {
  FileTextIcon,
  DownloadIcon,
  UploadCloudIcon,
  RotateCcwIcon,
  XIcon,
  CheckIcon,
  EditIcon,
} from './Icons';

export default function ModalFirmaActa({ isOpen, onClose, equipo, onDescargado }) {
  if (!isOpen || !equipo) return null;

  // Estados Entrega (TI)
  const [metodoEntrega, setMetodoEntrega] = useState('upload'); // 'upload' | 'draw'
  const [firmaEntregaImg, setFirmaEntregaImg] = useState('');
  const [recordarFirmaTI, setRecordarFirmaTI] = useState(true);
  const [isDrawingEntrega, setIsDrawingEntrega] = useState(false);
  const [hasDrawnEntrega, setHasDrawnEntrega] = useState(false);
  const canvasEntregaRef = useRef(null);

  // Estados Recibe (Colaborador)
  const [metodoRecibe, setMetodoRecibe] = useState('draw'); // 'draw' | 'upload'
  const [firmaRecibeImg, setFirmaRecibeImg] = useState('');
  const [isDrawingRecibe, setIsDrawingRecibe] = useState(false);
  const [hasDrawnRecibe, setHasDrawnRecibe] = useState(false);
  const canvasRecibeRef = useRef(null);

  // Estado general de envío
  const [descargando, setDescargando] = useState(false);
  const [error, setError] = useState('');

  // Cargar firma guardada en localStorage para TI si existe
  useEffect(() => {
    try {
      const guardada = localStorage.getItem('firma_ti_entrega_datauri');
      if (guardada) {
        setFirmaEntregaImg(guardada);
        setMetodoEntrega('upload');
      }
    } catch (e) {
      console.warn('No se pudo leer firma de localStorage:', e);
    }
  }, [isOpen]);

  // Manejador de subida de imagen para Entrega
  const handleFileEntregaChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido (PNG o JPG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const dataUri = loadEvt.target.result;
      setFirmaEntregaImg(dataUri);
      setError('');
      if (recordarFirmaTI) {
        try {
          localStorage.setItem('firma_ti_entrega_datauri', dataUri);
        } catch (err) {
          console.warn('Error guardando en localStorage:', err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Manejador de subida de imagen para Recibe
  const handleFileRecibeChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido (PNG o JPG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setFirmaRecibeImg(loadEvt.target.result);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  // Utilidad de cálculo de coordenadas para canvas táctil y ratón
  const getCanvasCoords = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Funciones canvas Entrega
  const startDrawingEntrega = (e) => {
    if (e.type === 'touchstart') e.preventDefault();
    const canvas = canvasEntregaRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const { x, y } = getCanvasCoords(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawingEntrega(true);
  };

  const drawEntrega = (e) => {
    if (!isDrawingEntrega) return;
    if (e.type === 'touchmove') e.preventDefault();
    const canvas = canvasEntregaRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoords(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawnEntrega(true);
  };

  const stopDrawingEntrega = () => {
    setIsDrawingEntrega(false);
  };

  const clearCanvasEntrega = () => {
    const canvas = canvasEntregaRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnEntrega(false);
  };

  // Funciones canvas Recibe
  const startDrawingRecibe = (e) => {
    if (e.type === 'touchstart') e.preventDefault();
    const canvas = canvasRecibeRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const { x, y } = getCanvasCoords(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawingRecibe(true);
  };

  const drawRecibe = (e) => {
    if (!isDrawingRecibe) return;
    if (e.type === 'touchmove') e.preventDefault();
    const canvas = canvasRecibeRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoords(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawnRecibe(true);
  };

  const stopDrawingRecibe = () => {
    setIsDrawingRecibe(false);
  };

  const clearCanvasRecibe = () => {
    const canvas = canvasRecibeRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnRecibe(false);
  };

  // Obtener data URI final de Entrega
  const getFirmaEntregaFinal = () => {
    if (metodoEntrega === 'upload') {
      return firmaEntregaImg || null;
    }
    if (metodoEntrega === 'draw' && hasDrawnEntrega && canvasEntregaRef.current) {
      return canvasEntregaRef.current.toDataURL('image/png');
    }
    return null;
  };

  // Obtener data URI final de Recibe
  const getFirmaRecibeFinal = () => {
    if (metodoRecibe === 'upload') {
      return firmaRecibeImg || null;
    }
    if (metodoRecibe === 'draw' && hasDrawnRecibe && canvasRecibeRef.current) {
      return canvasRecibeRef.current.toDataURL('image/png');
    }
    return null;
  };

  // Descargar con firmas
  const handleDescargarConFirmas = async () => {
    try {
      setDescargando(true);
      setError('');

      const firmaEntrega = getFirmaEntregaFinal();
      const firmaRecibe = getFirmaRecibeFinal();

      // Guardar firma de entrega si seleccionó recordar
      if (recordarFirmaTI && firmaEntrega) {
        try {
          localStorage.setItem('firma_ti_entrega_datauri', firmaEntrega);
        } catch (e) {
          console.warn('Error guardando firma TI:', e);
        }
      }

      await api.descargarActaEntrega(equipo.id, equipo.placa || equipo.codigo_interno, {
        firmaEntrega,
        firmaRecibe,
      });

      if (onDescargado) onDescargado();
      onClose();
    } catch (err) {
      console.error('Error al generar acta con firmas:', err);
      setError('Error al generar el documento: ' + err.message);
    } finally {
      setDescargando(false);
    }
  };

  // Descargar sin firmas (documento en blanco para firmar a mano)
  const handleDescargarSinFirmas = async () => {
    try {
      setDescargando(true);
      setError('');
      await api.descargarActaEntrega(equipo.id, equipo.placa || equipo.codigo_interno);
      if (onDescargado) onDescargado();
      onClose();
    } catch (err) {
      console.error('Error al descargar acta en blanco:', err);
      setError('Error al descargar: ' + err.message);
    } finally {
      setDescargando(false);
    }
  };

  const nombreRecibe =
    equipo.responsable_nombre ||
    equipo.solicitante ||
    equipo.recibido_por ||
    'Colaborador Asignado';

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '820px', width: '95%' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.12)',
                color: 'var(--primary-color, #0284c7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileTextIcon size={22} />
            </div>
            <div>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.15rem' }}>
                Acta de Entrega Oficial — Firmas Digitales
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Placa:{' '}
                <b className="placa-tag" style={{ marginRight: '6px' }}>
                  {equipo.placa || equipo.codigo_interno || 'S/P'}
                </b>
                · {equipo.marca} {equipo.modelo} ({equipo.tipo || 'Equipo'})
              </div>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose} title="Cerrar">
            <XIcon size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '20px' }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                marginBottom: '16px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid #ef4444',
                color: '#ef4444',
                fontSize: '13px',
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px',
            }}
          >
            {/* COLUMNA 1: QUIEN ENTREGA (TI) */}
            <div
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '16px',
                background: 'var(--card-bg, #ffffff)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      color: '#0284c7',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Entrega (TI)
                  </span>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>
                    Administrador TI
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    ZONAMEDICA MR SAS
                  </div>
                </div>

                {/* Tabs método Entrega */}
                <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-hover, #f1f5f9)', padding: '3px', borderRadius: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setMetodoEntrega('upload')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: metodoEntrega === 'upload' ? 600 : 400,
                      background: metodoEntrega === 'upload' ? '#0284c7' : 'transparent',
                      color: metodoEntrega === 'upload' ? '#ffffff' : 'var(--text-muted)',
                    }}
                  >
                    Subir Imagen
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodoEntrega('draw')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: metodoEntrega === 'draw' ? 600 : 400,
                      background: metodoEntrega === 'draw' ? '#0284c7' : 'transparent',
                      color: metodoEntrega === 'draw' ? '#ffffff' : 'var(--text-muted)',
                    }}
                  >
                    Dibujar
                  </button>
                </div>
              </div>

              {/* Contenedor Entrega: Subir Imagen */}
              {metodoEntrega === 'upload' ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  {firmaEntregaImg ? (
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          border: '1px dashed var(--border-color)',
                          borderRadius: '8px',
                          padding: '12px',
                          background: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '140px',
                        }}
                      >
                        <img
                          src={firmaEntregaImg}
                          alt="Firma Entrega"
                          style={{ maxHeight: '110px', maxWidth: '100%', objectFit: 'contain' }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckIcon size={14} /> Firma cargada
                        </span>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                          onClick={() => {
                            setFirmaEntregaImg('');
                            try {
                              localStorage.removeItem('firma_ti_entrega_datauri');
                            } catch (e) {}
                          }}
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label
                      style={{
                        border: '2px dashed var(--border-color)',
                        borderRadius: '8px',
                        padding: '24px 16px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: 'var(--bg-hover, #f8fafc)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '140px',
                      }}
                    >
                      <UploadCloudIcon size={28} color="#0284c7" />
                      <span style={{ fontSize: '12px', fontWeight: 600, marginTop: '8px', color: 'var(--text-main)' }}>
                        Selecciona o arrastra la imagen de tu firma
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        PNG o JPG (fondo transparente recomendado)
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        style={{ display: 'none' }}
                        onChange={handleFileEntregaChange}
                      />
                    </label>
                  )}

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '11.5px',
                      color: 'var(--text-muted)',
                      marginTop: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={recordarFirmaTI}
                      onChange={(e) => setRecordarFirmaTI(e.target.checked)}
                    />
                    Guardar esta firma en el navegador para futuras actas
                  </label>
                </div>
              ) : (
                /* Contenedor Entrega: Dibujar en Canvas */
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div
                    style={{
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      background: '#ffffff',
                      touchAction: 'none',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <canvas
                      ref={canvasEntregaRef}
                      width={450}
                      height={150}
                      style={{ width: '100%', height: '140px', display: 'block', cursor: 'crosshair' }}
                      onMouseDown={startDrawingEntrega}
                      onMouseMove={drawEntrega}
                      onMouseUp={stopDrawingEntrega}
                      onMouseLeave={stopDrawingEntrega}
                      onTouchStart={startDrawingEntrega}
                      onTouchMove={drawEntrega}
                      onTouchEnd={stopDrawingEntrega}
                    />
                    {!hasDrawnEntrega && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          pointerEvents: 'none',
                          color: '#94a3b8',
                          fontSize: '12px',
                          textAlign: 'center',
                        }}
                      >
                        ✍️ Dibuja la firma aquí con el mouse o lápiz táctil
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={clearCanvasEntrega}
                      style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <RotateCcwIcon size={12} /> Limpiar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* COLUMNA 2: QUIEN RECIBE (COLABORADOR) */}
            <div
              style={{
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '16px',
                background: 'var(--card-bg, #ffffff)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      color: '#10b981',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Recibe (Colaborador)
                  </span>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>
                    {nombreRecibe}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {equipo.cedula_responsable ? `C.C. ${equipo.cedula_responsable}` : 'C.C. No registrada'}
                    {equipo.cargo ? ` · ${equipo.cargo}` : ''}
                  </div>
                </div>

                {/* Tabs método Recibe */}
                <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-hover, #f1f5f9)', padding: '3px', borderRadius: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setMetodoRecibe('draw')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: metodoRecibe === 'draw' ? 600 : 400,
                      background: metodoRecibe === 'draw' ? '#10b981' : 'transparent',
                      color: metodoRecibe === 'draw' ? '#ffffff' : 'var(--text-muted)',
                    }}
                  >
                    Dibujar
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodoRecibe('upload')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: metodoRecibe === 'upload' ? 600 : 400,
                      background: metodoRecibe === 'upload' ? '#10b981' : 'transparent',
                      color: metodoRecibe === 'upload' ? '#ffffff' : 'var(--text-muted)',
                    }}
                  >
                    Subir Imagen
                  </button>
                </div>
              </div>

              {/* Contenedor Recibe: Dibujar en Canvas */}
              {metodoRecibe === 'draw' ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div
                    style={{
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      background: '#ffffff',
                      touchAction: 'none',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <canvas
                      ref={canvasRecibeRef}
                      width={450}
                      height={150}
                      style={{ width: '100%', height: '140px', display: 'block', cursor: 'crosshair' }}
                      onMouseDown={startDrawingRecibe}
                      onMouseMove={drawRecibe}
                      onMouseUp={stopDrawingRecibe}
                      onMouseLeave={stopDrawingRecibe}
                      onTouchStart={startDrawingRecibe}
                      onTouchMove={drawRecibe}
                      onTouchEnd={stopDrawingRecibe}
                    />
                    {!hasDrawnRecibe && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          pointerEvents: 'none',
                          color: '#94a3b8',
                          fontSize: '12px',
                          textAlign: 'center',
                        }}
                      >
                        ✍️ El colaborador puede firmar aquí con el dedo o mouse
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {hasDrawnRecibe ? 'Firma capturada correctamente' : 'Firma pendiente'}
                    </span>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={clearCanvasRecibe}
                      style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <RotateCcwIcon size={12} /> Limpiar
                    </button>
                  </div>
                </div>
              ) : (
                /* Contenedor Recibe: Subir Imagen */
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  {firmaRecibeImg ? (
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          border: '1px dashed var(--border-color)',
                          borderRadius: '8px',
                          padding: '12px',
                          background: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: '140px',
                        }}
                      >
                        <img
                          src={firmaRecibeImg}
                          alt="Firma Recibe"
                          style={{ maxHeight: '110px', maxWidth: '100%', objectFit: 'contain' }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckIcon size={14} /> Firma cargada
                        </span>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                          onClick={() => setFirmaRecibeImg('')}
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label
                      style={{
                        border: '2px dashed var(--border-color)',
                        borderRadius: '8px',
                        padding: '24px 16px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: 'var(--bg-hover, #f8fafc)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '140px',
                      }}
                    >
                      <UploadCloudIcon size={28} color="#10b981" />
                      <span style={{ fontSize: '12px', fontWeight: 600, marginTop: '8px', color: 'var(--text-main)' }}>
                        Subir firma escaneada o digital
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PNG o JPG</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        style={{ display: 'none' }}
                        onChange={handleFileRecibeChange}
                      />
                    </label>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="modal-footer"
          style={{
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            padding: '14px 20px',
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            onClick={handleDescargarSinFirmas}
            disabled={descargando}
            style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}
          >
            Descargar sin firmas (Firma física en papel)
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={descargando}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleDescargarConFirmas}
              disabled={descargando}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#0284c7',
                borderColor: '#0284c7',
              }}
            >
              <DownloadIcon size={16} />
              {descargando ? 'Generando Word...' : 'Generar y Descargar con Firmas'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
