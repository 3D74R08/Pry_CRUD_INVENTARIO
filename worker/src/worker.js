const db = require('./db');
const { procesarArchivo } = require('./processor');

const POLL_INTERVAL_MS = parseInt(process.env.WORKER_POLL_INTERVAL_MS || '5000', 10);

console.log('========================================================');
console.log('[Worker Autónomo] Iniciando servicio de procesamiento asíncrono');
console.log(`[Worker Autónomo] Intervalo de Database Polling: ${POLL_INTERVAL_MS} ms`);
console.log('========================================================');

let isProcessing = false;

async function pollTareas() {
  if (isProcessing) return;

  const client = await db.pool.connect();
  let tarea = null;

  try {
    await client.query('BEGIN');

    // Patrón concurrente seguro: SELECT FOR UPDATE SKIP LOCKED
    // Previene condiciones de carrera si existen múltiples réplicas del worker
    const query = `
      SELECT * FROM tareas_worker
      WHERE estado = 'PENDIENTE'
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED;
    `;

    const result = await client.query(query);

    if (result.rows.length > 0) {
      tarea = result.rows[0];
      await client.query(
        `UPDATE tareas_worker
         SET estado = 'EN_PROCESO', started_at = NOW()
         WHERE id = $1;`,
        [tarea.id]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Worker] Error durante el sondeo y bloqueo de tareas:', err);
  } finally {
    client.release();
  }

  // Si encontramos una tarea pendiente, la procesamos
  if (tarea) {
    isProcessing = true;
    console.log(`[Worker] Tarea encontrada [${tarea.id}] - Tipo: ${tarea.tipo_tarea} - Archivo: ${tarea.archivo_nombre}`);

    try {
      const resultado = await procesarArchivo(tarea);

      await db.query(
        `UPDATE tareas_worker
         SET estado = 'COMPLETADO', completed_at = NOW(), resultado = $1
         WHERE id = $2;`,
        [JSON.stringify(resultado), tarea.id]
      );

      console.log(`[Worker] Tarea [${tarea.id}] COMPLETADA exitosamente.`);
      console.log(`[Worker] Resumen: Total=${resultado.totalLeidos}, Creados=${resultado.insertados}, Actualizados=${resultado.actualizados}, Fallidos=${resultado.fallidos}`);
    } catch (err) {
      console.error(`[Worker] Error crítico al procesar tarea [${tarea.id}]:`, err);

      await db.query(
        `UPDATE tareas_worker
         SET estado = 'FALLIDO', completed_at = NOW(), error_mensaje = $1
         WHERE id = $2;`,
        [err.message || 'Error desconocido durante el procesamiento', tarea.id]
      );
    } finally {
      isProcessing = false;
      // Probar inmediatamente por si hay más tareas en cola
      setImmediate(pollTareas);
      return;
    }
  }
}

// Bucle recurrente de sondeo (Database Polling)
setInterval(pollTareas, POLL_INTERVAL_MS);

// Ejecutar primer sondeo al arrancar
setTimeout(pollTareas, 1000);
