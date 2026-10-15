const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const equiposRoutes = require('./routes/equiposRoutes');
const eventosRoutes = require('./routes/eventosRoutes');
const tareasRoutes = require('./routes/tareasRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const { generalLimiter } = require('./middlewares/rateLimiter');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración de proxy para correcta captura de IP cliente tras Docker o Nginx
app.set('trust proxy', 1);

// Middlewares de seguridad y observabilidad
app.use(helmet());

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : '*';
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Limitador de tasa general para endpoints de la API
app.use('/api', generalLimiter);

// Endpoint de verificación de salud
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'activos-ti-api-core',
    timestamp: new Date().toISOString(),
  });
});

// Enrutamiento de la API
app.use('/api/auth', authRoutes);
app.use('/api/equipos', equiposRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/tareas', tareasRoutes);
app.use('/api/usuarios', usuariosRoutes);

// Manejador de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error('[Error No Controlado]:', err);
  if (err.message && err.message.includes('Solo se permiten archivos')) {
    return res.status(400).json({ error: err.message });
  }
  return res.status(500).json({ error: 'Error interno en el servidor API Core' });
});

// Sincronización automática no bloqueante del esquema de Hoja de Vida
(async () => {
  try {
    const db = require('./config/db');
    await db.query(`
      ALTER TABLE equipos ADD COLUMN IF NOT EXISTS cargo VARCHAR(100);
      ALTER TABLE equipos ADD COLUMN IF NOT EXISTS codigo_interno VARCHAR(100);
      ALTER TABLE equipos ADD COLUMN IF NOT EXISTS software_instalado TEXT;
      CREATE TABLE IF NOT EXISTS hoja_vida_acciones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
        accion_realizada VARCHAR(150) NOT NULL,
        fecha DATE NOT NULL DEFAULT CURRENT_DATE,
        procedimiento_realizado TEXT NOT NULL,
        realizado_por VARCHAR(150),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_hoja_vida_acciones_equipo ON hoja_vida_acciones(equipo_id, fecha ASC);
    `);
    console.log('[DB] Esquema de Hoja de Vida verificado y sincronizado correctamente');
  } catch (err) {
    console.warn('[DB] Verificación de esquema de Hoja de Vida:', err.message);
  }
})();

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`[API Core] Servidor escuchando activamente en el puerto ${PORT}`);
  console.log(`[API Core] Entorno: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
