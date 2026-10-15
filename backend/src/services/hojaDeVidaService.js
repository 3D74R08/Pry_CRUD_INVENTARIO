const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

// Función para sanitizar nombres de directorios y archivos en el SO
function sanitizeName(name, fallback = 'SIN_ASIGNAR') {
  if (!name || typeof name !== 'string') return fallback;
  const clean = name.trim().replace(/[\\/*?:"<>|]/g, '_').replace(/\s+/g, ' ');
  return clean.length > 0 ? clean : fallback;
}

// Helper para asignar valor en celda de SheetJS
function setCell(sheet, cellRef, val) {
  const textVal = (val !== null && val !== undefined) ? String(val) : '';
  if (!sheet[cellRef]) {
    sheet[cellRef] = { t: 's', v: textVal };
  } else {
    sheet[cellRef].v = textVal;
    sheet[cellRef].t = 's';
    sheet[cellRef].w = textVal;
  }
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

  // Leer la plantilla conservando estructura y estilos
  const wb = xlsx.readFile(templatePath, { cellStyles: true, cellNF: true });
  const sheetName = wb.Sheets['FRMA-01'] ? 'FRMA-01' : wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  // Limpiar celda A1 para eliminar el error de fórmula #VALUE! / #¡VALOR! nativo de la plantilla
  if (ws['A1']) {
    ws['A1'] = { t: 's', v: '' };
  }

  // Preparar datos formateados
  const fechaHoy = new Date().toISOString().slice(0, 10);
  const formatFecha = (val, fallback = fechaHoy) => {
    if (!val) return fallback;
    if (val instanceof Date) {
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, '0');
      const d = String(val.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return String(val).slice(0, 10);
  };
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
  setCell(ws, 'C6', equipo.area || 'General / TI');
  setCell(ws, 'I6', fechaOperacion || fechaHoy);
  setCell(ws, 'C7', responsableTexto);
  setCell(ws, 'I7', equipo.cargo || equipo.usuario_cargo || equipo.rol || 'Funcionario');

  setCell(ws, 'B9', isServidor ? 'X' : '');
  setCell(ws, 'D9', isDesktop ? 'X' : '');
  setCell(ws, 'E9', isLaptop ? 'X' : '');
  setCell(ws, 'H9', equipo.codigo_interno || equipo.placa || 'S/P');

  setCell(ws, 'C10', equipo.marca || '');
  setCell(ws, 'I10', equipo.sistema_operativo || 'Windows 11 Pro');

  // Mapear software adicional si existe
  if (equipo.software_instalado && equipo.software_instalado.trim() !== '') {
    const lineasSoftware = equipo.software_instalado.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
    lineasSoftware.slice(0, 15).forEach((soft, sIdx) => {
      setCell(ws, `I${11 + sIdx}`, soft);
    });
  }

  setCell(ws, 'C11', equipo.modelo || '');
  setCell(ws, 'C12', equipo.serial || '');
  setCell(ws, 'C13', equipo.board || equipo.modelo || 'OEM');
  setCell(ws, 'C14', equipo.procesador || 'N/A');
  setCell(ws, 'C15', equipo.ram || 'N/A');
  setCell(ws, 'C16', equipo.almacenamiento || 'N/A');
  setCell(ws, 'C17', 'N/A');
  setCell(ws, 'C18', 'N/A');
  setCell(ws, 'C19', 'Incorporado / USB');
  setCell(ws, 'C20', 'Óptico USB');

  const nombreEquipoDefecto = equipo.nombre_equipo || (equipo.placa ? `PC-${equipo.placa}` : 'PC-EQUIPO');
  setCell(ws, 'C21', nombreEquipoDefecto);
  setCell(ws, 'C22', 'EMPRESA.LOCAL');
  setCell(ws, 'C23', equipo.ip || 'DHCP');
  setCell(ws, 'C24', equipo.usuario_asignado_email || equipo.email || '');
  setCell(ws, 'C25', `Sede: ${equipo.sede || 'N/A'}${equipo.area ? ' - ' + equipo.area : ''}`);

  // Sección de Observaciones Generales
  setCell(ws, 'A38', equipo.observaciones || 'EQUIPO EN CONDICIONES OPERATIVAS');

  // Sección de Acciones e Intervenciones Realizadas (Filas 40 en adelante)
  if (acciones && Array.isArray(acciones) && acciones.length > 0) {
    acciones.slice(0, 4).forEach((acc, idx) => {
      const rowNum = 40 + idx;
      setCell(ws, `A${rowNum}`, (acc.accion_realizada || 'MANTENIMIENTO').toUpperCase());
      setCell(ws, `C${rowNum}`, formatFecha(acc.fecha, fechaHoy));
      setCell(ws, `E${rowNum}`, acc.procedimiento_realizado || '');
    });
  } else {
    setCell(ws, 'A40', 'ELABORACIÓN');
    setCell(ws, 'C40', fechaOperacion || fechaHoy);
    setCell(ws, 'E40', `REGISTRO DE ACTIVO TI - ESTADO: ${equipo.estado || 'FUNCIONAL'}`);
  }

  // Guardar archivo final .xlsx
  xlsx.writeFile(wb, targetFilePath, { bookType: 'xlsx' });

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
