import React, { useEffect, useRef } from 'react';
import { AlertTriangleIcon, XIcon } from './Icons';

export default function ConfirmModal({
  isOpen,
  title = '¿Confirmar acción?',
  message = '¿Estás seguro de que deseas continuar con esta operación?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'primary', // 'primary' | 'danger'
  onConfirm,
  onClose,
}) {
  const cancelBtnRef = useRef(null);

  // Escuchar tecla Escape y auto-enfocar el botón de cancelar por seguridad
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const timer = setTimeout(() => {
      if (cancelBtnRef.current) cancelBtnRef.current.focus();
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{ zIndex: 1200 }}
      role="presentation"
    >
      <div
        className="modal-content"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '460px',
          width: '92%',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 'var(--radius)',
        }}
      >
        <div
          className="modal-header"
          style={{
            borderBottom: '1px solid var(--border)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: isDanger ? 'var(--danger-light)' : 'rgba(37, 99, 235, 0.1)',
                color: isDanger ? 'var(--danger)' : 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangleIcon size={18} />
            </span>
            <h3
              id="confirm-dialog-title"
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--text-main)',
              }}
            >
              {title}
            </h3>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Cerrar ventana de confirmación"
          >
            <XIcon size={16} />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          <p
            id="confirm-dialog-desc"
            style={{
              margin: 0,
              fontSize: '13.5px',
              lineHeight: 1.55,
              color: 'var(--text-muted)',
            }}
          >
            {message}
          </p>
        </div>

        <div
          className="modal-footer"
          style={{
            borderTop: '1px solid var(--border)',
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            background: 'var(--bg-app)',
          }}
        >
          <button
            type="button"
            ref={cancelBtnRef}
            className="btn btn-secondary"
            onClick={onClose}
            style={{ minWidth: '90px' }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={isDanger ? 'btn btn-danger' : 'btn btn-primary'}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{
              minWidth: '100px',
              background: isDanger ? '#ef4444' : undefined,
              borderColor: isDanger ? '#ef4444' : undefined,
              color: '#ffffff',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
