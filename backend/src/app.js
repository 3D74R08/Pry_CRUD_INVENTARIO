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

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares de seguridad y observabilidad
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

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

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`[API Core] Servidor escuchando activamente en el puerto ${PORT}`);
  console.log(`[API Core] Entorno: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
