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

// Extraer buffer y extensión de un string base64 o Data URI
function parseBase64Image(dataUri) {
  if (!dataUri || typeof dataUri !== 'string') return null;
  const match = dataUri.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/s);
  if (match) {
    const rawExt = match[1].toLowerCase();
    const ext = rawExt === 'jpeg' || rawExt === 'jpg' ? 'jpeg' : 'png';
    try {
      return {
        ext,
        buffer: Buffer.from(match[2].trim(), 'base64'),
      };
    } catch (e) {
      return null;
    }
  }
  return null;
}

// Generar markup DrawingML para una imagen dentro de una celda
function buildSignatureDrawingXml(relId, docPrId) {
  return `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing>` +
    `<wp:inline distT="0" distB="0" distL="0" distR="0">` +
      `<wp:extent cx="1600000" cy="800000"/>` +
      `<wp:docPr id="${docPrId}" name="Firma_${docPrId}"/>` +
      `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
        `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
          `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
            `<pic:nvPicPr>` +
              `<pic:cNvPr id="${docPrId}" name="Firma_${docPrId}"/>` +
              `<pic:cNvPicPr/>` +
            `</pic:nvPicPr>` +
            `<pic:blipFill>` +
              `<a:blip r:embed="${relId}"/>` +
              `<a:stretch><a:fillRect/></a:stretch>` +
            `</pic:blipFill>` +
            `<pic:spPr>` +
              `<a:xfrm><a:off x="0" y="0"/><a:ext cx="1600000" cy="800000"/></a:xfrm>` +
              `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>` +
            `</pic:spPr>` +
          `</pic:pic>` +
        `</a:graphicData>` +
      `</a:graphic>` +
    `</wp:inline>` +
  `</w:drawing></w:r></w:p>`;
}

// Obtener el estado tal como se maneja en el inventario
function getEstadoInventario(estado) {
  if (!estado) return 'Funcional';
  const e = String(estado).trim().toUpperCase();
  if (e === 'FUNCIONAL') return 'Funcional';
  if (e === 'REVISAR' || e === 'EN REVISIÓN' || e === 'EN REVISION' || e === 'A REVISAR') return 'En Revisión';
  if (e === 'DAÑADO' || e === 'DANADO') return 'Dañado';
  if (e === 'DE_BAJA' || e === 'DE BAJA') return 'De Baja';
  return estado;
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
 * @param {Object} opciones - Opciones adicionales (usuarioEntrega, fecha, accesorios, observacionesExtra, firmaEntrega, firmaRecibe)
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
  if (!contentTypes.includes('Extension="png"')) {
    contentTypes = contentTypes.replace(
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="png" ContentType="image/png"/>'
    );
  }
  zip.file('[Content_Types].xml', contentTypes);

  // 2. Gestionar firmas electrónicas (Entrega y Recibe)
  let docRels = await zip.file('word/_rels/document.xml.rels').async('text');
  let firmaEntregaXml = `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>`;
  let firmaRecibeXml = `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>`;

  if (opciones.firmaEntrega) {
    const parsed = parseBase64Image(opciones.firmaEntrega);
    if (parsed) {
      const fileName = `firma_entrega.${parsed.ext}`;
      zip.file(`word/media/${fileName}`, parsed.buffer);
      if (!docRels.includes('rIdFirmaEntrega')) {
        docRels = docRels.replace(
          '</Relationships>',
          `<Relationship Id="rIdFirmaEntrega" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${fileName}"/></Relationships>`
        );
      }
      firmaEntregaXml = buildSignatureDrawingXml('rIdFirmaEntrega', '99101');
    }
  }

  if (opciones.firmaRecibe) {
    const parsed = parseBase64Image(opciones.firmaRecibe);
    if (parsed) {
      const fileName = `firma_recibe.${parsed.ext}`;
      zip.file(`word/media/${fileName}`, parsed.buffer);
      if (!docRels.includes('rIdFirmaRecibe')) {
        docRels = docRels.replace(
          '</Relationships>',
          `<Relationship Id="rIdFirmaRecibe" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${fileName}"/></Relationships>`
        );
      }
      firmaRecibeXml = buildSignatureDrawingXml('rIdFirmaRecibe', '99102');
    }
  }

  zip.file('word/_rels/document.xml.rels', docRels);

  // 3. Extraer y modificar word/document.xml
  let docXml = await zip.file('word/document.xml').async('text');

  // Preparar valores normalizados
  const hoy = opciones.fecha ? new Date(opciones.fecha) : new Date();
  const dia = String(hoy.getDate()).padStart(2, '0');
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const anio = hoy.getFullYear();
  const fechaStr = `${dia}/${mes}/${anio}`;

  // Ciudad siempre es BOGOTÁ D.C. según directriz institucional
  const ciudadStr = 'BOGOTÁ D.C.';

  const destinatarioStr = `${equipo.responsable_nombre || 'Colaborador Asignado'}${
    equipo.cedula_responsable ? ' - C.C. ' + equipo.cedula_responsable : ''
  }`;

  const placaDisplay = equipo.placa || equipo.codigo_interno || 'S/P';
  const asuntoStr = 'Acta de entrega del activo';
  const tipoStr = (equipo.tipo || 'COMPUTADOR').toUpperCase();
  const marcaStr = (equipo.marca || 'N/A').toUpperCase();
  // El color SIEMPRE debe ser el ingresado al registrar el activo, o N/A si no se ingresó
  const colorStr = (equipo.color && equipo.color.trim()) ? equipo.color.trim() : 'N/A';
  // Accesorios solo los que se ingresaron en el registro, o N/A
  const accesoriosStr = (equipo.accesorios || opciones.accesorios || '').trim() || 'N/A';
  const serialStr = equipo.serial || 'N/A';
  const modeloStr = equipo.modelo || 'N/A';
  const estadoStr = getEstadoInventario(equipo.estado);

  // Observaciones generales tal como se ingresaron en el inventario
  const obsFinal = (equipo.observaciones || '').trim() || 'Ninguna';

  const entregaNombre = opciones.usuarioEntrega || 'Coordinación de Tecnología e Información (TI)';
  const recibeNombre = equipo.responsable_nombre || 'Colaborador Asignado';
  const entregaCargo = 'ZONAMEDICA MR SAS';
  const recibeDetalle = `${equipo.cedula_responsable ? 'C.C. ' + equipo.cedula_responsable : ''}${
    equipo.cargo ? ' - ' + equipo.cargo : ''
  }`;

  // Generar tabla de firmas centrada y sin bordes
  const tablaFirmasXml =
    `<w:tbl>` +
      `<w:tblPr>` +
        `<w:tblW w:w="9200" w:type="dxa"/>` +
        `<w:jc w:val="center"/>` +
        `<w:tblBorders>` +
          `<w:top w:val="none" w:sz="0" w:space="0" w:color="auto"/>` +
          `<w:left w:val="none" w:sz="0" w:space="0" w:color="auto"/>` +
          `<w:bottom w:val="none" w:sz="0" w:space="0" w:color="auto"/>` +
          `<w:right w:val="none" w:sz="0" w:space="0" w:color="auto"/>` +
          `<w:insideH w:val="none" w:sz="0" w:space="0" w:color="auto"/>` +
          `<w:insideV w:val="none" w:sz="0" w:space="0" w:color="auto"/>` +
        `</w:tblBorders>` +
        `<w:tblCellMar>` +
          `<w:top w:w="60" w:type="dxa"/>` +
          `<w:bottom w:w="60" w:type="dxa"/>` +
          `<w:left w:w="120" w:type="dxa"/>` +
          `<w:right w:w="120" w:type="dxa"/>` +
        `</w:tblCellMar>` +
      `</w:tblPr>` +
      `<w:tblGrid>` +
        `<w:gridCol w:w="4600"/>` +
        `<w:gridCol w:w="4600"/>` +
      `</w:tblGrid>` +
      `<w:tr>` +
        `<w:tc>` +
          `<w:tcPr><w:tcW w:w="4600" w:type="dxa"/></w:tcPr>` +
          `<w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t>Entrega</w:t></w:r></w:p>` +
        `</w:tc>` +
        `<w:tc>` +
          `<w:tcPr><w:tcW w:w="4600" w:type="dxa"/></w:tcPr>` +
          `<w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t>Recibe</w:t></w:r></w:p>` +
        `</w:tc>` +
      `</w:tr>` +
      `<w:tr>` +
        `<w:tc>` +
          `<w:tcPr><w:tcW w:w="4600" w:type="dxa"/><w:vAlign w:val="bottom"/></w:tcPr>` +
          `${firmaEntregaXml}` +
        `</w:tc>` +
        `<w:tc>` +
          `<w:tcPr><w:tcW w:w="4600" w:type="dxa"/><w:vAlign w:val="bottom"/></w:tcPr>` +
          `${firmaRecibeXml}` +
        `</w:tc>` +
      `</w:tr>` +
      `<w:tr>` +
        `<w:tc>` +
          `<w:tcPr><w:tcW w:w="4600" w:type="dxa"/></w:tcPr>` +
          `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>__________________________________</w:t></w:r></w:p>` +
        `</w:tc>` +
        `<w:tc>` +
          `<w:tcPr><w:tcW w:w="4600" w:type="dxa"/></w:tcPr>` +
          `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:t>__________________________________</w:t></w:r></w:p>` +
        `</w:tc>` +
      `</w:tr>` +
      `<w:tr>` +
        `<w:tc>` +
          `<w:tcPr><w:tcW w:w="4600" w:type="dxa"/></w:tcPr>` +
          `<w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:b/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t>${escapeXml(entregaNombre)}</w:t></w:r></w:p>` +
        `</w:tc>` +
        `<w:tc>` +
          `<w:tcPr><w:tcW w:w="4600" w:type="dxa"/></w:tcPr>` +
          `<w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:b/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t>${escapeXml(recibeNombre)}</w:t></w:r></w:p>` +
        `</w:tc>` +
      `</w:tr>` +
      `<w:tr>` +
        `<w:tc>` +
          `<w:tcPr><w:tcW w:w="4600" w:type="dxa"/></w:tcPr>` +
          `<w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t>${escapeXml(entregaCargo)}</w:t></w:r></w:p>` +
        `</w:tc>` +
        `<w:tc>` +
          `<w:tcPr><w:tcW w:w="4600" w:type="dxa"/></w:tcPr>` +
          `<w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t>${escapeXml(recibeDetalle)}</w:t></w:r></w:p>` +
        `</w:tc>` +
      `</w:tr>` +
    `</w:tbl>`;

  // 4. Procesar párrafos con reemplazo seguro de OpenXML
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

    // P4: Ciudad SIEMPRE debe ser BOGOTÁ D.C. (nunca la sede)
    if (curIdx === 4 || (pText.includes('BOGOTÁ D.C') && curIdx <= 5)) {
      modified = modified.replace(/<w:t>.*?<\/w:t>/g, `<w:t>${escapeXml(ciudadStr)}</w:t>`);
    }

    // P5: Asunto fijo "Acta de entrega del activo"
    if (pText.includes('Asunto:')) {
      modified = `<w:p w14:paraId="3FE464CF" w14:textId="1AF89ECA" w:rsidR="00E221BB" w:rsidRPr="00A13A67" w:rsidRDefault="00F82890" w:rsidP="00CD4690">` +
        `<w:pPr><w:jc w:val="center"/></w:pPr>` +
        `<w:r w:rsidRPr="00A13A67"><w:rPr><w:b/></w:rPr><w:t>Asunto: </w:t></w:r>` +
        `<w:r><w:t>${escapeXml(asuntoStr)}</w:t></w:r>` +
        `</w:p>`;
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

    // P13: Color (El registrado en el inventario o N/A)
    if (pText.includes('Color:') && modified.includes('<w:t>xxxx</w:t>')) {
      modified = modified.replace(/<w:t>xxxx<\/w:t>/g, `<w:t>${escapeXml(colorStr)}</w:t>`);
    }

    // P14: Accesorios (Solo los registrados o N/A)
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

    // P17: Estado (Mismo estado del inventario: Funcional, En Revisión, Dañado, De Baja)
    if (pText.includes('Estado:') && modified.includes('<w:t>xxxx</w:t>')) {
      modified = modified.replace(/<w:t>xxxx<\/w:t>/g, `<w:t>${escapeXml(estadoStr)}</w:t>`);
    }

    // P30: Observaciones generales
    if (pText.includes('OBSERVACIONES:')) {
      modified = modified.replace(
        /<w:t>OBSERVACIONES:<\/w:t>/g,
        `<w:t xml:space="preserve">OBSERVACIONES: </w:t></w:r><w:r><w:rPr><w:b w:val="0"/><w:bCs w:val="0"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t>${escapeXml(obsFinal)}</w:t>`
      );
    }

    // Bloque de Firmas: P32 a P37 se reemplaza con la tabla perfectamente centrada y sin bordes
    if (curIdx === 32) {
      return tablaFirmasXml;
    }
    if (curIdx > 32 && curIdx <= 37) {
      return '';
    }

    return modified;
  });

  zip.file('word/document.xml', docXml);

  // 5. Generar buffer final del archivo Word .docx
  const docxBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  // 6. Organizar guardado físico en disco en uploads/actas_de_entrega/[SEDE]/[AREA]/
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
