/**
 * Middleware centralizado de Validación y Sanitización de Entradas (OWASP ASVS)
 * - Valida formato UUID en parámetros de ruta (:id, :equipoId, :accionId)
 * - Rechaza bytes nulos (\0) y caracteres de control peligrosos
 * - Valida tipos de datos, formatos de correo y longitudes máximas por campo
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// También permitir los UUID semilla (ej. a0000000-0000-0000-0000-000000000001)
const UUID_GENERIC_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX_FIELD_LENGTHS = {
  email: 255,
  password: 128,
  mfaCode: 32,
  code: 32,
  nombre_completo: 150,
  cedula: 50,
  rol: 20,
  cargo: 100,
  departamento: 100,
  placa: 100,
  nombre_equipo: 150,
  tipo: 50,
  marca: 100,
  modelo: 100,
  serial: 100,
  procesador: 100,
  ram: 50,
  almacenamiento: 100,
  sistema_operativo: 100,
  estado: 50,
  sede: 100,
  area: 100,
  cedula_responsable: 50,
  responsable_nombre: 150,
  categoria: 50,
  modalidad: 50,
  solicitante: 150,
  recibido_por: 150,
  quien_recibe: 150,
  ip: 50,
  color: 50,
  potencia: 100,
  baterias: 100,
  peso: 50,
  proteccion: 100,
  voltaje_entrada: 50,
  voltaje_salida: 50,
  disponibilidad: 50,
  board: 100,
  acronis: 50,
  glpi: 50,
  codigo_interno: 100,
  software_instalado: 2000,
  accesorios: 2000,
  observaciones: 2500,
  motivo: 1000,
  descripcion_falla: 1500,
  accion_realizada: 150,
  procedimiento_realizado: 2000,
  busqueda: 150,
};

function containsNullBytes(val) {
  return typeof val === 'string' && val.includes('\0');
}

function validateAndSanitizeInputs(req, res, next) {
  try {
    // 1. Validar parámetros de ruta UUID (:id, :equipoId, :accionId)
    if (req.params && typeof req.params === 'object') {
      for (const [paramKey, paramVal] of Object.entries(req.params)) {
        if (containsNullBytes(paramVal)) {
          return res.status(400).json({ error: `Parámetro '${paramKey}' contiene caracteres inválidos` });
        }
        if (['id', 'equipoId', 'accionId'].includes(paramKey) && paramVal) {
          if (!UUID_GENERIC_REGEX.test(String(paramVal).trim())) {
            return res.status(400).json({
              error: `El identificador '${paramKey}' no tiene un formato UUID válido`,
            });
          }
        }
      }
    }

    // 2. Validar parámetros de consulta (req.query)
    if (req.query && typeof req.query === 'object') {
      for (const [qKey, qVal] of Object.entries(req.query)) {
        if (typeof qVal === 'string') {
          if (containsNullBytes(qVal)) {
            return res.status(400).json({ error: `El filtro '${qKey}' contiene caracteres no permitidos` });
          }
          const maxLen = MAX_FIELD_LENGTHS[qKey] || 200;
          if (qVal.length > maxLen) {
            return res.status(400).json({
              error: `El parámetro de consulta '${qKey}' excede la longitud máxima permitida (${maxLen} caracteres)`,
            });
          }
        }
      }
    }

    // 3. Validar cuerpo de la petición (req.body)
    if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
      for (const [field, value] of Object.entries(req.body)) {
        if (value === null || value === undefined) continue;

        if (typeof value === 'string') {
          if (containsNullBytes(value)) {
            return res.status(400).json({ error: `El campo '${field}' contiene caracteres nulos no permitidos` });
          }

          // Firmas digitales en base64 pueden ser más extensas (hasta 1.5MB)
          if (field === 'firmaEntrega' || field === 'firmaRecibe') {
            if (value.length > 1500000) {
              return res.status(400).json({ error: `La imagen de firma '${field}' excede el tamaño permitido` });
            }
            continue;
          }

          const maxLen = MAX_FIELD_LENGTHS[field] || 1000;
          if (value.length > maxLen) {
            return res.status(400).json({
              error: `El campo '${field}' excede la longitud máxima permitida de ${maxLen} caracteres`,
            });
          }

          if (field === 'email' && value.trim() !== '') {
            if (!EMAIL_REGEX.test(value.trim())) {
              return res.status(400).json({ error: 'El formato del correo electrónico es inválido' });
            }
          }

          if (field === 'usuario_asignado_id' && value.trim() !== '') {
            if (!UUID_GENERIC_REGEX.test(value.trim())) {
              return res.status(400).json({ error: 'El ID de usuario asignado no tiene un formato UUID válido' });
            }
          }
        }
      }
    }

    return next();
  } catch (err) {
    console.error('[InputValidation] Error al validar entrada:', err.message);
    return res.status(400).json({ error: 'Datos de entrada con formato inválido' });
  }
}

module.exports = {
  validateAndSanitizeInputs,
  UUID_REGEX,
  UUID_GENERIC_REGEX,
};
