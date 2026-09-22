const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_super_secret_key_prod_activos_ti_998877_xyz';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso no autorizado: Token no proporcionado' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.user = user;
    next();
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
