const { Pool } = require('pg');
const { AsyncLocalStorage } = require('node:async_hooks');
require('dotenv').config();

const rlsContext = new AsyncLocalStorage();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'inventario_db',
  user: process.env.DB_USER || 'inventario_user',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('[DB] Error inesperado en el cliente del pool:', err);
});

async function query(text, params) {
  const userCtx = rlsContext.getStore();
  if (!userCtx || !userCtx.id) {
    return pool.query(text, params);
  }

  const client = await pool.connect();
  try {
    await client.query(
      `SELECT
         set_config('app.current_user_id', $1, false),
         set_config('app.current_user_rol', $2, false),
         set_config('app.current_user_cedula', $3, false)`,
      [String(userCtx.id || ''), String(userCtx.rol || ''), String(userCtx.cedula || '')]
    );
    return await client.query(text, params);
  } finally {
    try {
      await client.query(
        `SELECT
           set_config('app.current_user_id', '', false),
           set_config('app.current_user_rol', '', false),
           set_config('app.current_user_cedula', '', false)`
      );
    } catch {
      // Ignorar si la conexión se cerró
    }
    client.release();
  }
}

function runWithRlsContext(user, callback) {
  return rlsContext.run(
    {
      id: user?.id || '',
      rol: user?.rol || '',
      cedula: user?.cedula || '',
    },
    callback
  );
}

module.exports = {
  query,
  pool,
  runWithRlsContext,
};
