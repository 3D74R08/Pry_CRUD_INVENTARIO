const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'inventario_db',
  user: process.env.DB_USER || 'inventario_user',
  password: process.env.DB_PASSWORD || 'inventario_secret_pass_2026',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('[DB] Error inesperado en el cliente del pool:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
