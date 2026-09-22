const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('activos_ti_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = options.isFormData ? options.headers : { ...getAuthHeaders(), ...options.headers };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  if (response.status === 401) {
    localStorage.removeItem('activos_ti_token');
    localStorage.removeItem('activos_ti_user');
    if (!window.__auth_redirected) {
      window.__auth_redirected = true;
      window.location.reload();
    }
    throw new Error('Sesión expirada o no autorizada');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Error HTTP ${response.status}`);
  }

  return data;
}

export const api = {
  // Autenticación
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getProfile: () => request('/auth/me'),

  // Equipos y módulos
  getEquipos: (params = {}) => {
    const query = new URLSearchParams();
    if (params.busqueda) query.append('busqueda', params.busqueda);
    if (params.estado) query.append('estado', params.estado);
    if (params.tipo) query.append('tipo', params.tipo);
    if (params.sede) query.append('sede', params.sede);
    if (params.area) query.append('area', params.area);
    if (params.modulo) query.append('modulo', params.modulo);
    if (params.cedula_responsable) query.append('cedula_responsable', params.cedula_responsable);
    if (params.responsable_nombre) query.append('responsable_nombre', params.responsable_nombre);
    if (params.usuario_asignado_id) query.append('usuario_asignado_id', params.usuario_asignado_id);
    const qs = query.toString();
    return request(`/equipos${qs ? `?${qs}` : ''}`);
  },
  getEquipoById: (id) => request(`/equipos/${id}`),
  getConteos: () => request('/equipos/conteos'),
  getResumenAsignaciones: () => request('/equipos/resumen-asignaciones'),
  createEquipo: (data) =>
    request('/equipos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateEquipo: (id, data) =>
    request(`/equipos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  darDeBaja: (id, motivo) =>
    request(`/equipos/${id}/baja`, {
      method: 'POST',
      body: JSON.stringify({ motivo }),
    }),
  registrarPrestamo: (id, data) =>
    request(`/equipos/${id}/prestamo`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  registrarDevolucion: (id, data) =>
    request(`/equipos/${id}/devolucion`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  reportarFallo: (id, data) =>
    request(`/equipos/${id}/reportar-fallo`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteEquipo: (id) =>
    request(`/equipos/${id}`, {
      method: 'DELETE',
    }),

  // Eventos de Trazabilidad y Dashboard
  getEventos: (params = {}) => {
    const query = new URLSearchParams();
    if (params.tipo_evento) query.append('tipo_evento', params.tipo_evento);
    if (params.busqueda) query.append('busqueda', params.busqueda);
    if (params.limit) query.append('limit', params.limit);
    if (params.offset) query.append('offset', params.offset);
    const qs = query.toString();
    return request(`/eventos${qs ? `?${qs}` : ''}`);
  },
  getEventosRecientes: () => request('/eventos/recientes'),
  getEventosByEquipo: (equipoId) => request(`/eventos/equipo/${equipoId}`),
  getMetricasDashboard: () => request('/eventos/metricas'),

  // Tareas Asíncronas (Worker)
  subirCargaMasiva: (formData) => {
    const token = localStorage.getItem('activos_ti_token');
    return request('/tareas/carga-masiva', {
      method: 'POST',
      body: formData,
      isFormData: true,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
  getTareaById: (id) => request(`/tareas/${id}`),
  getTareas: () => request('/tareas'),
  descargarPlantilla: async () => {
    const token = localStorage.getItem('activos_ti_token');
    const response = await fetch('/api/tareas/plantilla', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Error al descargar la plantilla oficial');
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'FRMA-07_INVENTARIO_TECNOLOGICO.xltx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Usuarios (Admin)
  getUsuarios: () => request('/usuarios'),
  createUsuario: (data) =>
    request('/usuarios', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUsuario: (id, data) =>
    request(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  toggleUsuarioActivo: (id) =>
    request(`/usuarios/${id}/toggle-activo`, {
      method: 'PATCH',
    }),
  deleteUsuario: (id) =>
    request(`/usuarios/${id}`, {
      method: 'DELETE',
    }),
};

// Objeto cliente unificado para axios-style o helper directo
export const client = {
  get: (url) => request(url),
  post: (url, body) => request(url, { method: 'POST', body: JSON.stringify(body) }),
  put: (url, body) => request(url, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (url) => request(url, { method: 'DELETE' }),
};

export default client;
