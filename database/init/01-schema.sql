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
    equipo_id UUID REFERENCES equipos(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    tipo_evento VARCHAR(50) NOT NULL CHECK (tipo_evento IN ('CREACION', 'ASIGNACION', 'DEVOLUCION', 'CAMBIO_ESTADO', 'MANTENIMIENTO', 'DE_BAJA', 'CARGA_MASIVA', 'PRESTAMO', 'REPORTE_FALLO')),
    descripcion TEXT NOT NULL,
    detalles JSONB DEFAULT '{}'::jsonb,
    fecha_evento TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_eventos_equipo_id ON eventos_inventario(equipo_id);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha ON eventos_inventario(fecha_evento DESC);

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
