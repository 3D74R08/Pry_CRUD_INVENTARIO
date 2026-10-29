import React, { useState, useEffect } from 'react';
import { XIcon, FileTextIcon, ShieldCheckIcon } from './Icons';

export default function PrivacyTermsModal({ isOpen, onClose, defaultTab = 'privacidad' }) {
  const [tab, setTab] = useState(defaultTab);

  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab, isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1300 }}>
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '780px', width: '94%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', padding: '16px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(37, 99, 235, 0.12)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheckIcon size={20} />
            </div>
            <div>
              <h3 id="legal-modal-title" style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
                Políticas Institucionales y Protección de Datos
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                ZONAMEDICA MR SAS · Bogotá D.C., Colombia
              </div>
            </div>
          </div>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Cerrar modal de políticas">
            <XIcon size={18} />
          </button>
        </div>

        {/* Barra de pestañas */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-app)',
            padding: '8px 22px 0 22px',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={() => setTab('privacidad')}
            style={{
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: tab === 'privacidad' ? '2px solid var(--primary)' : '2px solid transparent',
              color: tab === 'privacidad' ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            📋 Protección de Datos (Ley 1581)
          </button>
          <button
            type="button"
            onClick={() => setTab('terminos')}
            style={{
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: tab === 'terminos' ? '2px solid var(--primary)' : '2px solid transparent',
              color: tab === 'terminos' ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            ⚖️ Términos de Uso
          </button>
          <button
            type="button"
            onClick={() => setTab('storage')}
            style={{
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: tab === 'storage' ? '2px solid var(--primary)' : '2px solid transparent',
              color: tab === 'storage' ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            🔒 Almacenamiento y Sesión
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="modal-body" style={{ padding: '22px', overflowY: 'auto', fontSize: '13.5px', lineHeight: 1.6, color: 'var(--text-main)' }}>
          {tab === 'privacidad' && (
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px', color: 'var(--primary)' }}>
                Política de Tratamiento de Datos Personales (Habeas Data)
              </h4>
              <p style={{ marginBottom: '12px' }}>
                En cumplimiento de la <strong>Ley Estatutaria 1581 de 2012</strong>, el <strong>Decreto 1377 de 2013</strong> y la reglamentación de la Superintendencia de Industria y Comercio (SIC) de la República de Colombia, <strong>ZONAMEDICA MR S.A.S.</strong>, como Responsable del Tratamiento de la información, informa a sus colaboradores, técnicos y contratistas:
              </p>
              <h5 style={{ fontWeight: 600, margin: '14px 0 6px 0' }}>1. Finalidad del Tratamiento</h5>
              <p style={{ marginBottom: '10px' }}>
                Los datos personales recopilados (Nombres y Apellidos, Cédula de Ciudadanía, Cargo, Sede, Área y Firma Digital/Manuscrita) son recolectados y procesados exclusivamente para:
              </p>
              <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>
                <li>Gestión, asignación, custodia y control del inventario de activos tecnológicos de la institución.</li>
                <li>Generación formal y firma del <strong>Acta de Entrega de Equipos</strong> y trazabilidad de la <strong>Hoja de Vida</strong> de hardware.</li>
                <li>Control de acceso, autenticación mediante credenciales institucionales y registro de pistas de auditoría inmutables.</li>
              </ul>
              <h5 style={{ fontWeight: 600, margin: '14px 0 6px 0' }}>2. Tratamiento de Datos Biométricos (Firmas Digitales)</h5>
              <p style={{ marginBottom: '10px' }}>
                La firma capturada a través del panel táctil o imagen tiene como único propósito certificar la recepción física de los activos encomendados para el desempeño de funciones laborales. Su suministro es voluntario pero necesario para la expedición del acta oficial correspondiente.
              </p>
              <h5 style={{ fontWeight: 600, margin: '14px 0 6px 0' }}>3. Derechos del Titular (Habeas Data)</h5>
              <p style={{ marginBottom: '10px' }}>
                Conforme al Art. 8 de la Ley 1581 de 2012, el titular tiene derecho a conocer, actualizar y rectificar sus datos personales, solicitar prueba de la autorización otorgada y consultar los registros a su nombre.
              </p>
              <h5 style={{ fontWeight: 600, margin: '14px 0 6px 0' }}>4. Canales de Atención Institucional</h5>
              <p>
                Para ejercer sus derechos de Habeas Data, puede dirigirse al correo: <code>coordinacionit@zonamedicaips.com</code> o <code>administracion@zonamedicaips.com</code> en la ciudad de Bogotá D.C.
              </p>
            </div>
          )}

          {tab === 'terminos' && (
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px', color: 'var(--primary)' }}>
                Términos y Condiciones de Uso del Inventario
              </h4>
              <p style={{ marginBottom: '12px' }}>
                El acceso y uso de la plataforma <strong>VaultTI</strong> se rige bajo los siguientes lineamientos corporativos:
              </p>
              <h5 style={{ fontWeight: 600, margin: '14px 0 6px 0' }}>1. Uso Exclusivo y Confidencialidad</h5>
              <p style={{ marginBottom: '10px' }}>
                El sistema está destinado únicamente para la administración y supervisión de los activos de cómputo y telecomunicaciones de <strong>ZONAMEDICA MR SAS</strong>. Las credenciales de acceso son personales e intransferibles.
              </p>
              <h5 style={{ fontWeight: 600, margin: '14px 0 6px 0' }}>2. Responsabilidad y Custodia del Hardware</h5>
              <p style={{ marginBottom: '10px' }}>
                Todo colaborador que reciba un activo tecnológico mediante Acta de Entrega asume la responsabilidad de su correcto uso, custodia y mantenimiento en las condiciones recibidas. Cualquier daño, pérdida o falla debe reportarse inmediatamente al departamento de TI mediante ticket o al correo <code>soporte@zonamedicaips.com</code>.
              </p>
              <h5 style={{ fontWeight: 600, margin: '14px 0 6px 0' }}>3. Trazabilidad Inmutable</h5>
              <p>
                Las acciones realizadas dentro de la plataforma (asignaciones, préstamos, devoluciones, bajas y modificaciones en la Hoja de Vida) quedan auditadas de forma inmutable con fecha, hora, dirección IP y usuario responsable.
              </p>
            </div>
          )}

          {tab === 'storage' && (
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '10px', color: 'var(--primary)' }}>
                Política de Almacenamiento Local (Web Storage / Cookies)
              </h4>
              <p style={{ marginBottom: '12px' }}>
                VaultTI está diseñado con un enfoque estricto de <strong>privacidad técnica y minimización de datos</strong>:
              </p>
              <ul style={{ paddingLeft: '20px', marginBottom: '14px' }}>
                <li><strong>Cero Cookies de Terceros:</strong> La plataforma no utiliza cookies publicitarias, trackers de marketing ni scripts de analítica externa.</li>
                <li><strong>Tokens de Sesión (localStorage):</strong> Se almacena un token seguro JWT (JSON Web Token) firmado para mantener activa su sesión administrativa mientras utiliza el aplicativo.</li>
                <li><strong>Preferencia Visual:</strong> Se guarda en su navegador la selección del tema claro u oscuro (<code>vaultti_theme</code>).</li>
                <li><strong>Firma Digital de Entrega:</strong> Si el administrador de TI autoriza recordar su firma para futuras actas, ésta se guarda localmente en su dispositivo y puede ser eliminada en cualquier momento desde el propio modal de firma.</li>
              </ul>
              <div
                style={{
                  background: 'var(--bg-app)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  fontSize: '12.5px',
                  color: 'var(--text-muted)',
                }}
              >
                💡 <strong>Recomendación de seguridad:</strong> Si accede a la plataforma desde un equipo compartido o público, cierre su sesión formalmente pulsando el botón <em>Cerrar Sesión</em> para purgar los datos de autenticación del almacenamiento local.
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', padding: '14px 22px', display: 'flex', justifyContent: 'flex-end', background: 'var(--bg-app)' }}>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Entendido y Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
