import React, { useState, useEffect } from 'react';
import { ShieldCheckIcon } from './Icons';

export default function StorageConsentBanner({ onOpenPrivacy }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('vaultti_consent_v1');
      if (!consent) {
        setVisible(true);
      }
    } catch (e) {
      // Ignorar si localStorage está bloqueado
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('vaultti_consent_v1', new Date().toISOString());
    } catch (e) {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Aviso de privacidad y almacenamiento"
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        right: '20px',
        maxWidth: '820px',
        margin: '0 auto',
        zIndex: 1050,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-lg)',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        animation: 'toastFadeIn 0.3s var(--motion-ease-out) forwards',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 360px' }}>
        <span style={{ color: 'var(--primary)', flexShrink: 0 }}>
          <ShieldCheckIcon size={24} />
        </span>
        <div style={{ fontSize: '12.5px', lineHeight: 1.5, color: 'var(--text-main)' }}>
          <strong>Aviso de Privacidad y Almacenamiento:</strong> VaultTI utiliza almacenamiento local estrictamente necesario (autenticación JWT y preferencias) y procesa datos institucionales conforme a la <strong>Ley 1581 de 2012 (Habeas Data Colombia)</strong>.
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={onOpenPrivacy}
          className="btn btn-secondary"
          style={{ fontSize: '12px', padding: '6px 12px' }}
        >
          Ver Políticas
        </button>
        <button
          type="button"
          onClick={handleAccept}
          className="btn btn-primary"
          style={{ fontSize: '12px', padding: '6px 14px' }}
        >
          Aceptar y Continuar
        </button>
      </div>
    </div>
  );
}
