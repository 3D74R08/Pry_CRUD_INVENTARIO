const db = require('../config/db');

// Obtener trazabilidad de un equipo específico
async function getEventosByEquipo(req, res) {
  try {
    const { equipoId } = req.params;
    const { rol, cedula, id: userId } = req.user;

    // Si es empleado, validar que el equipo esté asignado a él
    if (rol === 'EMPLEADO') {
      const checkEquipo = await db.query(
        'SELECT id FROM equipos WHERE id = $1 AND (cedula_responsable = $2 OR usuario_asignado_id = $3)',
        [equipoId, cedula, userId]
      );
      if (checkEquipo.rows.length === 0) {
        return res.status(403).json({ error: 'No tienes permiso para ver la trazabilidad de este equipo' });
      }
    }

    const result = await db.query(
      `SELECT 
        e.*,
        u.nombre_completo as usuario_nombre,
        u.email as usuario_email
       FROM eventos_inventario e
       LEFT JOIN usuarios u ON e.usuario_id = u.id
       WHERE e.equipo_id = $1
       ORDER BY e.fecha_evento DESC`,
      [equipoId]
    );

    return res.json({ eventos: result.rows });
  } catch (error) {
    console.error('[Eventos] Error al consultar eventos por equipo:', error);
    return res.status(500).json({ error: 'Error al consultar historial del equipo' });
  }
}

// Obtener feed de eventos recientes para el Dashboard
async function getEventosRecientes(req, res) {
  try {
    const { rol, cedula, id: userId } = req.user;

    let query = `
      SELECT 
        ev.*,
        eq.placa as equipo_placa,
        eq.tipo as equipo_tipo,
        eq.marca as equipo_marca,
        eq.modelo as equipo_modelo,
        COALESCE(u.nombre_completo, 'Administrador TI / Sistema') as usuario_nombre,
        u.email as usuario_email
      FROM eventos_inventario ev
      JOIN equipos eq ON ev.equipo_id = eq.id
      LEFT JOIN usuarios u ON ev.usuario_id = u.id
    `;
    const params = [];

    if (rol === 'EMPLEADO') {
      params.push(cedula);
      params.push(userId);
      query += ` WHERE (eq.cedula_responsable = $1 OR eq.usuario_asignado_id = $2)`;
    }

    query += ` ORDER BY ev.fecha_evento DESC LIMIT 30`;

    const result = await db.query(query, params);
    return res.json({ eventos: result.rows });
  } catch (error) {
    console.error('[Eventos] Error al consultar eventos recientes:', error);
    return res.status(500).json({ error: 'Error al consultar feed de eventos' });
  }
}

// Obtener feed de eventos para Control de Cambios con filtros
async function getAllEventos(req, res) {
  try {
    const { tipo_evento, busqueda, limit = 50, offset = 0 } = req.query;
    const { rol, cedula, id: userId } = req.user;

    let query = `
      SELECT 
        ev.*,
        eq.placa as equipo_placa,
        eq.tipo as equipo_tipo,
        eq.marca as equipo_marca,
        eq.modelo as equipo_modelo,
        COALESCE(u.nombre_completo, 'Administrador TI / Sistema') as usuario_nombre,
        u.email as usuario_email
      FROM eventos_inventario ev
      JOIN equipos eq ON ev.equipo_id = eq.id
      LEFT JOIN usuarios u ON ev.usuario_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let pIndex = 1;

    if (rol === 'EMPLEADO') {
      params.push(cedula, userId);
      query += ` AND (eq.cedula_responsable = $${pIndex++} OR eq.usuario_asignado_id = $${pIndex++})`;
    }

    if (tipo_evento) {
      params.push(tipo_evento);
      query += ` AND ev.tipo_evento = $${pIndex++}`;
    }

    if (busqueda) {
      params.push(`%${busqueda}%`);
      query += ` AND (eq.placa ILIKE $${pIndex} OR eq.modelo ILIKE $${pIndex} OR u.nombre_completo ILIKE $${pIndex} OR ev.detalles::text ILIKE $${pIndex})`;
      pIndex++;
    }

    query += ` ORDER BY ev.fecha_evento DESC LIMIT $${pIndex++} OFFSET $${pIndex++}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const result = await db.query(query, params);
    return res.json({ eventos: result.rows });
  } catch (error) {
    console.error('[Eventos] Error al consultar historial completo de eventos:', error);
    return res.status(500).json({ error: 'Error al consultar control de cambios' });
  }
}


// Obtener métricas agregadas completas para el Dashboard y Reportes
async function getMetricasDashboard(req, res) {
  try {
    const { rol, cedula, id: userId } = req.user;

    let whereClause = '';
    const params = [];
    if (rol === 'EMPLEADO') {
      params.push(cedula);
      params.push(userId);
      whereClause = ' WHERE (cedula_responsable = $1 OR usuario_asignado_id = $2)';
    }

    // 1. Resumen global
    const totalEquiposRes = await db.query(`SELECT count(*) as total FROM equipos ${whereClause}`, params);
    const usuariosActivosRes = await db.query(`SELECT count(*) as total FROM usuarios WHERE activo = true`);
    const tareasEnProcesoRes = await db.query(`SELECT count(*) as total FROM tareas_worker WHERE estado IN ('PENDIENTE', 'EN_PROCESO')`);
    const tareasCompletadasRes = await db.query(`SELECT count(*) as total FROM tareas_worker WHERE estado = 'COMPLETADO'`);

    // 2. Equipos por tipo (para gráfico Donut)
    const porTipoRes = await db.query(
      `SELECT COALESCE(tipo, 'Otros') as tipo, count(*) as cantidad 
       FROM equipos ${whereClause} 
       GROUP BY tipo 
       ORDER BY cantidad DESC`,
      params
    );

    // 3. Equipos por estado
    const porEstadoRes = await db.query(
      `SELECT COALESCE(estado, 'FUNCIONAL') as estado, count(*) as cantidad 
       FROM equipos ${whereClause} 
       GROUP BY estado 
       ORDER BY cantidad DESC`,
      params
    );

    // 4. Equipos por sede
    const porSedeRes = await db.query(
      `SELECT COALESCE(sede, 'Principal') as sede, count(*) as cantidad 
       FROM equipos ${whereClause} 
       GROUP BY sede 
       ORDER BY cantidad DESC 
       LIMIT 8`,
      params
    );

    return res.json({
      resumen: {
        totalEquipos: parseInt(totalEquiposRes.rows[0].total, 10),
        usuariosActivos: parseInt(usuariosActivosRes.rows[0].total, 10),
        tareasEnProceso: parseInt(tareasEnProcesoRes.rows[0].total, 10),
        tareasCompletadas: parseInt(tareasCompletadasRes.rows[0].total, 10),
      },
      porTipo: porTipoRes.rows.map(r => ({ tipo: r.tipo, cantidad: parseInt(r.cantidad, 10) })),
      porEstado: porEstadoRes.rows.map(r => ({ estado: r.estado, cantidad: parseInt(r.cantidad, 10) })),
      porSede: porSedeRes.rows.map(r => ({ sede: r.sede, cantidad: parseInt(r.cantidad, 10) })),
    });
  } catch (error) {
    console.error('[Eventos] Error al consultar métricas de dashboard:', error);
    return res.status(500).json({ error: 'Error al consultar métricas del dashboard' });
  }
}

module.exports = {
  getEventosByEquipo,
  getEventosRecientes,
  getAllEventos,
  getMetricasDashboard,
};
