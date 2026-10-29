import React from 'react';

/**
 * Caja base de skeleton animada con efecto shimmer
 */
export function SkeletonBox({
  width = '100%',
  height = '16px',
  borderRadius = '6px',
  className = '',
  style = {},
}) {
  return (
    <span
      className={`skeleton-box ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Esqueleto para líneas de texto con anchos variados
 */
export function SkeletonText({ lines = 1, height = '13px', className = '' }) {
  const widths = ['100%', '85%', '92%', '78%', '65%'];
  return (
    <div className={`skeleton-text-group ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox
          key={i}
          height={height}
          width={widths[i % widths.length]}
          borderRadius="4px"
        />
      ))}
    </div>
  );
}

/**
 * Esqueleto para tarjetas KPI del Dashboard
 */
export function SkeletonKpiCard() {
  return (
    <div className="kpi-card" aria-hidden="true" style={{ pointerEvents: 'none' }}>
      <div className="kpi-info" style={{ flex: 1 }}>
        <SkeletonBox width="80px" height="12px" style={{ marginBottom: '8px' }} />
        <SkeletonBox width="64px" height="28px" borderRadius="8px" />
      </div>
      <SkeletonBox width="46px" height="46px" borderRadius="12px" />
    </div>
  );
}

/**
 * Esqueleto para filas de tablas (Inventario, Usuarios, Historial)
 */
export function SkeletonTableRow({ cols = 8, keyIndex = 0 }) {
  // Variación en anchos de columnas para simular contenido real
  const colWidths = ['70px', '140px', '110px', '85px', '95px', '120px', '80px', '90px'];

  return (
    <tr className="skeleton-row" key={keyIndex} aria-hidden="true">
      {Array.from({ length: cols }).map((_, idx) => (
        <td key={idx}>
          <SkeletonBox
            width={colWidths[idx % colWidths.length]}
            height={idx === 0 ? '22px' : idx === 3 ? '20px' : '14px'}
            borderRadius={idx === 0 || idx === 3 ? '12px' : '4px'}
          />
        </td>
      ))}
    </tr>
  );
}

/**
 * Esqueleto para tarjetas de hardware o listas
 */
export function SkeletonCard({ height = '160px' }) {
  return (
    <div className="card" style={{ padding: '20px', height }} aria-hidden="true">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <SkeletonBox width="130px" height="18px" />
        <SkeletonBox width="60px" height="20px" borderRadius="10px" />
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

export default {
  SkeletonBox,
  SkeletonText,
  SkeletonKpiCard,
  SkeletonTableRow,
  SkeletonCard,
};
