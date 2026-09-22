import React from 'react';

export default function Pagination({
  paginaActual = 1,
  totalItems = 0,
  itemsPorPagina = 25,
  onCambiarPagina,
  onCambiarItemsPorPagina,
  opcionesItemsPorPagina = [10, 25, 50, 100],
}) {
  const totalPaginas = Math.ceil(totalItems / itemsPorPagina) || 1;

  // Rango de elementos mostrados
  const inicio = totalItems === 0 ? 0 : (paginaActual - 1) * itemsPorPagina + 1;
  const fin = Math.min(paginaActual * itemsPorPagina, totalItems);

  // Generación inteligente de botones de páginas
  const obtenerNumerosPagina = () => {
    const paginas = [];
    const delta = 2; // Cantidad de páginas a los lados de la actual

    if (totalPaginas <= 7) {
      for (let i = 1; i <= totalPaginas; i++) {
        paginas.push(i);
      }
    } else {
      paginas.push(1);

      let izquierda = paginaActual - delta;
      let derecha = paginaActual + delta;

      if (paginaActual <= 4) {
        izquierda = 2;
        derecha = 5;
      } else if (paginaActual >= totalPaginas - 3) {
        izquierda = totalPaginas - 4;
        derecha = totalPaginas - 1;
      }

      if (izquierda > 2) {
        paginas.push('...');
      }

      for (let i = Math.max(2, izquierda); i <= Math.min(totalPaginas - 1, derecha); i++) {
        paginas.push(i);
      }

      if (derecha < totalPaginas - 1) {
        paginas.push('...');
      }

      paginas.push(totalPaginas);
    }

    return paginas;
  };

  const paginas = obtenerNumerosPagina();

  return (
    <div className="modern-pagination-container">
      {/* Botón Anterior */}
      <button
        type="button"
        className={`pagination-nav-btn ${paginaActual <= 1 ? 'disabled' : ''}`}
        disabled={paginaActual <= 1}
        onClick={() => onCambiarPagina && onCambiarPagina(paginaActual - 1)}
        title="Página anterior"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      {/* Lista de Páginas Numeradas */}
      <div className="pagination-pages-list">
        {paginas.map((pag, idx) => {
          if (pag === '...') {
            return (
              <span key={`dots-${idx}`} className="pagination-dots">
                ...
              </span>
            );
          }

          const isActive = pag === paginaActual;
          return (
            <button
              key={`page-${pag}`}
              type="button"
              className={`pagination-number-btn ${isActive ? 'active' : ''}`}
              onClick={() => onCambiarPagina && onCambiarPagina(pag)}
            >
              {pag}
            </button>
          );
        })}
      </div>

      {/* Botón Siguiente */}
      <button
        type="button"
        className={`pagination-nav-btn next ${paginaActual >= totalPaginas ? 'disabled' : ''}`}
        disabled={paginaActual >= totalPaginas}
        onClick={() => onCambiarPagina && onCambiarPagina(paginaActual + 1)}
        title="Página siguiente"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>

      {/* Rango de Resultados (ej: 1 - 50 of 189) */}
      <div className="pagination-range-text">
        <span>{inicio}</span> - <span>{fin}</span> de <span>{totalItems}</span>
      </div>

      {/* Selector de Items por Página */}
      {onCambiarItemsPorPagina && (
        <div className="pagination-select-wrap">
          <select
            className="pagination-pagesize-select"
            value={itemsPorPagina}
            onChange={(e) => {
              const nuevoTamano = parseInt(e.target.value, 10);
              onCambiarItemsPorPagina(nuevoTamano);
              if (onCambiarPagina) onCambiarPagina(1);
            }}
          >
            {opcionesItemsPorPagina.map((opcion) => (
              <option key={opcion} value={opcion}>
                {opcion}
              </option>
            ))}
          </select>
          <span className="pagination-select-arrow">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </span>
        </div>
      )}
    </div>
  );
}
