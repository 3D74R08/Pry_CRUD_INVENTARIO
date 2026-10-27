const path = require('path');
const fs = require('fs');
const JSZip = require('jszip');

// Función para sanitizar nombres de directorios y archivos en el SO
function sanitizeName(name, fallback = 'SIN_ASIGNAR') {
  if (!name || typeof name !== 'string') return fallback;
  const clean = name.trim().replace(/[\\/*?:"<>|]/g, '_').replace(/\s+/g, ' ');
  return clean.length > 0 ? clean : fallback;
}

// Función para escapar caracteres reservados de XML
function escapeXml(unsafe) {
  if (unsafe === undefined || unsafe === null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Obtener accesorios por defecto según la tipología del equipo
function getAccesoriosPorTipo(tipo, observaciones = '') {
  const t = (tipo || '').toLowerCase();
  if (t.includes('laptop') || t.includes('portatil') || t.includes('portátil')) {
    return 'Cargador original / Adaptador AC, Mouse óptico, Maletín / Funda de transporte.';
  }
  if (t.includes('desktop') || t.includes('mesa') || t.includes('torre') || t.includes('computador')) {
    return 'Cable de poder, Cable de video (HDMI/VGA/DisplayPort), Teclado, Mouse óptico.';
  }
  if (t.includes('todo en uno') || t.includes('all in one') || t.includes('aio')) {
    return 'Adaptador de corriente / Cable de poder, Teclado, Mouse óptico.';
  }
  if (t.includes('impresora')) {
    return 'Cable de poder, Cable USB de datos.';
  }
  if (t.includes('tablet') || t.includes('tableta')) {
    return 'Cargador, Cable de datos USB, Funda de protección.';
  }
  if (t.includes('pantalla') || t.includes('monitor')) {
    return 'Cable de poder / Adaptador, Cable de video (HDMI/DisplayPort).';
  }
  if (t.includes('ups')) {
    return 'Cable de alimentación eléctrica principal.';
  }
  return 'Cable de alimentación y accesorios estándar según entrega.';
}

// Obtener estado legible en el documento
function getEstadoLegible(estado) {
  const e = (estado || '').toUpperCase();
  if (e === 'FUNCIONAL') return 'BUENO / OPERATIVO';
  if (e === 'REVISAR') return 'EN REVISIÓN / OPERATIVO';
  if (e === 'DAÑADO') return 'DAÑADO / REQUIERE MANTENIMIENTO';
  if (e === 'DE_BAJA') return 'DE BAJA';
  return e || 'BUENO / OPERATIVO';
}

/**
 * Obtiene la ruta física absoluta de la plantilla institucional .dotx
 */
function getTemplatePath() {
  const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
  const possiblePaths = [
    process.env.TEMPLATE_ACTA_PATH,
    path.join(__dirname, '../../templates/FORMATO_ACTA_DE_ENTREGA_EQUIPOS.dotx'),
    path.join(__dirname, '../templates/FORMATO_ACTA_DE_ENTREGA_EQUIPOS.dotx'),
    '/app/templates/FORMATO_ACTA_DE_ENTREGA_EQUIPOS.dotx',
    path.join(uploadDir, 'templates/FORMATO_ACTA_DE_ENTREGA_EQUIPOS.dotx'),
    path.join(uploadDir, 'FORMATO_ACTA_DE_ENTREGA_EQUIPOS.dotx'),
    path.join(__dirname, '../../templates/FORMATO ACTA DE ENTREGA EQUIPOS.dotx'),
    '/app/templates/FORMATO ACTA DE ENTREGA EQUIPOS.dotx',
  ];

  for (const p of possiblePaths) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }

  throw new Error('No se encontró la plantilla de Acta de Entrega (FORMATO_ACTA_DE_ENTREGA_EQUIPOS.dotx)');
}

/**
 * Genera el documento Word (.docx) del Acta de Entrega con todos los campos del equipo insertados.
 * 
 * @param {Object} equipo - Datos completos del equipo desde la base de datos
 * @param {Object} opciones - Opciones adicionales (usuarioEntrega, fecha, accesorios, observacionesExtra)
 * @returns {Promise<{ filePath: string, fileName: string, relativePath: string, buffer: Buffer }>}
 */
async function generarActaEntrega(equipo, opciones = {}) {
  if (!equipo) {
    throw new Error('Datos del equipo no proporcionados para el acta de entrega');
  }

  const templatePath = getTemplatePath();
  const templateBuffer = fs.readFileSync(templatePath);
  const zip = await JSZip.loadAsync(templateBuffer);

  // 1. Convertir ContentType en [Content_Types].xml de plantilla (.dotx) a documento (.docx)
  let contentTypes = await zip.file('[Content_Types].xml').async('text');
  contentTypes = contentTypes.replace(
    'application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml'
  );
  zip.file('[Content_Types].xml', contentTypes);

  // 2. Extraer y modificar word/document.xml
  let docXml = await zip.file('word/document.xml').async('text');

  // Preparar valores normalizados
  const hoy = opciones.fecha ? new Date(opciones.fecha) : new Date();
  const dia = String(hoy.getDate()).padStart(2, '0');
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const anio = hoy.getFullYear();
  const fechaStr = `${dia}/${mes}/${anio}`;

  const sedeStr = equipo.sede ? equipo.sede.trim() : '';
  const ciudadStr = sedeStr ? sedeStr.toUpperCase() : 'BOGOTÁ D.C';

  const destinatarioStr = `${equipo.responsable_nombre || 'Colaborador Asignado'}${
    equipo.cedula_responsable ? ' - C.C. ' + equipo.cedula_responsable : ''
  }`;

  const placaDisplay = equipo.placa || equipo.codigo_interno || 'S/P';
  const asuntoStr = `Acta de Entrega de Activo TI - Placa: ${placaDisplay}`;
  const tipoStr = (equipo.tipo || 'COMPUTADOR').toUpperCase();
  const marcaStr = (equipo.marca || 'N/A').toUpperCase();
  const colorStr = equipo.color || 'Gris / Negro';
  const accesoriosStr = opciones.accesorios || getAccesoriosPorTipo(equipo.tipo, equipo.observaciones);
  const serialStr = equipo.serial || 'N/A';
  const modeloStr = equipo.modelo || 'N/A';
  const estadoStr = getEstadoLegible(equipo.estado);

  // Especificaciones técnicas estructuradas para el bloque de OBSERVACIONES
  const specs = [];
  if (equipo.codigo_interno) specs.push(`Cód. Interno: ${equipo.codigo_interno}`);
  if (equipo.procesador) specs.push(`Procesador: ${equipo.procesador}`);
  if (equipo.ram) specs.push(`RAM: ${equipo.ram}`);
  if (equipo.almacenamiento) specs.push(`Disco: ${equipo.almacenamiento}`);
  if (equipo.sistema_operativo) specs.push(`SO: ${equipo.sistema_operativo}`);
  if (equipo.sede) specs.push(`Sede: ${equipo.sede}`);
  if (equipo.area) specs.push(`Área: ${equipo.area}`);
  if (equipo.cargo) specs.push(`Cargo: ${equipo.cargo}`);
  if (equipo.software_instalado) specs.push(`Software: ${equipo.software_instalado}`);

  let obsFinal = specs.join(' | ');
  const obsDetalle = (opciones.observacionesExtra || equipo.observaciones || '').trim();
  if (obsDetalle) {
    obsFinal += (obsFinal ? ' — Detalle: ' : '') + obsDetalle;
  }
  if (!obsFinal) obsFinal = 'Ninguna.';

  const entregaNombre = opciones.usuarioEntrega || 'Coordinación de Tecnología e Información (TI)';
  const recibeNombre = equipo.responsable_nombre || 'Colaborador Asignado';
  const entregaCargo = 'ZONAMEDICA MR SAS';
  const recibeCargo = `${equipo.cedula_responsable ? 'C.C. ' + equipo.cedula_responsable : ''}${
    equipo.cargo ? ' - ' + equipo.cargo : ''
  }`;

  // 3. Procesar párrafos con reemplazo seguro de OpenXML
  const pRegex = /(<w:p[\s>][\s\S]*?<\/w:p>)/g;
  let pIndex = 0;

  docXml = docXml.replace(pRegex, (pXml) => {
    let modified = pXml;
    const curIdx = pIndex++;

    // Extraer texto plano del párrafo
    const tRegex = /<w:t[^>]*>(.*?)<\/w:t>/g;
    let tMatch;
    let pText = '';
    while ((tMatch = tRegex.exec(pXml)) !== null) {
      pText += tMatch[1];
    }

    // P0: Ciudad y Fecha
    if (pText.includes('DD/MM/AA')) {
      modified = modified.replace(/<w:t>DD\/MM\/AA<\/w:t>/g, `<w:t>${escapeXml(fechaStr)}</w:t>`);
    }

    // P2: Destinatario (A quien se le asigna el acta)
    if (pText.includes('(Nombre de a quien se le asigna el acta)') || pText.includes('a quien se le asigna')) {
      modified =
        `<w:p w14:paraId="78CC1AD4" w14:textId="3D4132E0" w:rsidR="00F82890" w:rsidRPr="00A13A67" w:rsidRDefault="005D0D54" w:rsidP="363D5632">` +
        `<w:pPr><w:rPr><w:rFonts w:eastAsia="Tahoma"/><w:b/><w:bCs/><w:color w:val="000000" w:themeColor="text1"/></w:rPr></w:pPr>` +
        `<w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">${escapeXml(destinatarioStr)}</w:t></w:r>` +
        `<w:r><w:tab/><w:tab/><w:tab/></w:r>` +
        `<w:r w:rsidR="00F82890" w:rsidRPr="363D5632"><w:rPr><w:shd w:val="clear" w:color="auto" w:fill="FFFFFF"/></w:rPr><w:t xml:space="preserve">                                              Zonamedica MR S.A.S.</w:t></w:r>` +
        `</w:p>`;
    }

    // P4: Ciudad
    if (pText.includes('BOGOTÁ D.C') && curIdx <= 5) {
      modified = modified.replace(/<w:t>BOGOTÁ D\.C<\/w:t>/g, `<w:t>${escapeXml(ciudadStr)}</w:t>`);
    }

    // P5: Asunto
    if (pText.includes('Asunto:') && pText.includes('xxxxxxxx')) {
      modified = modified.replace(/<w:t>xxxxxxxx<\/w:t>/g, `<w:t>${escapeXml(asuntoStr)}</w:t>`);
    }

    // P9: Tipo de equipo
    if (pText.includes('TIPO DE EQUIPO:') || (pText.includes('TIPO DE') && modified.includes('XXXXXX'))) {
      modified = modified.replace(/<w:t>XXXXXX<\/w:t>/g, `<w:t>${escapeXml(tipoStr)}</w:t>`);
    }

    // P11: Marca
    if (pText.includes('Marca:') && modified.includes('<w:t>xxxx</w:t>')) {
      modified = modified.replace(/<w:t>xxxx<\/w:t>/g, `<w:t>${escapeXml(marcaStr)}</w:t>`);
    }

    // P12: Placa
    if (pText.includes('placa') && modified.includes('<w:t>xxxx</w:t>')) {
      modified = modified.replace(/<w:t>xxxx<\/w:t>/g, `<w:t>${escapeXml(placaDisplay)}</w:t>`);
    }

    // P13: Color
    if (pText.includes('Color:') && modified.includes('<w:t>xxxx</w:t>')) {
      modified = modified.replace(/<w:t>xxxx<\/w:t>/g, `<w:t>${escapeXml(colorStr)}</w:t>`);
    }

    // P14: Accesorios
    if (pText.includes('Accesorios:') && modified.includes('<w:t>xxxx</w:t>')) {
      modified = modified.replace(/<w:t>xxxx<\/w:t>/g, `<w:t>${escapeXml(accesoriosStr)}</w:t>`);
    }

    // P15: Serial
    if (pText.includes('Serial') && modified.includes('<w:t>xxxx</w:t>')) {
      modified = modified.replace(/<w:t>xxxx<\/w:t>/g, `<w:t>${escapeXml(serialStr)}</w:t>`);
    }

    // P16: Modelo
    if (pText.includes('Modelo:') && modified.includes('<w:t>xxxx</w:t>')) {
      modified = modified.replace(/<w:t>xxxx<\/w:t>/g, `<w:t>${escapeXml(modeloStr)}</w:t>`);
    }

    // P17: Estado
    if (pText.includes('Estado:') && modified.includes('<w:t>xxxx</w:t>')) {
      modified = modified.replace(/<w:t>xxxx<\/w:t>/g, `<w:t>${escapeXml(estadoStr)}</w:t>`);
    }

    // P30: Observaciones y resumen de especificaciones
    if (pText.includes('OBSERVACIONES:')) {
      modified = modified.replace(
        /<w:t>OBSERVACIONES:<\/w:t>/g,
        `<w:t xml:space="preserve">OBSERVACIONES: </w:t></w:r><w:r><w:rPr><w:b w:val="0"/><w:bCs w:val="0"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t>${escapeXml(obsFinal)}</w:t>`
      );
    }

    // P36: Nombres en firmas (Entrega y Recibe)
    if (curIdx >= 32 && (pText.includes('Xxxxxx') || pText.includes('xxxxxxxxxx'))) {
      modified =
        `<w:p w14:paraId="7549CBEE" w14:textId="62413140" w:rsidR="005A0BD0" w:rsidRDefault="00A44F4D" w:rsidP="782966A1">` +
        `<w:pPr><w:rPr><w:b/><w:bCs/></w:rPr></w:pPr>` +
        `<w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">${escapeXml(entregaNombre)}</w:t></w:r>` +
        `<w:r><w:tab/><w:tab/><w:tab/><w:tab/></w:r>` +
        `<w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t xml:space="preserve">${escapeXml(recibeNombre)}</w:t></w:r>` +
        `</w:p>`;
    }

    // P37: Cargos y Empresa en firmas
    if (curIdx >= 35 && pText.includes('ZONAMEDICA MR SAS') && pText.includes('ZONAMEDICA MR S.A.S.')) {
      modified =
        `<w:p w14:paraId="2BC0E702" w14:textId="09CA23FE" w:rsidR="00B27514" w:rsidRPr="00A13A67" w:rsidRDefault="00F82890" w:rsidP="007F66FF">` +
        `<w:pPr><w:rPr><w:lang w:val="es-CO"/></w:rPr></w:pPr>` +
        `<w:r><w:t xml:space="preserve">${escapeXml(entregaCargo)}</w:t></w:r>` +
        `<w:r><w:tab/><w:tab/><w:tab/><w:tab/><w:tab/><w:tab/><w:tab/></w:r>` +
        `<w:r><w:t xml:space="preserve">${escapeXml(recibeCargo)}</w:t></w:r>` +
        `</w:p>`;
    }

    return modified;
  });

  zip.file('word/document.xml', docXml);

  // 4. Generar buffer final del archivo Word .docx
  const docxBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  // 5. Organizar guardado físico en disco en uploads/actas_de_entrega/[SEDE]/[AREA]/
  const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
  const sedeFolder = sanitizeName(equipo.sede, 'SIN_SEDE');
  const areaFolder = sanitizeName(equipo.area, 'SIN_AREA');
  const targetDir = path.join(uploadDir, 'actas_de_entrega', sedeFolder, areaFolder);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const placaClean = sanitizeName(equipo.placa || equipo.codigo_interno, 'EQUIPO');
  const respClean = sanitizeName(equipo.responsable_nombre, 'RESPONSABLE');
  const fileName = `Acta_Entrega_${placaClean}_${respClean}.docx`;
  const filePath = path.join(targetDir, fileName);

  fs.writeFileSync(filePath, docxBuffer);

  const relativePath = path.relative(uploadDir, filePath).replace(/\\/g, '/');

  return {
    filePath,
    fileName,
    relativePath,
    buffer: docxBuffer,
  };
}

module.exports = {
  generarActaEntrega,
  getTemplatePath,
};
