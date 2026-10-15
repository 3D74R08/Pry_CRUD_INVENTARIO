const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

// Estilo de borde fino negro consistente
const borderThin = {
  top: { style: 'thin', color: { argb: 'FF000000' } },
  left: { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  right: { style: 'thin', color: { argb: 'FF000000' } }
};

// Función para sanitizar nombres de directorios y archivos en el SO
function sanitizeName(name, fallback = 'SIN_ASIGNAR') {
  if (!name || typeof name !== 'string') return fallback;
  const clean = name.trim().replace(/[\\/*?:"<>|]/g, '_').replace(/\s+/g, ' ');
  return clean.length > 0 ? clean : fallback;
}

// Helper para formatear fechas a YYYY-MM-DD
function formatFecha(val, fallback) {
  if (!val) return fallback || '';
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(val).slice(0, 10);
}

/**
 * Obtiene la ruta física absoluta de la plantilla institucional
 */
function getTemplatePath() {
  const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
  const possiblePaths = [
    process.env.TEMPLATE_PATH,
    path.join(__dirname, '../../templates/Plantilla_HJ.xltx'),
    path.join(__dirname, '../templates/Plantilla_HJ.xltx'),
    '/app/templates/Plantilla_HJ.xltx',
    path.join(uploadDir, 'templates/Plantilla_HJ.xltx'),
    path.join(uploadDir, 'Plantilla_HJ.xltx'),
    path.join(__dirname, '../../templates/plantilla_hj.xltx'),
    path.join(__dirname, '../../templates/Plantilla_HJ.xlsx'),
    path.join(__dirname, '../../templates/plantilla_hj.xlsx'),
    '/app/templates/plantilla_hj.xltx',
    '/app/templates/Plantilla_HJ.xlsx',
    path.join(uploadDir, 'templates/Plantilla_HJ.xlsx'),
    path.join(uploadDir, 'Plantilla_HJ.xlsx'),
  ];

  for (const p of possiblePaths) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }

  throw new Error('No se encontró la plantilla de Hoja de Vida (Plantilla_HJ.xltx)');
}

/**
 * Genera la Hoja de Vida oficial en formato .xlsx para un equipo y la guarda
 * en la estructura uploads/hojas_de_vida/[Sede]/[Area]/[PLACA]_Hoja_de_Vida.xlsx
 * 
 * @param {Object} equipo - Datos completos del equipo
 * @param {Array} acciones - Historial completo de intervenciones/mantenimientos
 * @returns {Promise<{ filePath: string, fileName: string, relativePath: string }>}
 */
async function generarHojaDeVida(equipo, acciones = []) {
  if (!equipo) {
    throw new Error('No se proporcionaron datos de equipo para generar la Hoja de Vida');
  }

  const templatePath = getTemplatePath();
  const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');

  // Estructura de carpetas por Sede y Área
  const sedeDir = sanitizeName(equipo.sede, 'SIN_SEDE');
  const areaDir = sanitizeName(equipo.area, 'SIN_AREA');
  const placaClean = sanitizeName(equipo.placa, `TI_${equipo.id || Date.now()}`);

  const targetFolder = path.join(uploadDir, 'hojas_de_vida', sedeDir, areaDir);
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  const fileName = `${placaClean}_Hoja_de_Vida.xlsx`;
  const targetFilePath = path.join(targetFolder, fileName);
  const relativePath = path.join('hojas_de_vida', sedeDir, areaDir, fileName);

  // Cargar plantilla en ExcelJS para conservar estilos nativos, fuentes, bordes y colores
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(templatePath);
  const ws = wb.getWorksheet('FRMA-01') || wb.getWorksheet(1);

  // Limpiar celda A1 para eliminar el error nativo #VALUE! / #¡VALOR! de la plantilla
  const cellA1 = ws.getCell('A1');
  if (cellA1) {
    cellA1.value = null;
  }

  // Preparar datos formateados
  const fechaHoy = new Date().toISOString().slice(0, 10);
  const fechaOperacion = formatFecha(equipo.fecha_operacion, fechaHoy);

  let responsableTexto = 'Custodia / Almacén TI';
  if (equipo.responsable_nombre && equipo.responsable_nombre.trim() !== '') {
    responsableTexto = equipo.responsable_nombre.trim();
    if (equipo.cedula_responsable && equipo.cedula_responsable.trim() !== '') {
      responsableTexto += ` (C.C. ${equipo.cedula_responsable.trim()})`;
    }
  } else if (equipo.usuario_asignado_nombre && equipo.usuario_asignado_nombre.trim() !== '') {
    responsableTexto = equipo.usuario_asignado_nombre.trim();
    if (equipo.cedula_responsable && equipo.cedula_responsable.trim() !== '') {
      responsableTexto += ` (C.C. ${equipo.cedula_responsable.trim()})`;
    }
  }

  // Detección de tipo de equipo para checkboxes B9 (Servidor), D9 (Escritorio), E9 (Laptop)
  const tipoStr = (equipo.tipo || '').toLowerCase();
  const isServidor = tipoStr.includes('servidor') || tipoStr.includes('server');
  const isDesktop = tipoStr.includes('escritorio') || tipoStr.includes('desktop') || tipoStr.includes('todo en uno') || tipoStr.includes('all in one');
  const isLaptop = tipoStr.includes('laptop') || tipoStr.includes('portatil') || tipoStr.includes('portátil') || (!isServidor && !isDesktop);

  // Mapeo exhaustivo en la hoja FRMA-01
  ws.getCell('C6').value = equipo.area || 'General / TI';
  ws.getCell('I6').value = fechaOperacion || fechaHoy;
  ws.getCell('C7').value = responsableTexto;
  ws.getCell('I7').value = equipo.cargo || equipo.usuario_cargo || equipo.rol || 'Funcionario';

  ws.getCell('B9').value = isServidor ? 'X' : '';
  ws.getCell('D9').value = isDesktop ? 'X' : '';
  ws.getCell('E9').value = isLaptop ? 'X' : '';
  ws.getCell('H9').value = equipo.codigo_interno || equipo.placa || 'S/P';

  ws.getCell('C10').value = equipo.marca || '';
  ws.getCell('I10').value = equipo.sistema_operativo || 'Windows 11 Pro';

  // Mapear software adicional en columna I (filas 11 a 25)
  if (equipo.software_instalado && equipo.software_instalado.trim() !== '') {
    const lineasSoftware = equipo.software_instalado.split(/[\r\n,;]+/).map(s => s.trim()).filter(Boolean);
    lineasSoftware.slice(0, 15).forEach((soft, sIdx) => {
      ws.getCell(`I${11 + sIdx}`).value = soft;
    });
  }

  ws.getCell('C11').value = equipo.modelo || '';
  ws.getCell('C12').value = equipo.serial || '';
  ws.getCell('C13').value = equipo.board || equipo.modelo || 'OEM';
  ws.getCell('C14').value = equipo.procesador || 'N/A';
  ws.getCell('C15').value = equipo.ram || 'N/A';
  ws.getCell('C16').value = equipo.almacenamiento || 'N/A';
  ws.getCell('C17').value = 'N/A';
  ws.getCell('C18').value = 'N/A';
  ws.getCell('C19').value = 'Incorporado / USB';
  ws.getCell('C20').value = 'Óptico USB';

  const nombreEquipoDefecto = equipo.nombre_equipo || (equipo.placa ? `PC-${equipo.placa}` : 'PC-EQUIPO');
  ws.getCell('C21').value = nombreEquipoDefecto;
  ws.getCell('C22').value = 'EMPRESA.LOCAL';
  ws.getCell('C23').value = equipo.ip || 'DHCP';
  ws.getCell('C24').value = equipo.usuario_asignado_email || equipo.email || '';
  ws.getCell('C25').value = `Sede: ${equipo.sede || 'N/A'}${equipo.area ? ' - ' + equipo.area : ''}`;

  // Observaciones Generales (Fila 36 y 38 con bordes completos)
  ws.getCell('A36').value = 'OBSERVACIONES GENERALES';
  for (let c = 1; c <= 10; c++) {
    ws.getCell(36, c).border = borderThin;
  }

  ws.getCell('A38').value = equipo.observaciones || 'EQUIPO EN CONDICIONES OPERATIVAS';
  for (let c = 1; c <= 10; c++) {
    ws.getCell(38, c).border = borderThin;
  }

  // Encabezado de la bitácora de intervenciones (Fila 39)
  for (let c = 1; c <= 10; c++) {
    ws.getCell(39, c).border = borderThin;
  }

  // Limpiar celdas fusionadas antiguas desde la fila 40 hacia abajo
  const rangesToUnmerge = [];
  for (const range in ws._merges) {
    const m = ws._merges[range];
    if (m && m.top >= 40) {
      rangesToUnmerge.push(range);
    }
  }
  rangesToUnmerge.forEach(r => ws.unMergeCells(r));

  // Limpiar valores y bordes residuales desde la fila 40 hacia abajo
  const maxRowExisting = Math.max(ws.rowCount, 48);
  for (let r = 40; r <= maxRowExisting; r++) {
    const row = ws.getRow(r);
    for (let c = 1; c <= 10; c++) {
      const cell = row.getCell(c);
      cell.value = null;
      cell.border = null;
    }
  }

  // Preparar lista cronológica de acciones
  const listAcciones = (acciones && Array.isArray(acciones) && acciones.length > 0)
    ? [...acciones]
    : [{
        accion_realizada: 'ELABORACIÓN',
        fecha: fechaOperacion || fechaHoy,
        procedimiento_realizado: `REGISTRO DE ACTIVO TI - ESTADO: ${equipo.estado || 'FUNCIONAL'}`,
        realizado_por: 'Administrador TI'
      }];

  const startRow = 40;
  for (let idx = 0; idx < listAcciones.length; idx++) {
    const acc = listAcciones[idx];
    const r = startRow + idx;

    // Columna A-B: ACCIÓN REALIZADA
    ws.mergeCells(`A${r}:B${r}`);
    const cellA = ws.getCell(`A${r}`);
    cellA.value = (acc.accion_realizada || 'MANTENIMIENTO').toUpperCase();
    cellA.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cellA.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF000000' } };

    // Columna C-D: FECHA
    ws.mergeCells(`C${r}:D${r}`);
    const cellC = ws.getCell(`C${r}`);
    cellC.value = formatFecha(acc.fecha, fechaHoy);
    cellC.alignment = { vertical: 'middle', horizontal: 'center' };
    cellC.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };

    // Columna E-J: PROCEDIMIENTO REALIZADO (Detalle completo sin truncar)
    ws.mergeCells(`E${r}:J${r}`);
    const cellE = ws.getCell(`E${r}`);
    let procTexto = acc.procedimiento_realizado || '';
    if (acc.realizado_por && acc.realizado_por.trim()) {
      procTexto += ` (Realizado por: ${acc.realizado_por.trim()})`;
    }
    cellE.value = procTexto;
    cellE.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    cellE.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };

    // Aplicar bordes en todas las celdas de la fila
    for (let c = 1; c <= 10; c++) {
      ws.getCell(r, c).border = borderThin;
    }

    // Altura dinámica según extensión del procedimiento
    const textLen = procTexto.length;
    const lineBreaks = (procTexto.match(/\n/g) || []).length + 1;
    const estLines = Math.max(lineBreaks, Math.ceil(textLen / 70));
    ws.getRow(r).height = Math.max(26, estLines * 18);
  }

  // Si solo hay una acción registrada, agregar una fila vacía con bordes para estética
  let lastActionRow = startRow + listAcciones.length - 1;
  if (listAcciones.length < 2) {
    const rExtra = lastActionRow + 1;
    ws.mergeCells(`A${rExtra}:B${rExtra}`);
    ws.mergeCells(`C${rExtra}:D${rExtra}`);
    ws.mergeCells(`E${rExtra}:J${rExtra}`);
    for (let c = 1; c <= 10; c++) {
      ws.getCell(rExtra, c).border = borderThin;
    }
    ws.getRow(rExtra).height = 24;
    lastActionRow = rExtra;
  }

  // Fila separadora en blanco antes de firmas
  const blankRow = lastActionRow + 1;
  const rowBlank = ws.getRow(blankRow);
  rowBlank.height = 14;
  for (let c = 1; c <= 10; c++) {
    const cell = rowBlank.getCell(c);
    cell.value = null;
    cell.border = null;
  }

  // Posicionar bloque oficial de firmas dinámicamente debajo de toda la bitácora
  const s1 = blankRow + 1;
  const s2 = s1 + 1;
  const s3 = s2 + 1;

  // Firmas Fila 1: Nombres
  ws.mergeCells(`B${s1}:D${s1}`);
  const cB1 = ws.getCell(`B${s1}`);
  cB1.value = 'Jhon Freddy Sanchez Yara ';
  cB1.alignment = { horizontal: 'center', vertical: 'middle' };
  cB1.font = { name: 'Arial', size: 11, color: { argb: 'FF000000' } };

  ws.mergeCells(`E${s1}:F${s1}`);
  const cE1 = ws.getCell(`E${s1}`);
  cE1.value = 'Paola Miranda Bonfante ';
  cE1.alignment = { horizontal: 'center', vertical: 'middle' };
  cE1.font = { name: 'Arial', size: 11, color: { argb: 'FF000000' } };

  ws.mergeCells(`G${s1}:H${s1}`);
  const cG1 = ws.getCell(`G${s1}`);
  cG1.value = 'Liliana Delgadillo';
  cG1.alignment = { horizontal: 'center', vertical: 'middle' };
  cG1.font = { name: 'Arial', size: 11, color: { argb: 'FF000000' } };

  ws.getRow(s1).height = 26;
  for (let c = 2; c <= 8; c++) {
    ws.getCell(s1, c).border = borderThin;
  }

  // Firmas Fila 2: Roles (Elaboró, Revisó, Aprobó)
  ws.mergeCells(`B${s2}:D${s2}`);
  const cB2 = ws.getCell(`B${s2}`);
  cB2.value = 'Elaboro';
  cB2.alignment = { horizontal: 'center', vertical: 'middle' };
  cB2.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF000000' } };

  ws.mergeCells(`E${s2}:F${s2}`);
  const cE2 = ws.getCell(`E${s2}`);
  cE2.value = 'Reviso ';
  cE2.alignment = { horizontal: 'center', vertical: 'middle' };
  cE2.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF000000' } };

  ws.mergeCells(`G${s2}:H${s2}`);
  const cG2 = ws.getCell(`G${s2}`);
  cG2.value = 'Aprobó';
  cG2.alignment = { horizontal: 'center', vertical: 'middle' };
  cG2.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF000000' } };

  ws.getRow(s2).height = 18;
  for (let c = 2; c <= 8; c++) {
    ws.getCell(s2, c).border = borderThin;
  }

  // Firmas Fila 3: Cargos
  ws.mergeCells(`C${s3}:D${s3}`);
  const cC3 = ws.getCell(`C${s3}`);
  cC3.value = 'Coordinador de calidad';
  cC3.alignment = { horizontal: 'center', vertical: 'middle' };
  cC3.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };

  ws.mergeCells(`E${s3}:F${s3}`);
  const cE3 = ws.getCell(`E${s3}`);
  cE3.value = 'Coordinadora administrativa ';
  cE3.alignment = { horizontal: 'center', vertical: 'middle' };
  cE3.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };

  ws.mergeCells(`G${s3}:H${s3}`);
  const cG3 = ws.getCell(`G${s3}`);
  cG3.value = 'Sub Gerente ';
  cG3.alignment = { horizontal: 'center', vertical: 'middle' };
  cG3.font = { name: 'Arial', size: 10, color: { argb: 'FF000000' } };

  ws.getRow(s3).height = 18;
  for (let c = 2; c <= 8; c++) {
    ws.getCell(s3, c).border = borderThin;
  }

  // Guardar archivo final .xlsx preservando toda la estructura y estilos
  await wb.xlsx.writeFile(targetFilePath);

  return {
    filePath: targetFilePath,
    fileName,
    relativePath
  };
}

module.exports = {
  generarHojaDeVida,
  getTemplatePath
};
