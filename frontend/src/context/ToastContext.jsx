import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckIcon, AlertTriangleIcon, XIcon } from '../components/Icons';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Contenedor flotante accesible de Toasts */}
      <div
        className="toast-container"
        role="region"
        aria-label="Notificaciones del sistema"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '420px',
          width: 'calc(100% - 48px)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          let bg = 'var(--bg-card)';
          let border = 'var(--border)';
          let textColor = 'var(--text-main)';
          let iconColor = 'var(--primary)';
          let icon = <CheckIcon size={18} />;

          if (toast.type === 'success') {
            border = '#10b981';
            iconColor = '#10b981';
            icon = <CheckIcon size={18} />;
          } else if (toast.type === 'error') {
            border = '#ef4444';
            iconColor = '#ef4444';
            icon = <AlertTriangleIcon size={18} />;
          } else if (toast.type === 'warning') {
            border = '#f59e0b';
            iconColor = '#f59e0b';
            icon = <AlertTriangleIcon size={18} />;
          }

          return (
            <div
              key={toast.id}
              role={toast.type === 'error' ? 'alert' : 'status'}
              aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
              className="toast-card"
              style={{
                pointerEvents: 'auto',
                background: bg,
                border: `1px solid ${border}`,
                borderLeft: `5px solid ${border}`,
                borderRadius: '8px',
                padding: '12px 14px',
                boxShadow: 'var(--shadow-lg)',
                color: textColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                animation: 'toastFadeIn 0.25s var(--motion-ease-out) forwards',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <span style={{ color: iconColor, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  {icon}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 500, lineHeight: 1.4, wordBreak: 'break-word' }}>
                  {toast.message}
                </span>
              </div>
              <button
                type="button"
                className="btn-icon"
                onClick={() => removeToast(toast.id)}
                aria-label="Cerrar notificación"
                style={{
                  flexShrink: 0,
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                <XIcon size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback a alert en caso extremo de uso fuera del Provider
    return {
      showToast: (msg) => alert(msg),
      success: (msg) => alert(msg),
      error: (msg) => alert(msg),
      info: (msg) => alert(msg),
      warning: (msg) => alert(msg),
      removeToast: () => {},
    };
  }
  return {
    ...ctx,
    success: (msg, duration) => ctx.showToast(msg, 'success', duration),
    error: (msg, duration) => ctx.showToast(msg, 'error', duration),
    info: (msg, duration) => ctx.showToast(msg, 'info', duration),
    warning: (msg, duration) => ctx.showToast(msg, 'warning', duration),
  };
}
