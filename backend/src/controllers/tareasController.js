const path = require('path');
const fs = require('fs');
const db = require('../config/db');

// Encolar tarea de carga masiva (Solo ADMIN)
async function crearTareaCargaMasiva(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Debes adjuntar un archivo CSV o Excel válido (.csv, .xlsx, .xltx)' });
    }

    const { modo } = req.body; // 'append' o 'replace'
    const archivoRuta = req.file.path;
    const archivoNombre = req.file.originalname;

    const insertQuery = `
      INSERT INTO tareas_worker (
        tipo_tarea, estado, archivo_nombre, archivo_ruta, parametros, creado_por
      )
      VALUES ($1, 'PENDIENTE', $2, $3, $4, $5)
      RETURNING id, tipo_tarea, estado, archivo_nombre, created_at;
    `;

    const parametros = {
      modo: modo === 'replace' ? 'replace' : 'append',
      mimetype: req.file.mimetype,
      size: req.file.size,
    };

    const result = await db.query(insertQuery, [
      'CARGA_MASIVA_CSV',
      archivoNombre,
      archivoRuta,
      JSON.stringify(parametros),
      req.user.id,
    ]);

    const tarea = result.rows[0];

    // HTTP 202 Accepted: Procesamiento delegado asíncronamente al Worker
    return res.status(202).json({
      message: 'Archivo recibido correctamente. Tarea encolada para procesamiento asíncrono en segundo plano.',
      tareaId: tarea.id,
      estado: tarea.estado,
      archivo: tarea.archivo_nombre,
      creadoEn: tarea.created_at,
    });
  } catch (error) {
    console.error('[Tareas] Error al crear tarea de carga masiva:', error);
    return res.status(500).json({ error: 'Error al registrar tarea en segundo plano' });
  }
}

// Consultar el estado de una tarea por ID
async function getTareaById(req, res) {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT 
        t.*,
        u.nombre_completo as creado_por_nombre,
        u.email as creado_por_email
       FROM tareas_worker t
       LEFT JOIN usuarios u ON t.creado_por = u.id
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    return res.json({ tarea: result.rows[0] });
  } catch (error) {
    console.error('[Tareas] Error al consultar estado de tarea:', error);
    return res.status(500).json({ error: 'Error al consultar tarea' });
  }
}

// Listar tareas recientes (Solo ADMIN)
async function getTareas(req, res) {
  try {
    const result = await db.query(
      `SELECT 
        t.id, t.tipo_tarea, t.estado, t.archivo_nombre, t.created_at, t.started_at, t.completed_at,
        t.error_mensaje, t.resultado,
        u.nombre_completo as creado_por_nombre
       FROM tareas_worker t
       LEFT JOIN usuarios u ON t.creado_por = u.id
       ORDER BY t.created_at DESC
       LIMIT 20`
    );

    return res.json({ tareas: result.rows });
  } catch (error) {
    console.error('[Tareas] Error al listar tareas:', error);
    return res.status(500).json({ error: 'Error al consultar historial de tareas' });
  }
}

// Obtener información y metadatos de la plantilla activa
function getPlantillaInfo(req, res) {
  try {
    const metaPath = path.join(__dirname, '../../templates/plantilla_metadata.json');
    const rutaActiva = path.join(__dirname, '../../templates/plantilla_activa.xltx');
    const rutaBase = path.join(__dirname, '../../templates/plantilla_inventario.xltx');

    if (fs.existsSync(metaPath) && fs.existsSync(rutaActiva)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      return res.json({
        metadata: {
          ...meta,
          existe: true,
        },
      });
    }

    if (fs.existsSync(rutaBase)) {
      const stats = fs.statSync(rutaBase);
      return res.json({
        metadata: {
          filename: 'FRMA-07_INVENTARIO_TECNOLOGICO.xltx',
          updatedAt: stats.mtime.toISOString(),
          updatedBy: 'Plantilla Base del Sistema',
          size: stats.size,
          isCustom: false,
          existe: true,
        },
      });
    }

    return res.status(404).json({ error: 'No hay plantilla configurada en el sistema' });
  } catch (error) {
    console.error('[Tareas] Error al consultar información de plantilla:', error);
    return res.status(500).json({ error: 'Error al consultar metadatos de la plantilla' });
  }
}

// Subir / Actualizar plantilla maestra oficial (Solo ADMIN)
async function subirPlantilla(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Debes adjuntar un archivo de plantilla válido (.xltx o .xlsx)' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!['.xltx', '.xlsx'].includes(ext)) {
      return res.status(400).json({ error: 'Formato no soportado. Debe ser un archivo .xltx o .xlsx' });
    }

    const templatesDir = path.join(__dirname, '../../templates');
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }

    const destinoActiva = path.join(templatesDir, 'plantilla_activa.xltx');
    const metaPath = path.join(templatesDir, 'plantilla_metadata.json');

    // Copiar archivo subido como la plantilla activa
    fs.copyFileSync(req.file.path, destinoActiva);

    const metadata = {
      filename: req.file.originalname,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.nombre_completo || req.user.email,
      size: req.file.size,
      isCustom: true,
    };

    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf8');

    // Registrar en auditoría inmutable
    try {
      await db.query(
        `INSERT INTO eventos_inventario (usuario_id, tipo_evento, descripcion, detalles)
         VALUES ($1, 'MODIFICACION', $2, $3)`,
        [
          req.user.id,
          `Actualización de Plantilla Oficial de Inventario: ${req.file.originalname} por ${req.user.nombre_completo}`,
          JSON.stringify({
            archivo_original: req.file.originalname,
            tamano_bytes: req.file.size,
            mimetype: req.file.mimetype,
          }),
        ]
      );
    } catch (auditErr) {
      console.warn('[Tareas] No se pudo registrar auditoría de plantilla:', auditErr);
    }

    return res.json({
      message: `Plantilla oficial "${req.file.originalname}" configurada exitosamente.`,
      metadata,
    });
  } catch (error) {
    console.error('[Tareas] Error al subir plantilla oficial:', error);
    return res.status(500).json({ error: 'Error al guardar la nueva plantilla oficial' });
  }
}

// Descargar plantilla maestra oficial (.xltx)
function descargarPlantilla(req, res) {
  try {
    const rutaActiva = path.join(__dirname, '../../templates/plantilla_activa.xltx');
    const rutaBase = path.join(__dirname, '../../templates/plantilla_inventario.xltx');
    const metaPath = path.join(__dirname, '../../templates/plantilla_metadata.json');

    let archivoADescargar = rutaBase;
    let nombreArchivo = 'FRMA-07_INVENTARIO_TECNOLOGICO.xltx';

    if (fs.existsSync(rutaActiva)) {
      archivoADescargar = rutaActiva;
      if (fs.existsSync(metaPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          if (meta.filename) nombreArchivo = meta.filename;
        } catch (_) {}
      }
    } else if (!fs.existsSync(rutaBase)) {
      return res.status(404).json({ error: 'Plantilla no encontrada en el servidor' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.template');
    const fileStream = fs.createReadStream(archivoADescargar);
    fileStream.pipe(res);
  } catch (error) {
    console.error('[Tareas] Error al descargar plantilla:', error);
    return res.status(500).json({ error: 'Error al procesar la descarga de la plantilla' });
  }
}

module.exports = {
  crearTareaCargaMasiva,
  getTareaById,
  getTareas,
  descargarPlantilla,
  getPlantillaInfo,
  subirPlantilla,
};

