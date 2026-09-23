const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

if (!JWT_SECRET) {
  console.error('[CRITICAL] JWT_SECRET no está configurado en las variables de entorno.');
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Debes proporcionar email y contraseña' });
    }

    const result = await db.query(
      'SELECT id, email, password_hash, nombre_completo, cedula, rol, cargo, departamento, activo FROM usuarios WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];

    if (!user.activo) {
      return res.status(403).json({ error: 'Tu cuenta ha sido desactivada. Consulta con el administrador.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      nombre_completo: user.nombre_completo,
      cedula: user.cedula,
      rol: user.rol,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.json({
      message: 'Autenticación exitosa',
      token,
      user: {
        id: user.id,
        email: user.email,
        nombre_completo: user.nombre_completo,
        cedula: user.cedula,
        rol: user.rol,
        cargo: user.cargo,
        departamento: user.departamento,
      },
    });
  } catch (error) {
    console.error('[Auth] Error en login:', error);
    return res.status(500).json({ error: 'Error interno en el servidor de autenticación' });
  }
}

async function getProfile(req, res) {
  try {
    const result = await db.query(
      'SELECT id, email, nombre_completo, cedula, rol, cargo, departamento, activo, created_at FROM usuarios WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('[Auth] Error al obtener perfil:', error);
    return res.status(500).json({ error: 'Error al consultar perfil de usuario' });
  }
}

module.exports = {
  login,
  getProfile,
};
