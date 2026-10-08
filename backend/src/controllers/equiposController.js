const db = require('../config/db');
const hojaDeVidaService = require('../services/hojaDeVidaService');

// Obtener listado de equipos con filtros y control de acceso RBAC
async function getEquipos(req, res) {
  try {
    const { rol, cedula, id: userId } = req.user;
    const { busqueda, estado, tipo, sede, area, modulo, cedula_responsable, responsable_nombre, usuario_asignado_id, ordenPlaca } = req.query;

    let query = `
      SELECT 
        e.*,
        u.nombre_completo as usuario_asignado_nombre,
        u.email as usuario_asignado_email
      FROM equipos e
      LEFT JOIN usuarios u ON e.usuario_asignado_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // REGLA RBAC ESTRICTA: El empleado solo puede ver equipos a su nombre
    if (rol === 'EMPLEADO') {
      params.push(cedula);
      const cedulaIdx = params.length;
      params.push(userId);
      const userIdx = params.length;
      query += ` AND (e.cedula_responsable = $${cedulaIdx} OR e.usuario_asignado_id = $${userIdx})`;
    }

    // Filtro por módulo operativo específico
    if (modulo && modulo.trim() !== '') {
      const mod = modulo.toLowerCase().trim();
      if (mod === 'equipos_prestamos') {
        query += ` AND (e.categoria = 'EQUIPOS_PRESTAMOS' AND (e.modalidad IS NULL OR e.modalidad != 'PRESTAMO_TEMPORAL'))`;
      } else if (mod === 'prestamos') {
        query += ` AND (e.categoria = 'PRESTAMOS' OR e.modalidad = 'PRESTAMO_TEMPORAL')`;
      } else if (mod === 'alquiler') {
        query += ` AND (e.categoria = 'ALQUILER' OR e.modalidad = 'ALQUILER' OR e.area ILIKE '%alquil%')`;
      } else if (mod === 'devoluciones') {
        query += ` AND (e.categoria = 'DEVOLUCIONES' OR e.modalidad = 'DEVOLUCION' OR e.area ILIKE '%custod%')`;
      } else if (mod === 'bajas') {
        query += ` AND (e.categoria = 'BAJAS' OR e.estado = 'DE_BAJA')`;
      } else if (mod === 'impresoras') {
        query += ` AND (e.categoria = 'IMPRESORAS' OR e.tipo ILIKE '%impresora%')`;
      } else if (mod === 'elementos') {
        query += ` AND (e.categoria = 'ELEMENTOS' OR e.tipo IN ('TABLETA', 'CAMARAS', 'Camara', 'ROUTER', 'Modem', 'BIOMETRICOS', 'LECTOR', 'MULTIPUERTOS', 'ANTENA', 'SIM', 'SCANNER DS - 640', 'DISCO EXTERNO 2 TB'))`;
      } else if (mod === 'perifericos') {
        query += ` AND (e.categoria = 'PERIFERICOS' OR e.tipo IN ('HUELLERO', 'Periférico', 'Monitor', 'Teclado'))`;
      } else if (mod === 'ups') {
        query += ` AND (e.categoria = 'UPS' OR e.tipo ILIKE '%ups%')`;
      }
    }

    // Filtros opcionales
    if (busqueda && busqueda.trim() !== '') {
      params.push(`%${busqueda.trim()}%`);
      const bIdx = params.length;
      query += ` AND (
        e.placa ILIKE $${bIdx} OR 
        e.nombre_equipo ILIKE $${bIdx} OR 
        e.serial ILIKE $${bIdx} OR 
        e.marca ILIKE $${bIdx} OR 
        e.modelo ILIKE $${bIdx} OR 
        e.responsable_nombre ILIKE $${bIdx} OR
        e.cedula_responsable ILIKE $${bIdx} OR
        e.area ILIKE $${bIdx} OR
        e.sede ILIKE $${bIdx} OR
        e.ip ILIKE $${bIdx} OR
        e.solicitante ILIKE $${bIdx} OR
        e.observaciones ILIKE $${bIdx}
      )`;
    }

    if (estado && estado.trim() !== '') {
      params.push(estado.trim());
      query += ` AND e.estado = $${params.length}`;
    }

    if (tipo && tipo.trim() !== '') {
      params.push(tipo.trim());
      query += ` AND e.tipo = $${params.length}`;
    }

    if (sede && sede.trim() !== '') {
      const sTrim = sede.trim();
      const numMatch = sTrim.match(/\b(68|105|106)\b/);
      if (numMatch) {
        params.push(`%${numMatch[1]}%`);
        query += ` AND e.sede ILIKE $${params.length}`;
      } else {
        params.push(`%${sTrim}%`);
        query += ` AND e.sede ILIKE $${params.length}`;
      }
    }

    if (area && area.trim() !== '') {
      params.push(area.trim());
      query += ` AND e.area = $${params.length}`;
    }

    if (cedula_responsable && cedula_responsable.trim() !== '') {
      params.push(cedula_responsable.trim());
      query += ` AND (e.cedula_responsable = $${params.length} OR e.usuario_asignado_id::text = $${params.length})`;
    }

    if (responsable_nombre && responsable_nombre.trim() !== '') {
      params.push(`%${responsable_nombre.trim()}%`);
      query += ` AND e.responsable_nombre ILIKE $${params.length}`;
    }

    if (usuario_asignado_id && usuario_asignado_id.trim() !== '') {
      params.push(usuario_asignado_id.trim());
      query += ` AND e.usuario_asignado_id = $${params.length}`;
    }

    if (ordenPlaca && (ordenPlaca.toLowerCase() === 'asc' || ordenPlaca.toLowerCase() === 'desc')) {
      const dir = ordenPlaca.toUpperCase();
      query += ` ORDER BY 
        CASE 
          WHEN e.placa ~ '^[0-9]+$' THEN e.placa::numeric 
          ELSE NULL 
        END ${dir} NULLS LAST,
        e.placa ${dir} NULLS LAST`;
    } else {
      query += ` ORDER BY e.created_at DESC`;
    }

    const result = await db.query(query, params);
    return res.json({
      total: result.rows.length,
      equipos: result.rows,
    });
  } catch (error) {
    console.error('[Equipos] Error al listar equipos:', error);
    return res.status(500).json({ error: 'Error al consultar equipos' });
  }
}

// Obtener detalle de un equipo específico
async function getEquipoById(req, res) {
  try {
    const { id } = req.params;
    const { rol, cedula, id: userId } = req.user;

    const result = await db.query(
      `SELECT 
        e.*,
        u.nombre_completo as usuario_asignado_nombre,
        u.email as usuario_asignado_email
      FROM equipos e
      LEFT JOIN usuarios u ON e.usuario_asignado_id = u.id
      WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    const equipo = result.rows[0];

    // Validación RBAC si es empleado
    if (rol === 'EMPLEADO') {
      const isOwner = equipo.cedula_responsable === cedula || equipo.usuario_asignado_id === userId;
      if (!isOwner) {
        return res.status(403).json({ error: 'No tienes permiso para ver los detalles de este equipo' });
      }
    }

    return res.json({ equipo });
  } catch (error) {
    console.error('[Equipos] Error al consultar detalle de equipo:', error);
    return res.status(500).json({ error: 'Error al consultar equipo' });
  }
}

