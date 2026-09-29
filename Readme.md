# Plataforma Avanzada de Gestión de Activos TI

Plataforma corporativa centralizada para la gestión, auditoría y trazabilidad del ciclo de vida de inventario tecnológico TI. Diseñada bajo arquitectura de microservicios contenerizados con Docker Compose, control de acceso basado en roles (RBAC), procesamiento asíncrono en segundo plano mediante Database Polling y prácticas estrictas de DevSecOps ("Shift-Left Security").

---

##  Arquitectura de la Solución

El sistema desacopla la carga de trabajo en 4 servicios independientes sobre una red interna aislada:

1. **Frontend (SPA):** Desarrollado con **React 18 + Vite**, servido en producción con **Nginx** (Puerto `3000:80`).
2. **API Core (Backend):** Desarrollado con **Node.js + Express** (Puerto interno `5000`, aislado en la red privada de Docker). Encargado del control de acceso RBAC, validación de JWT y operaciones CRUD síncronas enrutadas vía reverse proxy por Nginx.
3. **Base de Datos:** **PostgreSQL 16** alojada en la red privada de Docker, sin exposición de puertos al exterior para minimizar la superficie de ataque.
4. **Worker Autónomo:** Proceso headless independiente en **Node.js** sin puertos de red abiertos. Realiza **Database Polling** sobre `tareas_worker` utilizando la cláusula atómica `SELECT ... FOR UPDATE SKIP LOCKED` para procesar cargas masivas y emitir trazabilidad sin bloquear la API principal.

---

##  Inicio Rápido (Despliegue Local con Docker Compose)

### Prerrequisitos
* [Docker Desktop](https://www.docker.com/) instalado y en ejecución.
* Docker Compose v2+.

### Pasos de Ejecución

1. **Clonar o situarse en el directorio del proyecto:**
   ```bash
   cd c:\Pry_CRUD_INVENTARIO
   ```

2. **Verificar variables de entorno:**
   El archivo `.env` ya viene preconfigurado para pruebas locales. Puedes ajustar claves secretas según tus requerimientos.

3. **Construir y levantar la plataforma completa:**
   ```bash
   docker compose up -d --build
   ```

4. **Acceder a la aplicación:**
   * **Frontend Web:** Abre tu navegador en [http://localhost:3000](http://localhost:3000)
   * **API Core Healthcheck:** [http://localhost:3000/api/health](http://localhost:3000/api/health) (a través del reverse proxy Nginx)

---

##  Despliegue en Servidor Local / Proxmox VE (LAN / WiFi Privada)

La plataforma está lista para correr en tu servidor **Proxmox VE** (en una Máquina Virtual Ubuntu/Debian o un Contenedor LXC con Docker), permitiendo el acceso de todos tus colaboradores desde computadores y teléfonos celulares conectados a la red WiFi o cableada de tu empresa, **sin necesidad de exponer ningún puerto ni equipo a internet**.

### Pasos en la Máquina Virtual o Contenedor Proxmox:

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/3D74R08/Pry_CRUD_INVENTARIO.git
   cd Pry_CRUD_INVENTARIO
   ```

2. **Crear el archivo de entorno `.env`:**
   ```bash
   cp .env.example .env
   ```

3. **Iniciar los servicios con Docker Compose:**
   ```bash
   docker compose up -d --build
   ```

4. **Acceso desde cualquier equipo o celular en la misma red:**
   Conoce la IP local de tu máquina en Proxmox (por ejemplo ejecutando `ip a` o `hostname -I`, digamos `192.168.1.150`):
   * Desde tu **PC de escritorio o laptop**: `http://192.168.1.150:3000`
   * Desde tu **teléfono celular (vía WiFi de la empresa)**: `http://192.168.1.150:3000`
     *(El diseño se adaptará automáticamente a la vista táctil móvil con menú hamburguesa ☰)*.

5. **Configurar la Plantilla Oficial de la Empresa:**
   Inicia sesión con el usuario Administrador, dirígete al módulo **Carga Masiva** y presiona el botón **`📤 Configurar Plantilla Oficial`** para cargar el archivo `.xltx` o `.xlsx` maestro de tu empresa.

---

##  Credenciales de Prueba Preconfiguradas (Datos Semilla)

Al iniciar por primera vez, PostgreSQL ejecuta automáticamente los scripts `01-schema.sql` y `02-seed.sql` creando los siguientes usuarios de demostración:

| Rol | Correo Electrónico | Contraseña | Privilegios y Alcance |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@empresa.local` | `Admin123!` | Control total: CRUD equipos, auditoría, carga masiva y **gestión de usuarios (crear, deshabilitar, habilitar, eliminar)**. |
| **Técnico** | `tecnico@empresa.local` | `Tecnico123!` | **Gestión de Inventario**: CRUD completo sobre equipos, bajas y carga masiva. **Sin acceso a gestión ni deshabilitación de usuarios**. |
| **Empleado** | `empleado@empresa.local` | `Empleado123!` | **Solo lectura**: Estrictamente limitado a los equipos asignados a su número de cédula (`1001234567`). |

---

##  Modelo de Datos Centralizado

El sistema implementa 4 entidades principales relacionales con integridad referencial e índices:

1. **`usuarios`:** Identificación, credenciales con hash bcrypt, rol de seguridad (`ADMIN`, `TECNICO`, `EMPLEADO`), cargo y departamento.
2. **`equipos`:** Activos TI (laptops, servidores, impresoras, ups, etc.), estado del ciclo de vida (`FUNCIONAL`, `REVISAR`, `DAÑADO`, `DE_BAJA`), especificaciones técnicas y asignaciones.
3. **`eventos_inventario`:** Trazabilidad inmutable que registra cada evento (`CREACION`, `ASIGNACION`, `CAMBIO_ESTADO`, `MANTENIMIENTO`, `DE_BAJA`, `CARGA_MASIVA`) con fecha, autor y detalles JSON.
4. **`tareas_worker`:** Cola de tareas asíncronas para Database Polling (`PENDIENTE`, `EN_PROCESO`, `COMPLETADO`, `FALLIDO`) con reporte estadístico de resultados.

---

##  Estrategia DevSecOps y Seguridad

El repositorio integra un pipeline de integración continua en `.github/workflows/devsecops.yml` que ejecuta:

*  **Secret Scanning (Gitleaks):** Previene la publicación involuntaria de secretos y tokens.
*  **SAST (Semgrep):** Análisis estático del código fuente en busca de patrones vulnerables (OWASP Top 10).
*  **SCA & Containers (Trivy):** Auditoría de dependencias `npm` y escaneo de vulnerabilidades en las imágenes Docker.
*  **IaC Security (Checkov):** Auditoría de seguridad sobre `docker-compose.yml` y los `Dockerfile`.
*  **DAST (OWASP ZAP):** Escaneo dinámico automatizado contra los endpoints de la API.
*  **Modelado de Amenazas:** Matriz formal **STRIDE** y diagramas **DFD** documentados en [`docs/threat-model-stride.md`](./docs/threat-model-stride.md).

---

##  Verificación y Pruebas

Para validar el funcionamiento del Worker de forma aislada:
```bash
# Ver los logs en vivo del Worker asíncrono
docker compose logs -f worker

# Ver los logs del API Core
docker compose logs -f api-core
```
