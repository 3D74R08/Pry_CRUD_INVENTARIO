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
const { validateAndSanitizeInputs } = require('./middlewares/validateInput');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración de proxy para correcta captura de IP cliente tras Docker o Nginx
app.set('trust proxy', 1);

// Middlewares de seguridad y observabilidad
app.use(helmet());

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['https://localhost', 'http://localhost', 'http://localhost:5173', 'https://127.0.0.1', 'http://127.0.0.1'];
app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir peticiones same-origin o sin cabecera Origin (ej. proxy Nginx interno)
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Limitador de tasa general y validación estricta de entradas para endpoints de la API
app.use('/api', generalLimiter);
app.use('/api', validateAndSanitizeInputs);

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

// Manejador global de errores (Sin exposición de stack traces ni rutas internas)
app.use((err, req, res, next) => {
  console.error('[Error No Controlado]:', err);
  if (err.message && err.message.includes('Solo se permiten archivos')) {
    return res.status(400).json({ error: err.message });
  }
  return res.status(500).json({ error: 'Error interno en el servidor API Core' });
});

// Sincronización automática no bloqueante de esquema, RLS, mínimo privilegio y control de sesiones
(async () => {
  try {
    const db = require('./config/db');
    await db.pool.query(`
      ALTER TABLE equipos ADD COLUMN IF NOT EXISTS cargo VARCHAR(100);
      ALTER TABLE equipos ADD COLUMN IF NOT EXISTS codigo_interno VARCHAR(100);
      ALTER TABLE equipos ADD COLUMN IF NOT EXISTS software_instalado TEXT;
      ALTER TABLE equipos ADD COLUMN IF NOT EXISTS accesorios TEXT;
      ALTER TABLE equipos ADD COLUMN IF NOT EXISTS board VARCHAR(100);
      ALTER TABLE equipos ADD COLUMN IF NOT EXISTS acronis VARCHAR(50);
      ALTER TABLE equipos ADD COLUMN IF NOT EXISTS glpi VARCHAR(50);
      ALTER TABLE equipos ADD COLUMN IF NOT EXISTS disponibilidad VARCHAR(50) DEFAULT 'OK';
      ALTER TABLE equipos ADD COLUMN IF NOT EXISTS color VARCHAR(50);
      ALTER TABLE equipos ADD COLUMN IF NOT EXISTS potencia VARCHAR(100);
      ALTER TABLE equipos ADD COLUMN IF NOT EXISTS baterias VARCHAR(100);
      ALTER TABLE equipos ADD COLUMN IF NOT EXISTS peso VARCHAR(50);
      ALTER TABLE equipos ADD COLUMN IF NOT EXISTS proteccion VARCHAR(100);
      ALTER TABLE equipos ADD COLUMN IF NOT EXISTS voltaje_entrada VARCHAR(50);
      ALTER TABLE equipos ADD COLUMN IF NOT EXISTS voltaje_salida VARCHAR(50);
      ALTER TABLE equipos ADD COLUMN IF NOT EXISTS ip VARCHAR(50);
      ALTER TABLE equipos ADD COLUMN IF NOT EXISTS solicitante VARCHAR(150);
      ALTER TABLE equipos ADD COLUMN IF NOT EXISTS recibido_por VARCHAR(150);
      ALTER TABLE equipos ADD COLUMN IF NOT EXISTS fecha_operacion DATE;
      ALTER TABLE equipos ADD COLUMN IF NOT EXISTS categoria VARCHAR(50) DEFAULT 'EQUIPOS_PRESTAMOS';
      ALTER TABLE equipos ADD COLUMN IF NOT EXISTS modalidad VARCHAR(50) DEFAULT 'PROPIO';

      -- Soporte para Autenticación Multifactor (MFA - TOTP RFC 6238)
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS mfa_secret VARCHAR(128);
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT;

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
      CREATE INDEX IF NOT EXISTS idx_eventos_usuario_id ON eventos_inventario(usuario_id);
      CREATE INDEX IF NOT EXISTS idx_tareas_creado_por ON tareas_worker(creado_por);

      -- Tabla de sesiones revocadas (Control de cierre e invalidación de sesión)
      CREATE TABLE IF NOT EXISTS sesiones_revocadas (
        jti VARCHAR(100) PRIMARY KEY,
        usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
        revocado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expira_en TIMESTAMPTZ NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sesiones_revocadas_expira ON sesiones_revocadas(expira_en);
      CREATE INDEX IF NOT EXISTS idx_sesiones_revocadas_usuario ON sesiones_revocadas(usuario_id);

      -- Garantizar que al eliminar un equipo su historial de auditoría sea INMUTABLE (ON DELETE SET NULL)
      ALTER TABLE eventos_inventario DROP CONSTRAINT IF EXISTS eventos_inventario_equipo_id_fkey;
      ALTER TABLE eventos_inventario
        ADD CONSTRAINT eventos_inventario_equipo_id_fkey
        FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE SET NULL;

      ALTER TABLE eventos_inventario DROP CONSTRAINT IF EXISTS eventos_inventario_tipo_evento_check;
      ALTER TABLE eventos_inventario
        ADD CONSTRAINT eventos_inventario_tipo_evento_check
        CHECK (tipo_evento IN ('CREACION', 'ASIGNACION', 'DEVOLUCION', 'CAMBIO_ESTADO', 'MANTENIMIENTO', 'DE_BAJA', 'CARGA_MASIVA', 'PRESTAMO', 'REPORTE_FALLO', 'ELIMINACION'));

      -- Respaldar metadatos del equipo en detalles para eventos existentes
      UPDATE eventos_inventario ev
      SET detalles = COALESCE(ev.detalles, '{}'::jsonb) || jsonb_build_object(
        'equipo_placa', eq.placa,
        'equipo_marca', eq.marca,
        'equipo_modelo', eq.modelo,
        'equipo_tipo', eq.tipo
      )
      FROM equipos eq
      WHERE ev.equipo_id = eq.id
        AND (ev.detalles->>'equipo_placa') IS NULL;

      -- Rol de mínimo privilegio sin BYPASSRLS ni SUPERUSER
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_inventario_role') THEN
          CREATE ROLE app_inventario_role NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
        END IF;
      END
      $$;

      GRANT USAGE ON SCHEMA public TO app_inventario_role;
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_inventario_role;

      -- Habilitar y forzar RLS en todas las tablas sensibles (incluso para el propietario de la tabla)
      ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
      ALTER TABLE usuarios FORCE ROW LEVEL SECURITY;
      ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;
      ALTER TABLE equipos FORCE ROW LEVEL SECURITY;
      ALTER TABLE eventos_inventario ENABLE ROW LEVEL SECURITY;
      ALTER TABLE eventos_inventario FORCE ROW LEVEL SECURITY;
      ALTER TABLE hoja_vida_acciones ENABLE ROW LEVEL SECURITY;
      ALTER TABLE hoja_vida_acciones FORCE ROW LEVEL SECURITY;
      ALTER TABLE tareas_worker ENABLE ROW LEVEL SECURITY;
      ALTER TABLE tareas_worker FORCE ROW LEVEL SECURITY;
      ALTER TABLE sesiones_revocadas ENABLE ROW LEVEL SECURITY;
      ALTER TABLE sesiones_revocadas FORCE ROW LEVEL SECURITY;

      -- Políticas RLS: equipos
      DROP POLICY IF EXISTS equipos_select_policy ON equipos;
      CREATE POLICY equipos_select_policy ON equipos FOR SELECT
        USING (
          COALESCE(current_setting('app.current_user_rol', true), '') IN ('', 'ADMIN', 'TECNICO', 'SYSTEM')
          OR cedula_responsable = current_setting('app.current_user_cedula', true)
          OR usuario_asignado_id::text = current_setting('app.current_user_id', true)
        );

      DROP POLICY IF EXISTS equipos_insert_policy ON equipos;
      CREATE POLICY equipos_insert_policy ON equipos FOR INSERT
        WITH CHECK (
          COALESCE(current_setting('app.current_user_rol', true), '') IN ('', 'ADMIN', 'TECNICO', 'SYSTEM')
        );

      DROP POLICY IF EXISTS equipos_update_policy ON equipos;
      CREATE POLICY equipos_update_policy ON equipos FOR UPDATE
        USING (
          COALESCE(current_setting('app.current_user_rol', true), '') IN ('', 'ADMIN', 'TECNICO', 'SYSTEM')
          OR cedula_responsable = current_setting('app.current_user_cedula', true)
          OR usuario_asignado_id::text = current_setting('app.current_user_id', true)
        )
        WITH CHECK (
          COALESCE(current_setting('app.current_user_rol', true), '') IN ('', 'ADMIN', 'TECNICO', 'SYSTEM')
          OR cedula_responsable = current_setting('app.current_user_cedula', true)
          OR usuario_asignado_id::text = current_setting('app.current_user_id', true)
        );

      DROP POLICY IF EXISTS equipos_delete_policy ON equipos;
      CREATE POLICY equipos_delete_policy ON equipos FOR DELETE
        USING (
          COALESCE(current_setting('app.current_user_rol', true), '') IN ('', 'ADMIN', 'SYSTEM')
        );

      -- Políticas RLS: eventos_inventario (Con WITH CHECK anti-suplantación y denegación de DELETE)
      DROP POLICY IF EXISTS eventos_select_policy ON eventos_inventario;
      CREATE POLICY eventos_select_policy ON eventos_inventario FOR SELECT
        USING (
          COALESCE(current_setting('app.current_user_rol', true), '') IN ('', 'ADMIN', 'TECNICO', 'SYSTEM')
          OR usuario_id::text = current_setting('app.current_user_id', true)
          OR EXISTS (
            SELECT 1 FROM equipos eq
            WHERE eq.id = eventos_inventario.equipo_id
              AND (
                eq.cedula_responsable = current_setting('app.current_user_cedula', true)
                OR eq.usuario_asignado_id::text = current_setting('app.current_user_id', true)
              )
          )
        );

      DROP POLICY IF EXISTS eventos_insert_policy ON eventos_inventario;
      CREATE POLICY eventos_insert_policy ON eventos_inventario FOR INSERT
        WITH CHECK (
          COALESCE(current_setting('app.current_user_id', true), '') = ''
          OR usuario_id IS NULL
          OR usuario_id::text = current_setting('app.current_user_id', true)
          OR current_setting('app.current_user_rol', true) = 'ADMIN'
        );

      DROP POLICY IF EXISTS eventos_update_policy ON eventos_inventario;
      CREATE POLICY eventos_update_policy ON eventos_inventario FOR UPDATE
        USING (
          COALESCE(current_setting('app.current_user_rol', true), '') IN ('', 'ADMIN', 'SYSTEM')
        )
        WITH CHECK (
          COALESCE(current_setting('app.current_user_rol', true), '') IN ('', 'ADMIN', 'SYSTEM')
        );

      DROP POLICY IF EXISTS eventos_delete_policy ON eventos_inventario;
      CREATE POLICY eventos_delete_policy ON eventos_inventario FOR DELETE
        USING (false);

      -- Políticas RLS: usuarios
      DROP POLICY IF EXISTS usuarios_select_policy ON usuarios;
      CREATE POLICY usuarios_select_policy ON usuarios FOR SELECT
        USING (
          COALESCE(current_setting('app.current_user_rol', true), '') IN ('', 'ADMIN', 'TECNICO', 'SYSTEM')
          OR id::text = current_setting('app.current_user_id', true)
        );

      DROP POLICY IF EXISTS usuarios_insert_policy ON usuarios;
      CREATE POLICY usuarios_insert_policy ON usuarios FOR INSERT
        WITH CHECK (
          COALESCE(current_setting('app.current_user_rol', true), '') IN ('', 'ADMIN', 'SYSTEM')
        );

      DROP POLICY IF EXISTS usuarios_update_policy ON usuarios;
      CREATE POLICY usuarios_update_policy ON usuarios FOR UPDATE
        USING (
          COALESCE(current_setting('app.current_user_rol', true), '') IN ('', 'ADMIN', 'SYSTEM')
          OR id::text = current_setting('app.current_user_id', true)
        )
        WITH CHECK (
          COALESCE(current_setting('app.current_user_rol', true), '') IN ('', 'ADMIN', 'SYSTEM')
          OR id::text = current_setting('app.current_user_id', true)
        );

      DROP POLICY IF EXISTS usuarios_delete_policy ON usuarios;
      CREATE POLICY usuarios_delete_policy ON usuarios FOR DELETE
        USING (
          COALESCE(current_setting('app.current_user_rol', true), '') IN ('', 'ADMIN', 'SYSTEM')
          AND id::text != COALESCE(current_setting('app.current_user_id', true), '')
        );

      -- Políticas RLS: hoja_vida_acciones
      DROP POLICY IF EXISTS hoja_vida_select_policy ON hoja_vida_acciones;
      CREATE POLICY hoja_vida_select_policy ON hoja_vida_acciones FOR SELECT
        USING (
          COALESCE(current_setting('app.current_user_rol', true), '') IN ('', 'ADMIN', 'TECNICO', 'SYSTEM')
          OR EXISTS (
            SELECT 1 FROM equipos eq
            WHERE eq.id = hoja_vida_acciones.equipo_id
              AND (
                eq.cedula_responsable = current_setting('app.current_user_cedula', true)
                OR eq.usuario_asignado_id::text = current_setting('app.current_user_id', true)
              )
          )
        );

      DROP POLICY IF EXISTS hoja_vida_insert_policy ON hoja_vida_acciones;
      CREATE POLICY hoja_vida_insert_policy ON hoja_vida_acciones FOR INSERT
        WITH CHECK (
          COALESCE(current_setting('app.current_user_rol', true), '') IN ('', 'ADMIN', 'TECNICO', 'SYSTEM')
        );

      DROP POLICY IF EXISTS hoja_vida_update_policy ON hoja_vida_acciones;
      CREATE POLICY hoja_vida_update_policy ON hoja_vida_acciones FOR UPDATE
        USING (
          COALESCE(current_setting('app.current_user_rol', true), '') IN ('', 'ADMIN', 'TECNICO', 'SYSTEM')
        )
        WITH CHECK (
          COALESCE(current_setting('app.current_user_rol', true), '') IN ('', 'ADMIN', 'TECNICO', 'SYSTEM')
        );

      DROP POLICY IF EXISTS hoja_vida_delete_policy ON hoja_vida_acciones;
      CREATE POLICY hoja_vida_delete_policy ON hoja_vida_acciones FOR DELETE
        USING (
          COALESCE(current_setting('app.current_user_rol', true), '') IN ('', 'ADMIN', 'TECNICO', 'SYSTEM')
        );

      -- Políticas RLS: tareas_worker
      DROP POLICY IF EXISTS tareas_select_policy ON tareas_worker;
      CREATE POLICY tareas_select_policy ON tareas_worker FOR SELECT
        USING (
          COALESCE(current_setting('app.current_user_rol', true), '') IN ('', 'ADMIN', 'TECNICO', 'SYSTEM')
        );

      DROP POLICY IF EXISTS tareas_insert_policy ON tareas_worker;
      CREATE POLICY tareas_insert_policy ON tareas_worker FOR INSERT
        WITH CHECK (
          COALESCE(current_setting('app.current_user_rol', true), '') IN ('', 'ADMIN', 'TECNICO', 'SYSTEM')
          AND (
            COALESCE(current_setting('app.current_user_id', true), '') = ''
            OR creado_por IS NULL
            OR creado_por::text = current_setting('app.current_user_id', true)
          )
        );

      DROP POLICY IF EXISTS tareas_update_policy ON tareas_worker;
      CREATE POLICY tareas_update_policy ON tareas_worker FOR UPDATE
        USING (
          COALESCE(current_setting('app.current_user_rol', true), '') IN ('', 'ADMIN', 'TECNICO', 'SYSTEM')
        )
        WITH CHECK (
          COALESCE(current_setting('app.current_user_rol', true), '') IN ('', 'ADMIN', 'TECNICO', 'SYSTEM')
        );

      DROP POLICY IF EXISTS tareas_delete_policy ON tareas_worker;
      CREATE POLICY tareas_delete_policy ON tareas_worker FOR DELETE
        USING (
          COALESCE(current_setting('app.current_user_rol', true), '') IN ('', 'ADMIN', 'SYSTEM')
        );

      -- Políticas RLS: sesiones_revocadas
      DROP POLICY IF EXISTS sesiones_select_policy ON sesiones_revocadas;
      CREATE POLICY sesiones_select_policy ON sesiones_revocadas FOR SELECT
        USING (true);

      DROP POLICY IF EXISTS sesiones_insert_policy ON sesiones_revocadas;
      CREATE POLICY sesiones_insert_policy ON sesiones_revocadas FOR INSERT
        WITH CHECK (
          COALESCE(current_setting('app.current_user_id', true), '') = ''
          OR usuario_id IS NULL
          OR usuario_id::text = current_setting('app.current_user_id', true)
          OR current_setting('app.current_user_rol', true) = 'ADMIN'
        );

      DROP POLICY IF EXISTS sesiones_delete_policy ON sesiones_revocadas;
      CREATE POLICY sesiones_delete_policy ON sesiones_revocadas FOR DELETE
        USING (true);
    `);
    console.log('[DB] Esquema, RLS granular, rol de mínimo privilegio y control de sesiones verificados correctamente');
  } catch (err) {
    console.warn('[DB] Verificación de esquema y RLS:', err.message);
  }
})();

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`[API Core] Servidor escuchando activamente en el puerto ${PORT}`);
  console.log(`[API Core] Entorno: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
