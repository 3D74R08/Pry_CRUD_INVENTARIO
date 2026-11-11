const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { isTokenRevoked } = require('../controllers/authController');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('[CRITICAL] JWT_SECRET no está configurado en las variables de entorno.');
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso no autorizado: Token no proporcionado' });
  }

  jwt.verify(token, JWT_SECRET, async (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }

    // Verificar si la sesión fue revocada al cerrar sesión
    if (user.jti && (await isTokenRevoked(user.jti))) {
      return res.status(401).json({ error: 'La sesión fue cerrada o revocada. Inicia sesión nuevamente.' });
    }

    // Verificar en tiempo real que el usuario siga activo en base de datos
    try {
      const userCheck = await db.pool.query(
        'SELECT activo, rol, cedula, nombre_completo FROM usuarios WHERE id = $1 LIMIT 1',
        [user.id]
      );
      if (userCheck.rows.length === 0 || !userCheck.rows[0].activo) {
        return res.status(401).json({ error: 'Cuenta de usuario inactiva o revocada.' });
      }
      user.rol = userCheck.rows[0].rol;
      user.cedula = userCheck.rows[0].cedula;
      user.nombre_completo = userCheck.rows[0].nombre_completo;
    } catch (dbErr) {
      console.error('[Auth] Error verificando estado de usuario:', dbErr.message);
    }

    req.user = user;

    // Propagar contexto de usuario autenticado hacia las políticas RLS de PostgreSQL
    db.runWithRlsContext(user, () => {
      next();
    });
  });
}

function authorize(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (allowedRoles.length && !allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        error: `Acceso restringido: Se requiere rol [${allowedRoles.join(', ')}]. Tu rol actual es [${req.user.rol}]`,
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  authorize,
};
