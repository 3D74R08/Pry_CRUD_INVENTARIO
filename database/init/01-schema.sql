-- ============================================================
-- PLATAFORMA DE GESTIÓN DE ACTIVOS TI
-- DDL Schema Initialization (PostgreSQL 16)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    cedula VARCHAR(50) UNIQUE NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'EMPLEADO' CHECK (rol IN ('ADMIN', 'TECNICO', 'EMPLEADO')),
    cargo VARCHAR(100),
    departamento VARCHAR(100),
    activo BOOLEAN NOT NULL DEFAULT true,
    mfa_enabled BOOLEAN NOT NULL DEFAULT false,
    mfa_secret VARCHAR(128),
    mfa_backup_codes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_cedula ON usuarios(cedula);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- 2. Tabla de Equipos (Activos TI)
CREATE TABLE IF NOT EXISTS equipos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placa VARCHAR(100),
    nombre_equipo VARCHAR(150),
    tipo VARCHAR(50) NOT NULL DEFAULT 'Laptop', -- Laptop, Escritorio, Servidor, Impresora, UPS, Periférico, etc.
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100),
    serial VARCHAR(100),
    procesador VARCHAR(100),
    ram VARCHAR(50),
    almacenamiento VARCHAR(100),
    sistema_operativo VARCHAR(100),
    estado VARCHAR(50) NOT NULL DEFAULT 'FUNCIONAL' CHECK (estado IN ('FUNCIONAL', 'REVISAR', 'DAÑADO', 'DE_BAJA')),
    sede VARCHAR(100),
    area VARCHAR(100),
    cedula_responsable VARCHAR(50),
    responsable_nombre VARCHAR(150),
    usuario_asignado_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_mantenimiento DATE,
    observaciones TEXT,
    -- Campos Especializados por Módulo
    categoria VARCHAR(50) DEFAULT 'EQUIPOS_PRESTAMOS',
    modalidad VARCHAR(50) DEFAULT 'PROPIO',
    fecha_operacion DATE,
    solicitante VARCHAR(150),
    recibido_por VARCHAR(150),
    ip VARCHAR(50),
    color VARCHAR(50),
    potencia VARCHAR(100),
    baterias VARCHAR(100),
    peso VARCHAR(50),
    proteccion VARCHAR(100),
    voltaje_entrada VARCHAR(50),
    voltaje_salida VARCHAR(50),
    disponibilidad VARCHAR(50) DEFAULT 'OK',
    board VARCHAR(100),
    acronis VARCHAR(50),
    glpi VARCHAR(50),
    cargo VARCHAR(100),
    codigo_interno VARCHAR(100),
    software_instalado TEXT,
    accesorios TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS equipos_placa_unique_idx ON equipos(placa) WHERE placa IS NOT NULL AND placa != '' AND placa != 'N/A' AND placa != 'PROVEEDOR';
CREATE INDEX IF NOT EXISTS idx_equipos_placa ON equipos(placa);
CREATE INDEX IF NOT EXISTS idx_equipos_serial ON equipos(serial);
CREATE INDEX IF NOT EXISTS idx_equipos_cedula_responsable ON equipos(cedula_responsable);
CREATE INDEX IF NOT EXISTS idx_equipos_usuario_asignado ON equipos(usuario_asignado_id);
CREATE INDEX IF NOT EXISTS idx_equipos_estado ON equipos(estado);
CREATE INDEX IF NOT EXISTS idx_equipos_tipo ON equipos(tipo);
CREATE INDEX IF NOT EXISTS idx_equipos_categoria ON equipos(categoria);
CREATE INDEX IF NOT EXISTS idx_equipos_modalidad ON equipos(modalidad);
CREATE INDEX IF NOT EXISTS idx_equipos_ip ON equipos(ip);

-- 3. Tabla de Trazabilidad Histórica: eventos_inventario
CREATE TABLE IF NOT EXISTS eventos_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipo_id UUID REFERENCES equipos(id) ON DELETE SET NULL,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    tipo_evento VARCHAR(50) NOT NULL CHECK (tipo_evento IN ('CREACION', 'ASIGNACION', 'DEVOLUCION', 'CAMBIO_ESTADO', 'MANTENIMIENTO', 'DE_BAJA', 'CARGA_MASIVA', 'PRESTAMO', 'REPORTE_FALLO', 'ELIMINACION')),
    descripcion TEXT NOT NULL,
    detalles JSONB DEFAULT '{}'::jsonb,
    fecha_evento TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_eventos_equipo_id ON eventos_inventario(equipo_id);
CREATE INDEX IF NOT EXISTS idx_eventos_usuario_id ON eventos_inventario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha ON eventos_inventario(fecha_evento DESC);

-- 3.1 Tabla de Acciones e Intervenciones de Hoja de Vida
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

-- 4. Tabla de Orquestación Asíncrona: tareas_worker
CREATE TABLE IF NOT EXISTS tareas_worker (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_tarea VARCHAR(50) NOT NULL CHECK (tipo_tarea IN ('CARGA_MASIVA_CSV', 'GENERACION_REPORTE')),
    estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'FALLIDO')),
    archivo_nombre VARCHAR(255),
    archivo_ruta VARCHAR(500),
    parametros JSONB DEFAULT '{}'::jsonb,
    resultado JSONB DEFAULT '{}'::jsonb,
    error_mensaje TEXT,
    creado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tareas_estado ON tareas_worker(estado);
CREATE INDEX IF NOT EXISTS idx_tareas_created_at ON tareas_worker(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_tareas_creado_por ON tareas_worker(creado_por);

-- 5. Tabla de Control y Revocación de Sesiones JWT (jti)
CREATE TABLE IF NOT EXISTS sesiones_revocadas (
    jti VARCHAR(100) PRIMARY KEY,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    revocado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira_en TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sesiones_revocadas_expira ON sesiones_revocadas(expira_en);
CREATE INDEX IF NOT EXISTS idx_sesiones_revocadas_usuario ON sesiones_revocadas(usuario_id);

-- ============================================================
-- 6. SEGURIDAD A NIVEL DE FILA (RLS) Y MÍNIMO PRIVILEGIO
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_inventario_role') THEN
    CREATE ROLE app_inventario_role NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO app_inventario_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_inventario_role;

-- Habilitar y forzar explícitamente RLS en todas las tablas del sistema
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

-- 6.1 Políticas granulares para TABLA: equipos
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

-- 6.2 Políticas granulares para TABLA: eventos_inventario (Auditoría Inmutable)
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

-- 6.3 Políticas granulares para TABLA: usuarios
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

-- 6.4 Políticas granulares para TABLA: hoja_vida_acciones
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

-- 6.5 Políticas granulares para TABLA: tareas_worker
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

-- 6.6 Políticas granulares para TABLA: sesiones_revocadas
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

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_usuarios ON usuarios;
CREATE TRIGGER set_timestamp_usuarios
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_equipos ON equipos;
CREATE TRIGGER set_timestamp_equipos
BEFORE UPDATE ON equipos
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
