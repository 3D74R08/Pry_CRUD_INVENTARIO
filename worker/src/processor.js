const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const bcrypt = require('bcryptjs');
const db = require('./db');

function normalizeKey(str) {
  return (str || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

const FIELD_MAPPING = {
  placa: ['placa', 'placadeinventario', 'placaactivo', 'placainventario', 'activo', 'code'],
  nombre_equipo: ['nombreequipo', 'nombre', 'hostname', 'equipo'],
  tipo: ['tipo', 'clase', 'categoria', 'tipodeequipo'],
  marca: ['marca', 'fabricante', 'brand'],
  modelo: ['modelo', 'model'],
  serial: ['serial', 'serie', 'numerodeserie', 'sn'],
  procesador: ['procesador', 'cpu'],
  ram: ['ram', 'memoria', 'memoriaram'],
  almacenamiento: ['almacenamiento', 'disco', 'discoduro', 'ssd', 'hdd'],
  sistema_operativo: ['sistemaoperativo', 'so', 'os'],
  estado: ['estado', 'status', 'condicion'],
  sede: ['sede', 'sucursal', 'ubicacion', 'edificio'],
  area: ['area', 'departamento', 'seccion', 'oficina'],
  cedula_responsable: ['cedula', 'cedularesponsable', 'documento', 'identificacion', 'cedulausuario'],
  responsable_nombre: ['responsable', 'usuario', 'empleado', 'nombreresponsable', 'asignadoa'],
  fecha_mantenimiento: ['fechamantenimiento', 'mantenimiento', 'fechamant'],
  observaciones: ['observaciones', 'notas', 'comentarios', 'detalle', 'accesorios'],
};

function parseFecha(val) {
  if (!val) return null;
  const clean = val.toString().replace(/["\t\r\n]/g, '').trim();
  if (!clean || clean === 'N/A' || clean === 'S/N' || clean.toUpperCase() === 'PENDIENTE') return null;

  // Formato D/M/YYYY o DD/MM/YYYY
  const parts = clean.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    let year = parts[2].trim();
    if (year.length === 2) year = '20' + year;
    if (year.length === 4) return `${year}-${month}-${day}`;
  }

  // Si ya es YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  return null;
}

function mapRowToEquipo(rawRow) {
  const normRow = {};
  for (const [k, v] of Object.entries(rawRow)) {
    normRow[normalizeKey(k)] = typeof v === 'string' ? v.trim() : v;
  }

  const equipo = {};
  for (const [targetField, aliases] of Object.entries(FIELD_MAPPING)) {
    for (const alias of aliases) {
      if (normRow[alias] !== undefined && normRow[alias] !== '') {
        equipo[targetField] = normRow[alias];
        break;
      }
    }
  }

  // Normalizar estado
  if (equipo.estado) {
    const est = equipo.estado.toUpperCase();
    if (est.includes('FUNCIONAL') || est.includes('OK') || est.includes('ACTIVO') || est.includes('BUENO')) {
      equipo.estado = 'FUNCIONAL';
    } else if (est.includes('REVIS') || est.includes('MANTEN') || est.includes('ALQUIL')) {
      equipo.estado = 'REVISAR';
    } else if (est.includes('DAÑ') || est.includes('DANO') || est.includes('MALO')) {
      equipo.estado = 'DAÑADO';
    } else if (est.includes('BAJA') || est.includes('DESCARTE') || est.includes('OBSOLET')) {
      equipo.estado = 'DE_BAJA';
    } else {
      equipo.estado = 'FUNCIONAL';
    }
  } else {
    equipo.estado = 'FUNCIONAL';
  }

  // Limpiar campos
  if (equipo.cedula_responsable) {
    // Extraer solo números de la cédula
    const cedClean = equipo.cedula_responsable.toString().replace(/[^0-9]/g, '');
    equipo.cedula_responsable = cedClean.length >= 5 ? cedClean : null;
  }

  if (equipo.responsable_nombre) {
    equipo.responsable_nombre = equipo.responsable_nombre.toString().replace(/["\t]/g, '').trim();
  }

  // Combinar accesorios y observaciones si existen
  const rawObs = (normRow['observaciones'] || normRow['notas'] || normRow['comentarios'] || '').toString().trim();
  const rawAcc = (normRow['accesorios'] || '').toString().trim();
  let obsCombinadas = '';
  if (rawAcc && rawAcc !== 'N/A' && rawAcc !== 'S/N') {
    obsCombinadas += `Accesorios: ${rawAcc}`;
  }
  if (rawObs && rawObs !== 'N/A' && rawObs !== 'S/N') {
    obsCombinadas += obsCombinadas ? ` | ${rawObs}` : rawObs;
  }
  if (obsCombinadas) {
    equipo.observaciones = obsCombinadas;
  }

  if (!equipo.tipo) equipo.tipo = 'Laptop';
  if (!equipo.marca) equipo.marca = 'Genérica';
  equipo.fecha_mantenimiento = parseFecha(equipo.fecha_mantenimiento);

  return equipo;
}

// Parsear CSV inteligente (detecta delimitador ',' o ';' y busca la fila de encabezados)
function parseCSVFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length === 0) return [];

  // Detectar delimitador
  const firstFew = lines.slice(0, 10).join('\n');
  const semicolonCount = (firstFew.match(/;/g) || []).length;
  const commaCount = (firstFew.match(/,/g) || []).length;
  const delim = semicolonCount >= commaCount ? ';' : ',';

  // Buscar fila de encabezados
  let headerIndex = -1;
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const lower = lines[i].toLowerCase();
    if (lower.includes('placa') && (lower.includes('marca') || lower.includes('responsable') || lower.includes('serial'))) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) headerIndex = 0;

  const splitLine = (line) => {
    // Manejo básico de comillas
    const regex = new RegExp(`${delim}(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)`);
    return line.split(regex).map((col) => col.replace(/^"(.*)"$/, '$1').trim());
  };

  const headers = splitLine(lines[headerIndex]);
  const rows = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const cols = splitLine(lines[i]);
    // Verificar si la fila no está vacía
    const hasData = cols.some((c) => c && c.trim() !== '');
    if (!hasData) continue;

    const rowObj = {};
    headers.forEach((h, idx) => {
      if (h) rowObj[h] = cols[idx] || '';
    });
    rows.push(rowObj);
  }

  return rows;
}

// Cargar filas desde Excel (.xlsx, .xls) con detección de fila de encabezados
function readExcel(filePath) {
  const workbook = xlsx.readFile(filePath);
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const aoa = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  let headerIndex = -1;
  for (let i = 0; i < Math.min(15, aoa.length); i++) {
    const rowStr = (aoa[i] || []).join(' ').toLowerCase();
    if (rowStr.includes('placa') && (rowStr.includes('marca') || rowStr.includes('serial') || rowStr.includes('responsable'))) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) headerIndex = 0;

  const headers = aoa[headerIndex] || [];
  const rows = [];

  for (let i = headerIndex + 1; i < aoa.length; i++) {
    const rowArr = aoa[i] || [];
    const hasData = rowArr.some((c) => c !== undefined && c.toString().trim() !== '');
    if (!hasData) continue;

    const rowObj = {};
    headers.forEach((h, idx) => {
      if (h) rowObj[h.toString().trim()] = rowArr[idx] !== undefined ? rowArr[idx].toString().trim() : '';
    });
    rows.push(rowObj);
  }

  return rows;
}

const { ingestExcelWorkbook } = require('./ingestExcelWorkbook');

async function procesarArchivo(tarea) {
  const filePath = tarea.archivo_ruta;
  const ext = path.extname(tarea.archivo_nombre || filePath).toLowerCase();

  // Si es un archivo Excel .xlsx, .xls o .xltx con múltiples hojas del inventario
  if (['.xlsx', '.xls', '.xltx'].includes(ext)) {
    try {
      const wb = xlsx.readFile(filePath);
      const knownSheets = ['EQUIPOS EN PRESTAMOS', 'ALQUILER', 'PRESTAMOS', 'DEVOLUCIONES', 'IMPRESORAS', 'ELEMENTOS', 'Perifericos', 'UPS', 'BAJAS'];
      const hasMultiSheet = wb.SheetNames.some((s) => knownSheets.includes(s));
      if (hasMultiSheet) {
        console.log(`[Worker] Detectado libro maestro Excel con múltiples hojas (${wb.SheetNames.join(', ')}). Ejecutando ingesta multi-hoja.`);
        const res = await ingestExcelWorkbook(filePath);
        return {
          totalLeidos: res.totalProcesados,
          insertados: res.insertados,
          actualizados: res.actualizados,
          fallidos: 0,
          errores: [],
          porHoja: res.porHoja,
        };
      }
    } catch (e) {
      console.warn('[Worker] Fallback a lector estándar de hoja simple:', e.message);
    }
  }

  let rawRows = [];
  if (['.xlsx', '.xls', '.xltx'].includes(ext)) {
    rawRows = readExcel(filePath);
  } else {
    rawRows = parseCSVFile(filePath);
  }

  let totalLeidos = 0;
  let insertados = 0;
  let actualizados = 0;
  let fallidos = 0;
  const errores = [];

  // Hash estándar para nuevos usuarios auto-creados: Empleado123!
  const defaultPasswordHash = await bcrypt.hash('Empleado123!', 10);

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const equipo = mapRowToEquipo(row);

    if (!equipo.placa) {
      const tieneDatos = equipo.serial || equipo.modelo || (equipo.marca && equipo.marca !== 'Genérica') || equipo.responsable_nombre;
      if (!tieneDatos) {
        // Ignorar filas en blanco del archivo
        continue;
      }
      totalLeidos++;
      fallidos++;
      errores.push(`Fila ${i + 1}: No contiene un número de Placa identificable.`);
      continue;
    }

    totalLeidos++;

    try {
      // 1. Auto-provisionar usuario si tiene cédula válida y no existe
      let usuarioAsignadoId = null;
      if (equipo.cedula_responsable) {
        const userCheck = await db.query(
          'SELECT id, nombre_completo FROM usuarios WHERE cedula = $1',
          [equipo.cedula_responsable]
        );

        if (userCheck.rows.length > 0) {
          usuarioAsignadoId = userCheck.rows[0].id;
          if (!equipo.responsable_nombre) {
            equipo.responsable_nombre = userCheck.rows[0].nombre_completo;
          }
        } else if (equipo.responsable_nombre && equipo.responsable_nombre.length >= 3) {
          // Crear usuario empleado automáticamente
          const emailGenerado = `emp.${equipo.cedula_responsable}@empresa.local`;
          const newUserRes = await db.query(
            `INSERT INTO usuarios (email, password_hash, nombre_completo, cedula, rol, cargo, departamento, activo)
             VALUES ($1, $2, $3, $4, 'EMPLEADO', $5, $6, true)
             ON CONFLICT (cedula) DO UPDATE SET nombre_completo = EXCLUDED.nombre_completo
             RETURNING id`,
            [
              emailGenerado,
              defaultPasswordHash,
              equipo.responsable_nombre,
              equipo.cedula_responsable,
              equipo.area || 'Operativo',
              equipo.sede || 'General',
            ]
          );
          usuarioAsignadoId = newUserRes.rows[0].id;
        }
      }

      // 2. Verificar si el equipo ya existe por Placa
      const check = await db.query('SELECT id FROM equipos WHERE placa = $1', [equipo.placa]);
      const exists = check.rows.length > 0;

      const upsertQuery = `
        INSERT INTO equipos (
          placa, nombre_equipo, tipo, marca, modelo, serial, procesador, ram,
          almacenamiento, sistema_operativo, estado, sede, area,
          cedula_responsable, responsable_nombre, usuario_asignado_id,
          fecha_mantenimiento, observaciones
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT (placa) DO UPDATE SET
          nombre_equipo = EXCLUDED.nombre_equipo,
          tipo = EXCLUDED.tipo,
          marca = EXCLUDED.marca,
          modelo = EXCLUDED.modelo,
          serial = EXCLUDED.serial,
          procesador = EXCLUDED.procesador,
          ram = EXCLUDED.ram,
          almacenamiento = EXCLUDED.almacenamiento,
          sistema_operativo = EXCLUDED.sistema_operativo,
          estado = EXCLUDED.estado,
          sede = EXCLUDED.sede,
          area = EXCLUDED.area,
          cedula_responsable = EXCLUDED.cedula_responsable,
          responsable_nombre = EXCLUDED.responsable_nombre,
          usuario_asignado_id = EXCLUDED.usuario_asignado_id,
          fecha_mantenimiento = EXCLUDED.fecha_mantenimiento,
          observaciones = EXCLUDED.observaciones,
          updated_at = NOW()
        RETURNING id;
      `;

      const result = await db.query(upsertQuery, [
        equipo.placa,
        equipo.nombre_equipo || null,
        equipo.tipo,
        equipo.marca,
        equipo.modelo || null,
        equipo.serial || null,
        equipo.procesador || null,
        equipo.ram || null,
        equipo.almacenamiento || null,
        equipo.sistema_operativo || null,
        equipo.estado,
        equipo.sede || null,
        equipo.area || null,
        equipo.cedula_responsable || null,
        equipo.responsable_nombre || null,
        usuarioAsignadoId,
        equipo.fecha_mantenimiento || null,
        equipo.observaciones || null,
      ]);

      const equipoId = result.rows[0].id;

      if (exists) {
        actualizados++;
      } else {
        insertados++;
      }

      // Registro de trazabilidad en eventos_inventario
      await db.query(
        `INSERT INTO eventos_inventario (equipo_id, usuario_id, tipo_evento, descripcion, detalles)
         VALUES ($1, $2, 'CARGA_MASIVA', $3, $4)`,
        [
          equipoId,
          tarea.creado_por || null,
          `Procesado en carga masiva por Worker desde archivo: ${tarea.archivo_nombre}`,
          JSON.stringify({ tarea_id: tarea.id, modo: exists ? 'actualizado' : 'creado' }),
        ]
      );
    } catch (err) {
      fallidos++;
      errores.push(`Fila ${i + 1} (Placa ${equipo.placa}): ${err.message}`);
    }
  }

  return {
    totalLeidos,
    insertados,
    actualizados,
    fallidos,
    errores: errores.slice(0, 10),
  };
}

module.exports = {
  procesarArchivo,
};
