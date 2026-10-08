import React, { useState, useEffect } from 'react';

/**
 * Componente híbrido de selección con opción de valor personalizado.
 * Muestra un menú desplegable con opciones predeterminadas y existentes,
 * permitiendo además ingresar un nuevo valor libremente con '➕ Otro'.
 */
export default function SelectOrCustomInput({
  label,
  required = false,
  value = '',
  onChange,
  options = [],
  placeholder = 'Seleccione una opción...',
  customPlaceholder = 'Escriba un nuevo valor...',
  name,
  disabled = false,
}) {
  const [isCustom, setIsCustom] = useState(false);

  // Determinar si el valor actual ya está en la lista de opciones
  const valueInOptions = options.some(
    (opt) => String(opt).toLowerCase().trim() === String(value || '').toLowerCase().trim()
  );

  // Si el valor cambia externamente (ej: al abrir modal de edición)
  useEffect(() => {
    if (value && !valueInOptions) {
      setIsCustom(true);
    } else {
      setIsCustom(false);
    }
  }, [value, valueInOptions]);

  const handleSelectChange = (e) => {
    const val = e.target.value;
    if (val === '__OTRO__') {
      setIsCustom(true);
      onChange('');
    } else {
      setIsCustom(false);
      onChange(val);
    }
  };

  const handleBackToList = () => {
    setIsCustom(false);
    // Si el valor actual no está en la lista, vaciarlo para que seleccione uno válido
    if (!valueInOptions) {
      onChange(options[0] || '');
    }
  };

  return (
    <div className="form-field-group">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label>
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
        {!disabled && (
          <button
            type="button"
            className={`select-custom-toggle-btn ${isCustom ? 'active' : ''}`}
            onClick={() => {
              if (isCustom) {
                handleBackToList();
              } else {
                setIsCustom(true);
                onChange('');
              }
            }}
            title={isCustom ? 'Volver a seleccionar de la lista' : 'Ingresar un valor personalizado'}
          >
            {isCustom ? '↺ Ver lista' : '+ Personalizado'}
          </button>
        )}
      </div>

      {isCustom ? (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <input
            type="text"
            required={required}
            disabled={disabled}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={customPlaceholder}
            autoFocus
            style={{ flex: 1 }}
          />
          <button
            type="button"
            onClick={handleBackToList}
            title="Volver a seleccionar de la lista"
            className="btn-custom-return"
          >
            ↺
          </button>
        </div>
      ) : (
        <select
          value={value || ''}
          onChange={handleSelectChange}
          required={required}
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
          {/* Si el valor no coincide con ninguno, mostrarlo para no perderlo */}
          {value && !valueInOptions && (
            <option value={value}>{value} (Personalizado)</option>
          )}
          <option value="__OTRO__" style={{ fontWeight: 700, color: '#0284c7' }}>
            ➕ Otro / Escribir nuevo...
          </option>
        </select>
      )}
    </div>
  );
}