// Crear un nuevo equipo (Solo ADMIN y TECNICO)
async function createEquipo(req, res) {
  try {
    const {
      placa, nombre_equipo, tipo, marca, modelo, serial, procesador, ram,
      almacenamiento, sistema_operativo, estado, sede, area,
      cedula_responsable, responsable_nombre, usuario_asignado_id,
      fecha_mantenimiento, observaciones,
      categoria, modalidad, fecha_operacion, solicitante, recibido_por,
      ip, color, potencia, baterias, peso, proteccion, voltaje_entrada, voltaje_salida,
      disponibilidad, board, acronis, glpi
    } = req.body;

    if (!marca) {
      return res.status(400).json({ error: 'La marca es obligatoria' });
    }

    // Auto-generar placa si viene vacía
    const placaFinal = placa && placa.trim() !== '' ? placa.trim() : `TI-${Date.now().toString().slice(-6)}`;

    // Verificar placa duplicada
    const checkPlaca = await db.query('SELECT id FROM equipos WHERE placa = $1', [placaFinal]);
    if (checkPlaca.rows.length > 0) {
      return res.status(409).json({ error: `Ya existe un equipo con la placa '${placaFinal}'` });
    }

    const insertQuery = `
      INSERT INTO equipos (
        placa, nombre_equipo, tipo, marca, modelo, serial, procesador, ram,
        almacenamiento, sistema_operativo, estado, sede, area,
        cedula_responsable, responsable_nombre, usuario_asignado_id,
        fecha_mantenimiento, observaciones,
        categoria, modalidad, fecha_operacion, solicitante, recibido_por,
        ip, color, potencia, baterias, peso, proteccion, voltaje_entrada, voltaje_salida,
        disponibilidad, board, acronis, glpi
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35
      )
      RETURNING *;
    `;

    const values = [
      placaFinal,
      nombre_equipo || null,
      tipo || 'Laptop',
      marca.trim(),
      modelo || null,
      serial || null,
      procesador || null,
      ram || null,
      almacenamiento || null,
      sistema_operativo || null,
      estado || 'FUNCIONAL',
      sede || null,
      area || null,
      cedula_responsable || null,
      responsable_nombre || null,
      usuario_asignado_id || null,
      fecha_mantenimiento || null,
      observaciones || null,
      categoria || 'EQUIPOS_PRESTAMOS',
      modalidad || 'PROPIO',
      fecha_operacion || null,
      solicitante || null,
      recibido_por || null,
      ip || null,
      color || null,
      potencia || null,
      baterias || null,
      peso || null,
      proteccion || null,
      voltaje_entrada || null,
      voltaje_salida || null,
      disponibilidad || 'OK',
      board || null,
      acronis || null,
      glpi || null,
    ];

    const result = await db.query(insertQuery, values);
    const nuevoEquipo = result.rows[0];

    // Registrar evento de auditoría de creación
    await db.query(
      `INSERT INTO eventos_inventario (equipo_id, usuario_id, tipo_evento, descripcion, detalles)
       VALUES ($1, $2, 'CREACION', $3, $4)`,
      [
        nuevoEquipo.id,
        req.user.id,
        `Creación inicial del activo ${nuevoEquipo.placa} (${nuevoEquipo.marca} ${nuevoEquipo.modelo || ''})`,
        JSON.stringify(nuevoEquipo),
      ]
    );

    // Generación y archivo automático de la Hoja de Vida oficial en segundo plano
    hojaDeVidaService.generarHojaDeVida(nuevoEquipo).catch((err) => {
      console.warn('[HojaDeVida] Generación automática en creación omitida o fallida:', err.message);
    });

    return res.status(201).json({
      message: 'Equipo creado exitosamente',
      equipo: nuevoEquipo,
    });
  } catch (error) {
    console.error('[Equipos] Error al crear equipo:', error);
    return res.status(500).json({ error: 'Error al registrar el equipo' });
  }
}

