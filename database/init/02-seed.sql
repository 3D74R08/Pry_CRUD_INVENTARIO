-- ============================================================
-- PLATAFORMA DE GESTIÓN DE ACTIVOS TI
-- Datos Semilla (Seed Data)
-- ============================================================

-- Inserción de Usuarios de Prueba
-- Contraseña Admin: Admin123!
-- Contraseña Empleado: Empleado123!

INSERT INTO usuarios (id, email, password_hash, nombre_completo, cedula, rol, cargo, departamento, activo)
VALUES 
    (
        'a0000000-0000-0000-0000-000000000001',
        'admin@empresa.local',
        crypt('Admin123!', gen_salt('bf', 10)),
        'Administrador de Sistemas TI',
        '1000000001',
        'ADMIN',
        'Líder de Infraestructura TI',
        'Tecnología',
        true
    ),
    (
        'b0000000-0000-0000-0000-000000000002',
        'empleado@empresa.local',
        crypt('Empleado123!', gen_salt('bf', 10)),
        'Carlos Mendoza',
        '1001234567',
        'EMPLEADO',
        'Analista Financiero',
        'Finanzas',
        true
    ),
    (
        'b0000000-0000-0000-0000-000000000003',
        'laura.gomez@empresa.local',
        crypt('Empleado123!', gen_salt('bf', 10)),
        'Laura Gómez',
        '1009876543',
        'EMPLEADO',
        'Especialista de RRHH',
        'Recursos Humanos',
        true
    ),
    (
        'b0000000-0000-0000-0000-000000000004',
        'tecnico@empresa.local',
        crypt('Tecnico123!', gen_salt('bf', 10)),
        'Andrés Soporte TI',
        '1005554433',
        'TECNICO',
        'Técnico de Soporte e Inventario',
        'Tecnología',
        true
    )
ON CONFLICT (email) DO NOTHING;

