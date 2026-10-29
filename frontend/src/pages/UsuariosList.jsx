import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import { PlusIcon, EditIcon, TrashIcon, XIcon, CheckIcon, AlertTriangleIcon } from '../components/Icons';
import { SkeletonTableRow } from '../components/Skeleton';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';

export default function UsuariosList() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(25);
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'primary',
    confirmText: 'Confirmar',
    onConfirm: () => {},
  });
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    password: '',
    cedula: '',
    rol: 'EMPLEADO',
    cargo: '',
    departamento: '',
  });
  const [formEdit, setFormEdit] = useState({
    id: '',
    nombre_completo: '',
    email: '',
    cedula: '',
    rol: 'EMPLEADO',
    cargo: '',
    departamento: '',
    password: '',
    activo: true,
  });

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const data = await api.getUsuarios();
      setUsuarios(data.usuarios || []);
    } catch (err) {
      toast.error('Error al cargar usuarios: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // Escuchar tecla Escape para cerrar cualquier modal abierto
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (confirmConfig.isOpen) {
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        } else if (modalOpen) {
          setModalOpen(false);
        } else if (modalEditarOpen) {
          setModalEditarOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmConfig.isOpen, modalOpen, modalEditarOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createUsuario(formData);
      setModalOpen(false);
      setFormData({
        nombre_completo: '',
        email: '',
        password: '',
        cedula: '',
        rol: 'EMPLEADO',
        cargo: '',
        departamento: '',
      });
      toast.success('Usuario registrado con éxito en el sistema.');
      cargarUsuarios();
    } catch (err) {
      toast.error('Error al crear usuario: ' + err.message);
    }
  };

  const handleOpenEditar = (u) => {
    setFormEdit({
      id: u.id,
      nombre_completo: u.nombre_completo || '',
      email: u.email || '',
      cedula: u.cedula || '',
      rol: u.rol || 'EMPLEADO',
      cargo: u.cargo || '',
      departamento: u.departamento || '',
      password: '',
      activo: u.activo !== false,
    });
    setModalEditarOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.updateUsuario(formEdit.id, formEdit);
      setModalEditarOpen(false);
      toast.success('Información del usuario actualizada.');
      cargarUsuarios();
    } catch (err) {
      toast.error('Error al actualizar usuario: ' + err.message);
    }
  };

  const handleToggleActivo = (u) => {
    if (u.id === currentUser?.id) {
      toast.warning('No puedes deshabilitar tu propia cuenta de administrador.');
      return;
    }
    const accion = u.activo ? 'deshabilitar' : 'habilitar';
    setConfirmConfig({
      isOpen: true,
      title: `¿${accion === 'deshabilitar' ? 'Deshabilitar' : 'Habilitar'} acceso?`,
      message: `¿Estás seguro de que deseas ${accion} el acceso al sistema para ${u.nombre_completo}?`,
      variant: accion === 'deshabilitar' ? 'danger' : 'primary',
      confirmText: accion === 'deshabilitar' ? 'Sí, deshabilitar' : 'Sí, habilitar',
      onConfirm: async () => {
        try {
          await api.toggleUsuarioActivo(u.id);
          toast.success(`Cuenta de ${u.nombre_completo} actualizada.`);
          cargarUsuarios();
        } catch (err) {
          toast.error('Error al cambiar estado: ' + err.message);
        }
      },
    });
  };

  const handleDelete = (u) => {
    if (u.id === currentUser?.id) {
      toast.warning('No puedes eliminar tu propia cuenta de administrador.');
      return;
    }
    setConfirmConfig({
      isOpen: true,
      title: 'Eliminar usuario definitivamente',
      message: `¿ATENCIÓN: Deseas eliminar permanentemente al usuario ${u.nombre_completo} (${u.email})? Esta acción no se puede deshacer.`,
      variant: 'danger',
      confirmText: 'Sí, eliminar',
      onConfirm: async () => {
        try {
          await api.deleteUsuario(u.id);
          toast.success(`Usuario ${u.nombre_completo} eliminado.`);
          cargarUsuarios();
        } catch (err) {
          toast.error('Error al eliminar usuario: ' + err.message);
        }
      },
    });
  };

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (u.cedula && u.cedula.includes(busqueda)) ||
      u.email.toLowerCase().includes(busqueda.toLowerCase())
  );

  const indexInicio = (paginaActual - 1) * itemsPorPagina;
  const usuariosPaginados = usuariosFiltrados.slice(indexInicio, indexInicio + itemsPorPagina);

  return (
    <div>
      <div className="card-header">
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Gestión de Usuarios y Roles (RBAC)</h2>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
            Administración centralizada de cuentas ({usuarios.length} usuarios registrados), roles de seguridad y control de acceso
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <PlusIcon size={14} /> Nuevo Usuario
        </button>
      </div>

      <div className="card" style={{ padding: '12px 16px', marginBottom: '16px' }}>
        <div style={{ maxWidth: '440px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar usuario por nombre, cédula o correo..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPaginaActual(1);
            }}
          />
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>Correo Electrónico</th>
              <th>Identificación</th>
              <th>Rol en Sistema</th>
              <th>Cargo / Departamento</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <SkeletonTableRow key={idx} keyIndex={idx} cols={7} />
              ))
            ) : usuariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No se encontraron usuarios que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              usuariosPaginados.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id}>
                    <td>
                      <b>{u.nombre_completo}</b>
                      {isSelf && (
                        <span style={{ marginLeft: '6px', fontSize: '11px', color: 'var(--primary)' }}>
                          (Tu cuenta)
                        </span>
                      )}
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className="placa-tag">C.C. {u.cedula}</span>
                    </td>
                    <td>
                      <span className={`user-role-badge ${u.rol.toLowerCase()}`}>
                        {u.rol}
                      </span>
                    </td>
                    <td>
                      {u.cargo || '—'} {u.departamento ? `(${u.departamento})` : ''}
                    </td>
                    <td>
                      <span className={`badge ${u.activo ? 'badge-funcional' : 'badge-danado'}`}>
                        {u.activo ? 'Activo' : 'Deshabilitado'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          title="Editar usuario"
                          onClick={() => handleOpenEditar(u)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          <EditIcon size={13} /> Editar
                        </button>
                        {!isSelf && (
                          <>
                            <button
                              type="button"
                              className={`btn btn-sm ${u.activo ? 'btn-secondary' : 'btn-primary'}`}
                              title={u.activo ? 'Deshabilitar acceso' : 'Habilitar acceso'}
                              onClick={() => handleToggleActivo(u)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            >
                              {u.activo ? (
                                <>
                                  <AlertTriangleIcon size={13} /> Deshabilitar
                                </>
                              ) : (
                                <>
                                  <CheckIcon size={13} /> Habilitar
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              title="Eliminar usuario definitivamente"
                              onClick={() => handleDelete(u)}
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px 8px' }}
                            >
                              <TrashIcon size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginador Moderno */}
      <Pagination
        paginaActual={paginaActual}
        totalItems={usuariosFiltrados.length}
        itemsPorPagina={itemsPorPagina}
        onCambiarPagina={(pag) => setPaginaActual(pag)}
        onCambiarItemsPorPagina={(tamano) => setItemsPorPagina(tamano)}
        opcionesItemsPorPagina={[10, 25, 50, 100]}
      />

      {/* Modal Crear Usuario */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Nuevo Usuario</h3>
              <button className="btn-icon" onClick={() => setModalOpen(false)}>
                <XIcon size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full">
                    <label className="form-label">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={formData.nombre_completo}
                      onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                      placeholder="Ej. Juan Pérez"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Correo Electrónico *</label>
                    <input
                      type="email"
                      required
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="juan.perez@empresa.local"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Número de Cédula *</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={formData.cedula}
                      onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                      placeholder="1000123456"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Contraseña *</label>
                    <input
                      type="password"
                      required
                      className="form-control"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Rol del Sistema *</label>
                    <select
                      className="form-control"
                      value={formData.rol}
                      onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                    >
                      <option value="EMPLEADO">EMPLEADO (Solo lectura de equipos propios)</option>
                      <option value="TECNICO">TECNICO (CRUD inventario sin gestión de usuarios)</option>
                      <option value="ADMIN">ADMINISTRADOR (Control Total del Sistema)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cargo</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.cargo}
                      onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                      placeholder="Técnico de Soporte, Analista..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Departamento</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.departamento}
                      onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                      placeholder="Tecnología, Operaciones..."
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {modalEditarOpen && (
        <div className="modal-backdrop" onClick={() => setModalEditarOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Usuario: {formEdit.nombre_completo}</h3>
              <button className="btn-icon" onClick={() => setModalEditarOpen(false)}>
                <XIcon size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full">
                    <label className="form-label">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={formEdit.nombre_completo}
                      onChange={(e) => setFormEdit({ ...formEdit, nombre_completo: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Correo Electrónico *</label>
                    <input
                      type="email"
                      required
                      className="form-control"
                      value={formEdit.email}
                      onChange={(e) => setFormEdit({ ...formEdit, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Número de Cédula *</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      value={formEdit.cedula}
                      onChange={(e) => setFormEdit({ ...formEdit, cedula: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Rol del Sistema *</label>
                    <select
                      className="form-control"
                      value={formEdit.rol}
                      onChange={(e) => setFormEdit({ ...formEdit, rol: e.target.value })}
                      disabled={formEdit.id === currentUser?.id}
                    >
                      <option value="EMPLEADO">EMPLEADO (Solo lectura de equipos propios)</option>
                      <option value="TECNICO">TECNICO (CRUD inventario sin gestión de usuarios)</option>
                      <option value="ADMIN">ADMINISTRADOR (Control Total del Sistema)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Nueva Contraseña (Opcional)</label>
                    <input
                      type="password"
                      className="form-control"
                      value={formEdit.password}
                      onChange={(e) => setFormEdit({ ...formEdit, password: e.target.value })}
                      placeholder="Dejar en blanco para no cambiar"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cargo</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formEdit.cargo}
                      onChange={(e) => setFormEdit({ ...formEdit, cargo: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Departamento</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formEdit.departamento}
                      onChange={(e) => setFormEdit({ ...formEdit, departamento: e.target.value })}
                    />
                  </div>

                  {formEdit.id !== currentUser?.id && (
                    <div className="form-group full" style={{ marginTop: '6px' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                        <input
                          type="checkbox"
                          checked={formEdit.activo}
                          onChange={(e) => setFormEdit({ ...formEdit, activo: e.target.checked })}
                        />
                        <span>Cuenta Habilitada / Activa</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalEditarOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal accesible de confirmación para acciones críticas */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant}
        confirmText={confirmConfig.confirmText}
        onConfirm={() => {
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
          confirmConfig.onConfirm();
        }}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
