const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'inventario_db',
  user: process.env.DB_USER || 'inventario_user',
  password: process.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('[Worker DB] Error en pool de base de datos:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
