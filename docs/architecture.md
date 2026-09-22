# Arquitectura del Sistema: Plataforma de Gestión de Activos TI

## 1. Visión General de la Arquitectura

El sistema implementa una arquitectura basada en microservicios contenerizados mediante **Docker Compose**, separando claramente las responsabilidades de presentación, lógica de negocio síncrona, procesamiento asíncrono y persistencia de datos.

```text
┌─────────────────────────────────────────────────────────────┐
│                      Navegador Web (Host)                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Red Docker Interna (inventario-net)           │
│                                                             │
│   ┌─────────────────────┐       ┌──────────────────────┐    │
│   │  frontend:3000 (80) │       │    api-core:5000     │    │
│   │  React + Vite/Nginx │──────▶│    Express + JWT     │    │
│   └─────────────────────┘       └──────────┬───────────┘    │
│                                            │                │
│                                            ▼                │
│       ┌──────────────────┐      ┌────────────────────┐      │
│       │ worker (Headless)│◀────▶│    postgres-db     │      │
│       │ Database Polling │      │   PostgreSQL 16    │      │
│       └────────┬─────────┘      └────────────────────┘      │
│                │                           ▲                │
│                ▼                           │                │
│       ┌──────────────────┐                 │                │
│       │  uploads-data    │─────────────────┘                │
│       │  (Volumen comp.) │                                  │
│       └──────────────────┘                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Flujo de Procesamiento Asíncrono (Database Polling)

Para evitar la sobreingeniería de colas complejas (RabbitMQ, Kafka), se adoptó el patrón de **Database Polling** utilizando la capacidad nativa de PostgreSQL `SELECT ... FOR UPDATE SKIP LOCKED`, garantizando atomicidad y prevención de condiciones de carrera:

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrador
    participant UI as Frontend (React)
    participant API as API Core (Express)
    participant DB as PostgreSQL (tareas_worker)
    participant Worker as Worker Asíncrono

    Admin->>UI: Sube archivo CSV de inventario
    UI->>API: POST /api/tareas/carga-masiva (Multipart)
    API->>API: Valida archivo y guarda en volumen compartido
    API->>DB: INSERT INTO tareas_worker (estado: 'PENDIENTE')
    API-->>UI: 202 Accepted (tareaId: "uuid-123")
    Note over UI: Hilo liberado inmediatamente.<br/>UI sondea cada 2s.

    loop Cada 5 segundos (Database Polling)
        Worker->>DB: SELECT FOR UPDATE SKIP LOCKED WHERE estado = 'PENDIENTE'
    end

    DB-->>Worker: Retorna fila de tarea bloqueada atómicamente
    Worker->>DB: UPDATE tareas_worker SET estado = 'EN_PROCESO'
    Worker->>Worker: Lee archivo por streaming y normaliza columnas
    Worker->>DB: UPSERT en tabla 'equipos'
    Worker->>DB: INSERT en lote en 'eventos_inventario'
    Worker->>DB: UPDATE tareas_worker SET estado = 'COMPLETADO', resultado = {...}

    UI->>API: GET /api/tareas/uuid-123
    API->>DB: SELECT * FROM tareas_worker WHERE id = 'uuid-123'
    DB-->>API: Retorna tarea con estado 'COMPLETADO'
    API-->>UI: 200 OK (estado: 'COMPLETADO', resumen)
    UI-->>Admin: Muestra notificación de éxito con métricas
```

---

## 3. Modelo de Entidades y Trazabilidad

1. **`usuarios`**: Almacena credenciales hasheadas con bcrypt, número de cédula y rol (`ADMIN` o `EMPLEADO`).
2. **`equipos`**: Fuente única de verdad de los activos tecnológicos (laptops, servidores, impresoras, ups, etc.), con su estado de ciclo de vida (`FUNCIONAL`, `REVISAR`, `DAÑADO`, `DE_BAJA`) y referencia al responsable.
3. **`eventos_inventario`**: Registro inmutable de auditoría histórica. Cualquier cambio en un equipo (creación, asignación, cambio de estado, baja o carga masiva) genera un evento inmutable vinculado al usuario ejecutor.
4. **`tareas_worker`**: Cola de orquestación asíncrona que gestiona el ciclo de vida de los procesos pesados (`PENDIENTE` $\to$ `EN_PROCESO` $\to$ `COMPLETADO` / `FALLIDO`).
