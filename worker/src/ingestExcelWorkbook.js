const { Pool } = require('pg');
const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres-db',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'inventario_db',
  user: process.env.DB_USER || 'inventario_user',
  password: process.env.DB_PASSWORD || 'inventario_secret_pass_2026',
});

function parseExcelDate(excelVal) {
  if (!excelVal) return null;
  if (typeof excelVal === 'number') {
    if (excelVal < 30000 || excelVal > 60000) return null;
    const jsDate = new Date(Math.round((excelVal - 25569) * 86400 * 1000));
    if (!isNaN(jsDate.getTime())) {
      return jsDate.toISOString().slice(0, 10);
    }
  }
  if (typeof excelVal === 'string') {
    const s = excelVal.trim();
    const match = s.match(/(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{2,6})/);
    if (match) {
      let part1 = parseInt(match[1], 10);
      let part2 = parseInt(match[2], 10);
      let part3 = parseInt(match[3], 10);

      let y, m, day;
      if (part1 > 1000) {
        y = part1;
        m = part2;
        day = part3;
      } else {
        day = part1;
        m = part2;
        y = part3;
      }

      if (y > 2100) {
        const yStr = String(y);
        y = parseInt(yStr.slice(-4), 10);
      } else if (y < 100) {
        y += 2000;
      }

      if (y >= 2000 && y <= 2099 && m >= 1 && m <= 12 && day >= 1 && day <= 31) {
        const maxDays = new Date(y, m, 0).getDate();
        if (day > maxDays) day = maxDays;

        const mStr = String(m).padStart(2, '0');
        const dStr = String(day).padStart(2, '0');
        return `${y}-${mStr}-${dStr}`;
      }
    }
  }
  return null;
}

function cleanString(val) {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  if (s === '' || s.toUpperCase() === 'N/A' || s.toUpperCase() === 'NULL') return null;
  return s;
}

function normalizarEstado(est, defaultEst = 'FUNCIONAL') {
  if (!est) return defaultEst;
  const s = String(est).trim().toUpperCase();
  if (s.includes('BAJA') || s.includes('DAÑADO') || s.includes('DANADO') || s.includes('DEFECTUOSO')) {
    return 'DAÑADO';
  }
  if (s.includes('REVIS') || s.includes('USADA') || s.includes('MANTENIMIENTO')) {
    return 'FUNCIONAL';
  }
  if (s.includes('FUNCIONAL') || s.includes('OK') || s.includes('BUENO')) {
    return 'FUNCIONAL';
  }
  return defaultEst;
}

async function getOrCreateUser(client, cedulaRaw, nombreRaw, passwordHash) {
  const cedula = cleanString(cedulaRaw);
  const nombre = cleanString(nombreRaw);
  if (!cedula) return null;

  const resSelect = await client.query('SELECT id FROM usuarios WHERE cedula = $1', [cedula]);
  if (resSelect.rows.length > 0) {
    return resSelect.rows[0].id;
  }

  const email = `emp.${cedula}@empresa.local`;
  const nombreCompleto = nombre || `Empleado C.C. ${cedula}`;

  try {
    const resInsert = await client.query(
      `INSERT INTO usuarios (email, password_hash, nombre_completo, cedula, rol, cargo, departamento, activo)
       VALUES ($1, $2, $3, $4, 'EMPLEADO', 'Colaborador', 'Operaciones', true)
       ON CONFLICT (cedula) DO UPDATE SET nombre_completo = EXCLUDED.nombre_completo
       RETURNING id`,
      [email, passwordHash, nombreCompleto, cedula]
    );
    return resInsert.rows[0]?.id || null;
  } catch (err) {
    return null;
  }
}

