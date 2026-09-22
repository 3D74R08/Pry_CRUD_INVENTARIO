const bcrypt = require('bcryptjs');
const db = require('../config/db');

// Listar todos los usuarios (Solo ADMIN)
async function getUsuarios(req, res) {
  try {
    const result = await db.query(
      `SELECT id, email, nombre_completo, cedula, rol, cargo, departamento, activo, created_at, updated_at
       FROM usuarios
       ORDER BY nombre_completo ASC`
    );
    return res.json({ usuarios: result.rows });
  } catch (error) {
    console.error('[Usuarios] Error al listar usuarios:', error);
    return res.status(500).json({ error: 'Error al consultar usuarios' });
  }
}

// Crear nuevo usuario (Solo ADMIN)
async function createUsuario(req, res) {
  try {
    const { email, password, nombre_completo, cedula, rol, cargo, departamento } = req.body;

    if (!email || !password || !nombre_completo || !cedula) {
      return res.status(400).json({ error: 'Email, contraseña, nombre completo y cédula son obligatorios' });
    }

    const check = await db.query(
      'SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1) OR cedula = $2',
      [email.trim(), cedula.trim()]
    );

    if (check.rows.length > 0) {
      return res.status(409).json({ error: 'Ya existe un usuario con este email o número de cédula' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const validRoles = ['ADMIN', 'TECNICO', 'EMPLEADO'];
    const roleFinal = validRoles.includes(rol) ? rol : 'EMPLEADO';

    const result = await db.query(
      `INSERT INTO usuarios (email, password_hash, nombre_completo, cedula, rol, cargo, departamento, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING id, email, nombre_completo, cedula, rol, cargo, departamento, activo, created_at`,
      [
        email.trim().toLowerCase(),
        passwordHash,
        nombre_completo.trim(),
        cedula.trim(),
        roleFinal,
        cargo || null,
        departamento || null,
      ]
    );

    return res.status(201).json({
      message: 'Usuario creado exitosamente',
      usuario: result.rows[0],
    });
  } catch (error) {
    console.error('[Usuarios] Error al crear usuario:', error);
    return res.status(500).json({ error: 'Error al registrar usuario' });
  }
}

// Actualizar usuario (Solo ADMIN)
async function updateUsuario(req, res) {
  try {
    const { id } = req.params;
    const { nombre_completo, email, cedula, rol, cargo, departamento, password, activo } = req.body;

    if (rol && !['ADMIN', 'TECNICO', 'EMPLEADO'].includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido. Debe ser ADMIN, TECNICO o EMPLEADO' });
    }

    if (email && email.trim() !== '') {
      const checkEmail = await db.query('SELECT id FROM usuarios WHERE LOWER(email) = LOWER($1) AND id != $2', [email.trim(), id]);
      if (checkEmail.rows.length > 0) {
        return res.status(409).json({ error: 'El correo electrónico ya pertenece a otro usuario' });
      }
    }

    if (cedula && cedula.trim() !== '') {
      const checkCedula = await db.query('SELECT id FROM usuarios WHERE cedula = $1 AND id != $2', [cedula.trim(), id]);
      if (checkCedula.rows.length > 0) {
        return res.status(409).json({ error: 'El número de cédula ya pertenece a otro usuario' });
      }
    }

    let updateQuery = `
      UPDATE usuarios SET
        nombre_completo = COALESCE($1, nombre_completo),
        rol = COALESCE($2, rol),
        cargo = COALESCE($3, cargo),
        departamento = COALESCE($4, departamento),
        activo = COALESCE($5, activo),
        email = COALESCE($6, email),
        cedula = COALESCE($7, cedula),
        updated_at = NOW()
    `;
    const params = [
      nombre_completo ? nombre_completo.trim() : null,
      rol || null,
      cargo || null,
      departamento || null,
      typeof activo === 'boolean' ? activo : null,
      email ? email.trim().toLowerCase() : null,
      cedula ? cedula.trim() : null,
    ];

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password.trim(), salt);
      params.push(passwordHash);
      updateQuery += `, password_hash = $${params.length}`;
    }

    params.push(id);
    updateQuery += ` WHERE id = $${params.length} RETURNING id, email, nombre_completo, cedula, rol, cargo, departamento, activo, updated_at;`;

    const result = await db.query(updateQuery, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json({
      message: 'Usuario actualizado correctamente',
      usuario: result.rows[0],
    });
  } catch (error) {
    console.error('[Usuarios] Error al actualizar usuario:', error);
    return res.status(500).json({ error: 'Error al modificar usuario' });
  }
}

// Habilitar / Deshabilitar usuario (Solo ADMIN)
async function toggleUsuarioActivo(req, res) {
  try {
    const { id } = req.params;

    if (req.user.id === id) {
      return res.status(400).json({ error: 'No puedes deshabilitar tu propia cuenta de administrador' });
    }

    const current = await db.query('SELECT id, email, activo FROM usuarios WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const nuevoEstado = !current.rows[0].activo;
    const result = await db.query(
      'UPDATE usuarios SET activo = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, nombre_completo, activo',
      [nuevoEstado, id]
    );

    return res.json({
      message: `Usuario ${nuevoEstado ? 'habilitado' : 'deshabilitado'} exitosamente`,
      usuario: result.rows[0],
    });
  } catch (error) {
    console.error('[Usuarios] Error al cambiar estado de usuario:', error);
    return res.status(500).json({ error: 'Error al modificar estado del usuario' });
  }
}

// Eliminar usuario (Solo ADMIN)
async function deleteUsuario(req, res) {
  try {
    const { id } = req.params;

    if (req.user.id === id) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta de administrador' });
    }

    const current = await db.query('SELECT id, email, nombre_completo FROM usuarios WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await db.query('DELETE FROM usuarios WHERE id = $1', [id]);

    return res.json({
      message: `Usuario ${current.rows[0].nombre_completo} eliminado correctamente`,
    });
  } catch (error) {
    console.error('[Usuarios] Error al eliminar usuario:', error);
    return res.status(500).json({ error: 'Error al eliminar usuario' });
  }
}

module.exports = {
  getUsuarios,
  createUsuario,
  updateUsuario,
  toggleUsuarioActivo,
  deleteUsuario,
};