// Actualizar un equipo existente (Solo ADMIN y TECNICO)
async function updateEquipo(req, res) {
  try {
    const { id } = req.params;
    const {
      placa, nombre_equipo, tipo, marca, modelo, serial, procesador, ram,
      almacenamiento, sistema_operativo, estado, sede, area,
      cedula_responsable, responsable_nombre, usuario_asignado_id,
      fecha_mantenimiento, observaciones,
      categoria, modalidad, fecha_operacion, solicitante, recibido_por,
      ip, color, potencia, baterias, peso, proteccion, voltaje_entrada, voltaje_salida,
      disponibilidad, board, acronis, glpi
    } = req.body;

    const currentRes = await db.query('SELECT * FROM equipos WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }
    const currentEquipo = currentRes.rows[0];

    // Verificar si la placa cambió y ya existe
    if (placa && placa.trim() !== currentEquipo.placa) {
      const checkPlaca = await db.query('SELECT id FROM equipos WHERE placa = $1 AND id != $2', [placa.trim(), id]);
      if (checkPlaca.rows.length > 0) {
        return res.status(409).json({ error: `La placa '${placa.trim()}' ya pertenece a otro equipo` });
      }
    }

    const updateQuery = `
      UPDATE equipos SET
        placa = COALESCE($1, placa),
        nombre_equipo = COALESCE($2, nombre_equipo),
        tipo = COALESCE($3, tipo),
        marca = COALESCE($4, marca),
        modelo = COALESCE($5, modelo),
        serial = COALESCE($6, serial),
        procesador = COALESCE($7, procesador),
        ram = COALESCE($8, ram),
        almacenamiento = COALESCE($9, almacenamiento),
        sistema_operativo = COALESCE($10, sistema_operativo),
        estado = COALESCE($11, estado),
        sede = COALESCE($12, sede),
        area = COALESCE($13, area),
        cedula_responsable = $14,
        responsable_nombre = $15,
        usuario_asignado_id = $16,
        fecha_mantenimiento = $17,
        observaciones = COALESCE($18, observaciones),
        categoria = COALESCE($19, categoria),
        modalidad = COALESCE($20, modalidad),
        fecha_operacion = $21,
        solicitante = $22,
        recibido_por = $23,
        ip = COALESCE($24, ip),
        color = COALESCE($25, color),
        potencia = COALESCE($26, potencia),
        baterias = COALESCE($27, baterias),
        peso = COALESCE($28, peso),
        proteccion = COALESCE($29, proteccion),
        voltaje_entrada = COALESCE($30, voltaje_entrada),
        voltaje_salida = COALESCE($31, voltaje_salida),
        disponibilidad = COALESCE($32, disponibilidad),
        board = COALESCE($33, board),
        acronis = COALESCE($34, acronis),
        glpi = COALESCE($35, glpi),
        updated_at = NOW()
      WHERE id = $36
      RETURNING *;
    `;

    const values = [
      placa ? placa.trim() : null,
      nombre_equipo || null,
      tipo || null,
      marca ? marca.trim() : null,
      modelo || null,
      serial || null,
      procesador || null,
      ram || null,
      almacenamiento || null,
      sistema_operativo || null,
      estado || null,
      sede || null,
      area || null,
      cedula_responsable || null,
      responsable_nombre || null,
      usuario_asignado_id || null,
      fecha_mantenimiento || null,
      observaciones || null,
      categoria || null,
      modalidad || null,
      fecha_operacion || null,
      solicitante || null,
      recibido_por || null,
      ip || null,
      color || null,
      potencia || null,
      baterias || null,
      peso || null,
      proteccion || null,
      voltaje_entrada || null,
      voltaje_salida || null,
      disponibilidad || null,
      board || null,
      acronis || null,
      glpi || null,
      id,
    ];

    const result = await db.query(updateQuery, values);
    const updatedEquipo = result.rows[0];

    // Determinar tipo de evento para auditoría
    let tipoEvento = 'CAMBIO_ESTADO';
    let descripcion = `Actualización de datos del equipo ${updatedEquipo.placa}`;

    if (currentEquipo.cedula_responsable !== updatedEquipo.cedula_responsable || currentEquipo.usuario_asignado_id !== updatedEquipo.usuario_asignado_id) {
      tipoEvento = 'ASIGNACION';
      descripcion = `Cambio de asignación a responsable: ${updatedEquipo.responsable_nombre || updatedEquipo.cedula_responsable || 'Sin asignación'}`;
    } else if (currentEquipo.estado !== updatedEquipo.estado) {
      tipoEvento = updatedEquipo.estado === 'DE_BAJA' ? 'DE_BAJA' : 'CAMBIO_ESTADO';
      descripcion = `Cambio de estado: ${currentEquipo.estado} -> ${updatedEquipo.estado}`;
    }

    await db.query(
      `INSERT INTO eventos_inventario (equipo_id, usuario_id, tipo_evento, descripcion, detalles)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        id,
        req.user.id,
        tipoEvento,
        descripcion,
        JSON.stringify({ anterior: currentEquipo, nuevo: updatedEquipo }),
      ]
    );

    // Actualizar archivo oficial de Hoja de Vida en segundo plano
    hojaDeVidaService.generarHojaDeVida(updatedEquipo).catch((err) => {
      console.warn('[HojaDeVida] Generación automática en actualización omitida o fallida:', err.message);
    });

    return res.json({
      message: 'Equipo actualizado correctamente',
      equipo: updatedEquipo,
    });
  } catch (error) {
    console.error('[Equipos] Error al actualizar equipo:', error);
    return res.status(500).json({ error: 'Error al actualizar el equipo' });
  }
}

// Dar de baja a un equipo (Solo ADMIN)
async function darDeBaja(req, res) {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const current = await db.query('SELECT * FROM equipos WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    const obs = motivo ? `[DADO DE BAJA: ${motivo}] ` + (current.rows[0].observaciones || '') : current.rows[0].observaciones;

    const result = await db.query(
      `UPDATE equipos 
       SET estado = 'DE_BAJA', observaciones = $1, cedula_responsable = NULL, responsable_nombre = NULL, usuario_asignado_id = NULL
       WHERE id = $2 RETURNING *`,
      [obs, id]
    );

    await db.query(
      `INSERT INTO eventos_inventario (equipo_id, usuario_id, tipo_evento, descripcion, detalles)
       VALUES ($1, $2, 'DE_BAJA', $3, $4)`,
      [
        id,
        req.user.id,
        `Baja formal del equipo ${result.rows[0].placa}. Motivo: ${motivo || 'No especificado'}`,
        JSON.stringify({ motivo, fecha: new Date().toISOString() }),
      ]
    );

    return res.json({
      message: 'Equipo dado de baja correctamente',
      equipo: result.rows[0],
    });
  } catch (error) {
    console.error('[Equipos] Error al dar de baja:', error);
    return res.status(500).json({ error: 'Error al procesar la baja del equipo' });
  }
}

// Eliminar equipo (Solo ADMIN)
async function deleteEquipo(req, res) {
  try {
    const { id } = req.params;
    const current = await db.query('SELECT placa, marca, modelo FROM equipos WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    await db.query('DELETE FROM equipos WHERE id = $1', [id]);

    return res.json({
      message: `Equipo ${current.rows[0].placa} eliminado satisfactoriamente`,
    });
  } catch (error) {
    console.error('[Equipos] Error al eliminar equipo:', error);
    return res.status(500).json({ error: 'Error al eliminar el equipo' });
  }
}

// Obtener conteos por cada módulo en tiempo real
async function getConteosModulos(req, res) {
  try {
    const result = await db.query(`
      SELECT 
        COUNT(*) AS todos,
        COUNT(*) FILTER (WHERE categoria = 'EQUIPOS_PRESTAMOS' AND (modalidad IS NULL OR modalidad != 'PRESTAMO_TEMPORAL')) AS equipos_prestamos,
        COUNT(*) FILTER (WHERE categoria = 'PRESTAMOS' OR modalidad = 'PRESTAMO_TEMPORAL') AS prestamos,
        COUNT(*) FILTER (WHERE categoria = 'ALQUILER' OR modalidad = 'ALQUILER' OR area ILIKE '%alquil%') AS alquiler,
        COUNT(*) FILTER (WHERE categoria = 'DEVOLUCIONES' OR modalidad = 'DEVOLUCION' OR area ILIKE '%custod%') AS devoluciones,
        COUNT(*) FILTER (WHERE categoria = 'IMPRESORAS' OR tipo ILIKE '%impresora%') AS impresoras,
        COUNT(*) FILTER (WHERE categoria = 'ELEMENTOS' OR tipo IN ('TABLETA', 'CAMARAS', 'Camara', 'ROUTER', 'Modem', 'BIOMETRICOS', 'LECTOR', 'MULTIPUERTOS', 'ANTENA', 'SIM', 'SCANNER DS - 640', 'DISCO EXTERNO 2 TB')) AS elementos,
        COUNT(*) FILTER (WHERE categoria = 'PERIFERICOS' OR tipo IN ('HUELLERO', 'Periférico', 'Monitor', 'Teclado')) AS perifericos,
        COUNT(*) FILTER (WHERE categoria = 'UPS' OR tipo ILIKE '%ups%') AS ups,
        COUNT(*) FILTER (WHERE categoria = 'BAJAS' OR estado = 'DE_BAJA') AS bajas
      FROM equipos;
    `);
    const row = result.rows[0];
    return res.json({
      conteos: {
        ...row,
        prestamos_temporales: row.prestamos,
      },
    });
  } catch (error) {
    console.error('[Equipos] Error al obtener conteos:', error);
    return res.status(500).json({ error: 'Error al consultar conteos de módulos' });
  }
}

// Registrar entrega de equipo en calidad de préstamo temporal
async function registrarPrestamo(req, res) {
  try {
    const { id } = req.params;
    const { responsable_nombre, cedula_responsable, sede, area, observaciones, solicitante } = req.body;

    const check = await db.query('SELECT * FROM equipos WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Equipo no encontrado' });

    let usuarioId = null;
    if (cedula_responsable) {
      const uRes = await db.query('SELECT id FROM usuarios WHERE cedula = $1', [cedula_responsable]);
      if (uRes.rows.length > 0) usuarioId = uRes.rows[0].id;
    }

    const obsText = observaciones ? `Préstamo Temporal: ${observaciones}` : 'Equipo entregado en préstamo temporal por unos días';
    const updated = await db.query(
      `UPDATE equipos 
       SET area = COALESCE($1, 'PRESTADO'),
           responsable_nombre = $2,
           cedula_responsable = $3,
           usuario_asignado_id = $4,
           sede = COALESCE($5, sede),
           categoria = 'PRESTAMOS',
           modalidad = 'PRESTAMO_TEMPORAL',
           fecha_operacion = CURRENT_DATE,
           solicitante = COALESCE($6, $2),
           observaciones = CASE WHEN observaciones IS NOT NULL AND observaciones != '' THEN observaciones || ' | ' || $7 ELSE $7 END,
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [area || 'PRESTADO', responsable_nombre, cedula_responsable, usuarioId, sede, solicitante, obsText, id]
    );

    await db.query(
      `INSERT INTO eventos_inventario (equipo_id, usuario_id, tipo_evento, descripcion, detalles)
       VALUES ($1, $2, 'PRESTAMO', $3, $4)`,
      [
        id,
        req.user.id,
        `Equipo entregado en préstamo temporal a ${responsable_nombre || 'responsable'} (C.C. ${cedula_responsable || 'S/N'})`,
        JSON.stringify({ responsable_nombre, cedula_responsable, sede, area, solicitante })
      ]
    );

    // Actualizar archivo de Hoja de Vida con el nuevo responsable del préstamo
    hojaDeVidaService.generarHojaDeVida(updated.rows[0]).catch((err) => {
      console.warn('[HojaDeVida] Generación en préstamo omitida o fallida:', err.message);
    });

    return res.json({ message: 'Préstamo temporal registrado exitosamente', equipo: updated.rows[0] });
  } catch (error) {
    console.error('[Equipos] Error al registrar préstamo:', error);
    return res.status(500).json({ error: 'Error al registrar préstamo' });
  }
}

// Registrar retorno de equipo a custodia / almacén de TI
async function registrarDevolucion(req, res) {
  try {
    const { id } = req.params;
    const { quien_recibe, observaciones, sede } = req.body;

    const check = await db.query('SELECT * FROM equipos WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Equipo no encontrado' });

    const prevResponsable = check.rows[0].responsable_nombre;
    const personaRecibe = quien_recibe || req.user.nombre_completo || 'Custodia TI';

    const updated = await db.query(
      `UPDATE equipos 
       SET area = 'CUSTODIA',
           responsable_nombre = 'CUSTODIA',
           cedula_responsable = NULL,
           usuario_asignado_id = NULL,
           sede = COALESCE($1, sede),
           categoria = 'DEVOLUCIONES',
           modalidad = 'DEVOLUCION',
           fecha_operacion = CURRENT_DATE,
           recibido_por = $2,
           observaciones = CASE WHEN observaciones IS NOT NULL AND observaciones != '' THEN observaciones || ' | Devuelto a custodia' ELSE 'Devuelto a custodia' END,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [sede, personaRecibe, id]
    );

    await db.query(
      `INSERT INTO eventos_inventario (equipo_id, usuario_id, tipo_evento, descripcion, detalles)
       VALUES ($1, $2, 'DEVOLUCION', $3, $4)`,
      [
        id,
        req.user.id,
        `Equipo devuelto a Custodia/Almacén TI. Recibido por: ${personaRecibe}. Responsable anterior: ${prevResponsable || 'N/A'}`,
        JSON.stringify({ quien_recibe: personaRecibe, responsable_previo: prevResponsable, observaciones })
      ]
    );

    // Actualizar archivo de Hoja de Vida reflejando custodia
    hojaDeVidaService.generarHojaDeVida(updated.rows[0]).catch((err) => {
      console.warn('[HojaDeVida] Generación en devolución omitida o fallida:', err.message);
    });

    return res.json({ message: 'Devolución registrada exitosamente', equipo: updated.rows[0] });
  } catch (error) {
    console.error('[Equipos] Error al registrar devolución:', error);
    return res.status(500).json({ error: 'Error al registrar devolución' });
  }
}

// Reportar falla técnica (Autoservicio para Empleados y Gestión TI)
async function reportarFallo(req, res) {
  try {
    const { id } = req.params;
    const { descripcion_falla, criticidad } = req.body;
    const { rol, cedula, id: userId, nombre_completo } = req.user;

    const check = await db.query('SELECT * FROM equipos WHERE id = $1', [id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Equipo no encontrado' });

    const equipo = check.rows[0];

    if (rol === 'EMPLEADO' && equipo.cedula_responsable !== cedula && equipo.usuario_asignado_id !== userId) {
      return res.status(403).json({ error: 'Solo puedes reportar fallas de tus equipos asignados' });
    }

    const nuevoEstado = (criticidad === 'ALTA' || criticidad === 'BLOQUEANTE') ? 'DAÑADO' : 'REVISAR';

    const updated = await db.query(
      `UPDATE equipos 
       SET estado = $1,
           observaciones = CASE WHEN observaciones IS NOT NULL AND observaciones != '' THEN observaciones || ' | Novedad: ' || $2 ELSE 'Novedad: ' || $2 END,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [nuevoEstado, descripcion_falla, id]
    );

    await db.query(
      `INSERT INTO eventos_inventario (equipo_id, usuario_id, tipo_evento, descripcion, detalles)
       VALUES ($1, $2, 'REPORTE_FALLO', $3, $4)`,
      [
        id,
        userId,
        `Falla reportada por ${nombre_completo}: ${descripcion_falla}`,
        JSON.stringify({ criticidad: criticidad || 'MEDIA', descripcion_falla, nuevoEstado })
      ]
    );

    return res.json({ message: 'Falla reportada exitosamente al equipo de TI', equipo: updated.rows[0] });
  } catch (error) {
    console.error('[Equipos] Error al reportar falla:', error);
    return res.status(500).json({ error: 'Error al procesar reporte de falla' });
  }
}