async function ingestExcelWorkbook(filePath) {
  console.log(`[Ingestor] Iniciando lectura de libro Excel: ${filePath}`);
  const wb = XLSX.readFile(filePath);
  const defaultPasswordHash = await bcrypt.hash('Empleado123!', 10);

  const client = await pool.connect();
  const resumen = {
    totalProcesados: 0,
    insertados: 0,
    actualizados: 0,
    porHoja: {},
  };

  try {
    await client.query('BEGIN');

    // Configuración de encabezados por hoja
    const sheetConfigs = [
      { name: 'EQUIPOS EN PRESTAMOS', headerRow: 4, cat: 'EQUIPOS_PRESTAMOS', mod: 'PROPIO' },
      { name: 'ALQUILER', headerRow: 4, cat: 'ALQUILER', mod: 'ALQUILER' },
      { name: 'PRESTAMOS', headerRow: 0, cat: 'PRESTAMOS', mod: 'PRESTAMO_TEMPORAL' },
      { name: 'DEVOLUCIONES', headerRow: 4, cat: 'DEVOLUCIONES', mod: 'DEVOLUCION' },
      { name: 'IMPRESORAS', headerRow: 7, cat: 'IMPRESORAS', mod: 'PROPIO' },
      { name: 'ELEMENTOS', headerRow: 0, cat: 'ELEMENTOS', mod: 'PROPIO' },
      { name: 'Perifericos', headerRow: 5, cat: 'PERIFERICOS', mod: 'PROPIO' },
      { name: 'UPS', headerRow: 4, cat: 'UPS', mod: 'PROPIO' },
      { name: 'BAJAS', headerRow: 4, cat: 'BAJAS', mod: 'BAJA' },
    ];

    let contadorSinPlaca = 1;

    for (const cfg of sheetConfigs) {
      const ws = wb.Sheets[cfg.name];
      if (!ws) {
        console.log(`[Ingestor] Hoja "${cfg.name}" no encontrada en el archivo. Omitiendo.`);
        continue;
      }

      const allRows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const rawHeaders = allRows[cfg.headerRow] || [];
      const headers = rawHeaders.map((h, i) => (h ? String(h).trim() : `col_${i}`));

      let sheetInsertados = 0;
      let sheetActualizados = 0;

      for (let r = cfg.headerRow + 1; r < allRows.length; r++) {
        const row = allRows[r];
        if (!row || !row.some((x) => x !== null && x !== undefined && String(x).trim() !== '')) {
          continue;
        }

        const data = {};
        headers.forEach((h, i) => {
          if (h && !h.startsWith('col_')) data[h] = row[i] !== undefined ? row[i] : null;
        });

        // Mapeo flexible según la hoja
        let placa = cleanString(data['Placa'] || data['PLACA'] || data['placa']);
        const serial = cleanString(data['serial'] || data['SERIAL'] || data['Serial']);
        const marca = cleanString(data['Marca'] || data['MARCA']) || 'Genérica';
        const modelo = cleanString(data['Modelo'] || data['MODELO']) || 'Estándar';
        let tipo = cleanString(data['Tipo'] || data['TIPO']);
        let sede = cleanString(data['Sede'] || data['SEDE'] || data['UBICACIÓN']) || 'Sede Principal';
        const area = cleanString(data['area'] || data['Area'] || data['AREA'] || data['área']);
        const cedula = cleanString(data['Cedula'] || data['CEDULA']);
        const responsable = cleanString(data['Responsable'] || data['RESPONSABLE']);
        let estado = normalizarEstado(data['Estado'] || data['DISPONIBILIDAD'] || (cfg.cat === 'BAJAS' ? 'DE_BAJA' : 'FUNCIONAL'));
        if (cfg.cat === 'BAJAS') estado = 'DE_BAJA';

        // Fechas
        const fechaOperacion = parseExcelDate(data['FECHA'] || data['Fecha devolucion'] || data['Fecha Baja']);
        const fechaMantenimiento = parseExcelDate(data['FECHA MANTENIMIENTO']);

        // Solicitante / Recibido
        const solicitante = cleanString(data['QUIEN SOLICITA'] || data['Solicitante']);
        const recibidoPor = cleanString(data['QUIEN RECIBE'] || data['Recibido por']);

        // Especificaciones técnicas
        const procesador = cleanString(data['Procesador'] || data['PROCESADOR']);
        const ram = cleanString(data['RAM']);
        const almacenamiento = cleanString(data['SSD'] || data['Almacenamiento']);
        const so = cleanString(data['SISTEMA OPERATIVO']);
        const nombreEquipo = cleanString(data['NOMBRE EQUIPO']);
        const board = cleanString(data['Board']);
        const acronis = cleanString(data['ACRONIS']);
        const glpi = cleanString(data['GLPI']);
        const color = cleanString(data['Color'] || data['COLOR']);
        const observaciones = cleanString(data['OBSERVACIONES'] || data['Observaciones'] || data['OBSERVACIONES ']);

        // Específicos de Impresoras
        const ip = cleanString(data['IP']);
        if (cfg.cat === 'IMPRESORAS') {
          tipo = 'Impresora';
        }

        // Específicos de UPS
        const potencia = cleanString(data['POTENCIA']);
        const baterias = cleanString(data['BATERIAS']);
        const peso = cleanString(data['PESO']);
        const proteccion = cleanString(data['PROTECCION']);
        const vEntrada = cleanString(data['T. ENTRADA']);
        const vSalida = cleanString(data['T. SALIDA']);
        if (cfg.cat === 'UPS') {
          tipo = 'UPS';
        }

        // Específicos de Periféricos
        const disponibilidad = cleanString(data['DISPONIBILIDAD']) || 'OK';
        if (cfg.cat === 'PERIFERICOS' && !tipo) {
          tipo = 'Periférico';
        }

        // Generar identificador si no tiene placa física
        if (!placa || placa.toUpperCase() === 'N/A' || placa.toUpperCase() === 'PROVEEDOR') {
          if (serial) {
            placa = `${cfg.cat.slice(0, 4)}-${serial.replace(/[^A-Za-z0-9]/g, '')}`;
          } else {
            placa = `${cfg.cat.slice(0, 4)}-${String(contadorSinPlaca++).padStart(4, '0')}`;
          }
        }

        if (!tipo) tipo = 'Laptop';

        // Auto-aprovisionar usuario si tiene cédula
        let usuarioId = null;
        if (cedula && responsable) {
          usuarioId = await getOrCreateUser(client, cedula, responsable, defaultPasswordHash);
        }

        // Insertar o actualizar en base de datos
        // Si ya existe por placa o serial
        let existingId = null;
        const checkRes = await client.query(
          'SELECT id FROM equipos WHERE placa = $1 OR (serial = $2 AND serial IS NOT NULL AND serial != \'\') LIMIT 1',
          [placa, serial]
        );
        if (checkRes.rows.length > 0) {
          existingId = checkRes.rows[0].id;
        }

        if (existingId) {
          await client.query(
            `UPDATE equipos SET
              nombre_equipo = COALESCE($1, nombre_equipo),
              tipo = COALESCE($2, tipo),
              marca = COALESCE($3, marca),
              modelo = COALESCE($4, modelo),
              serial = COALESCE($5, serial),
              procesador = COALESCE($6, procesador),
              ram = COALESCE($7, ram),
              almacenamiento = COALESCE($8, almacenamiento),
              sistema_operativo = COALESCE($9, sistema_operativo),
              estado = $10,
              sede = COALESCE($11, sede),
              area = COALESCE($12, area),
              cedula_responsable = COALESCE($13, cedula_responsable),
              responsable_nombre = COALESCE($14, responsable_nombre),
              usuario_asignado_id = COALESCE($15, usuario_asignado_id),
              fecha_mantenimiento = COALESCE($16, fecha_mantenimiento),
              observaciones = COALESCE($17, observaciones),
              categoria = $18,
              modalidad = $19,
              fecha_operacion = COALESCE($20, fecha_operacion),
              solicitante = COALESCE($21, solicitante),
              recibido_por = COALESCE($22, recibido_por),
              ip = COALESCE($23, ip),
              color = COALESCE($24, color),
              potencia = COALESCE($25, potencia),
              baterias = COALESCE($26, baterias),
              peso = COALESCE($27, peso),
              proteccion = COALESCE($28, proteccion),
              voltaje_entrada = COALESCE($29, voltaje_entrada),
              voltaje_salida = COALESCE($30, voltaje_salida),
              disponibilidad = COALESCE($31, disponibilidad),
              board = COALESCE($32, board),
              acronis = COALESCE($33, acronis),
              glpi = COALESCE($34, glpi),
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $35`,
            [
              nombreEquipo,
              tipo,
              marca,
              modelo,
              serial,
              procesador,
              ram,
              almacenamiento,
              so,
              estado,
              sede,
              area,
              cedula,
              responsable,
              usuarioId,
              fechaMantenimiento,
              observaciones,
              cfg.cat,
              cfg.mod,
              fechaOperacion,
              solicitante,
              recibidoPor,
              ip,
              color,
              potencia,
              baterias,
              peso,
              proteccion,
              vEntrada,
              vSalida,
              disponibilidad,
              board,
              acronis,
              glpi,
              existingId,
            ]
          );
          sheetActualizados++;
          resumen.actualizados++;
        } else {
          const insertRes = await client.query(
            `INSERT INTO equipos (
              placa, nombre_equipo, tipo, marca, modelo, serial,
              procesador, ram, almacenamiento, sistema_operativo, estado,
              sede, area, cedula_responsable, responsable_nombre, usuario_asignado_id,
              fecha_mantenimiento, observaciones, categoria, modalidad,
              fecha_operacion, solicitante, recibido_por, ip, color,
              potencia, baterias, peso, proteccion, voltaje_entrada, voltaje_salida,
              disponibilidad, board, acronis, glpi
            ) VALUES (
              $1, $2, $3, $4, $5, $6,
              $7, $8, $9, $10, $11,
              $12, $13, $14, $15, $16,
              $17, $18, $19, $20,
              $21, $22, $23, $24, $25,
              $26, $27, $28, $29, $30, $31,
              $32, $33, $34, $35
            ) RETURNING id`,
            [
              placa,
              nombreEquipo,
              tipo,
              marca,
              modelo,
              serial,
              procesador,
              ram,
              almacenamiento,
              so,
              estado,
              sede,
              area,
              cedula,
              responsable,
              usuarioId,
              fechaMantenimiento,
              observaciones,
              cfg.cat,
              cfg.mod,
              fechaOperacion,
              solicitante,
              recibidoPor,
              ip,
              color,
              potencia,
              baterias,
              peso,
              proteccion,
              vEntrada,
              vSalida,
              disponibilidad,
              board,
              acronis,
              glpi,
            ]
          );

          // Crear evento inicial
          if (insertRes.rows.length > 0) {
            const tipoEv = cfg.cat === 'BAJAS' ? 'DE_BAJA' : cfg.cat === 'PRESTAMOS' ? 'PRESTAMO' : cfg.cat === 'DEVOLUCIONES' ? 'DEVOLUCION' : 'CREACION';
            await client.query(
              `INSERT INTO eventos_inventario (equipo_id, tipo_evento, descripcion, detalles)
               VALUES ($1, $2, $3, $4)`,
              [
                insertRes.rows[0].id,
                tipoEv,
                `Registro de activo desde hoja ${cfg.name} (Placa: ${placa})`,
                JSON.stringify({ origen: `Libro Excel (${cfg.name})`, modulo: cfg.cat, placa }),
              ]
            );
          }

          sheetInsertados++;
          resumen.insertados++;
        }

        resumen.totalProcesados++;
      }

      resumen.porHoja[cfg.name] = {
        insertados: sheetInsertados,
        actualizados: sheetActualizados,
      };
      console.log(`[Ingestor] Hoja "${cfg.name}" completada: ${sheetInsertados} insertados, ${sheetActualizados} actualizados.`);
    }

    await client.query('COMMIT');
    console.log('[Ingestor] Transacción completada exitosamente.');
    console.log('[Ingestor] Resumen Global:', JSON.stringify(resumen, null, 2));
    return resumen;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Ingestor] Error durante la ingesta:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Ejecución directa por CLI si se llama con 'node src/ingestExcelWorkbook.js <ruta>'
if (require.main === module) {
  const targetFile = process.argv[2] || '/tmp/inventario.xlsx';
  ingestExcelWorkbook(targetFile)
    .then((res) => {
      console.log('Ingesta finalizada con éxito:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fallo en la ingesta:', err);
      process.exit(1);
    });
}

module.exports = { ingestExcelWorkbook };