// Obtener resumen agrupado de asignaciones por Áreas y por Sedes
async function getResumenAsignaciones(req, res) {
  try {
    const areasRes = await db.query(`
      SELECT 
        COALESCE(NULLIF(TRIM(area), ''), 'SIN AREA') AS area,
        COUNT(*) AS total_equipos
      FROM equipos
      WHERE estado != 'DE_BAJA'
      GROUP BY COALESCE(NULLIF(TRIM(area), ''), 'SIN AREA')
      ORDER BY total_equipos DESC
    `);

    const sedesRes = await db.query(`
      SELECT 
        COALESCE(NULLIF(TRIM(sede), ''), 'SIN SEDE') AS sede,
        COUNT(*) AS total_equipos
      FROM equipos
      WHERE estado != 'DE_BAJA'
      GROUP BY COALESCE(NULLIF(TRIM(sede), ''), 'SIN SEDE')
      ORDER BY total_equipos DESC
    `);

    return res.json({
      areas: areasRes.rows,
      sedes: sedesRes.rows,
    });
  } catch (error) {
    console.error('[Equipos] Error al obtener resumen de asignaciones:', error);
    return res.status(500).json({ error: 'Error al consultar resumen de asignaciones' });
  }
}

// Descargar Hoja de Vida en formato oficial .xlsx
async function descargarHojaDeVida(req, res) {
  try {
    const { id } = req.params;
    const { rol, cedula, id: userId } = req.user;

    const result = await db.query(
      `SELECT 
        e.*,
        u.nombre_completo as usuario_asignado_nombre,
        u.email as usuario_asignado_email,
        u.cargo as usuario_cargo,
        u.rol as usuario_rol
      FROM equipos e
      LEFT JOIN usuarios u ON e.usuario_asignado_id = u.id
      WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    const equipo = result.rows[0];

    // Validación RBAC si es empleado
    if (rol === 'EMPLEADO') {
      const isOwner = equipo.cedula_responsable === cedula || equipo.usuario_asignado_id === userId;
      if (!isOwner) {
        return res.status(403).json({ error: 'No tienes permiso para descargar la hoja de vida de este equipo' });
      }
    }

    const archivoGenerado = await hojaDeVidaService.generarHojaDeVida(equipo);

    return res.download(archivoGenerado.filePath, archivoGenerado.fileName, (err) => {
      if (err && !res.headersSent) {
        console.error('[Equipos] Error al enviar archivo de hoja de vida:', err);
        return res.status(500).json({ error: 'Error al descargar la Hoja de Vida' });
      }
    });
  } catch (error) {
    console.error('[Equipos] Error al generar Hoja de Vida:', error);
    return res.status(500).json({ error: 'Error al generar la Hoja de Vida del equipo: ' + error.message });
  }
}

module.exports = {
  getEquipos,
  getEquipoById,
  getConteosModulos,
  getResumenAsignaciones,
  createEquipo,
  updateEquipo,
  darDeBaja,
  deleteEquipo,
  registrarPrestamo,
  registrarDevolucion,
  reportarFallo,
  descargarHojaDeVida,
};

