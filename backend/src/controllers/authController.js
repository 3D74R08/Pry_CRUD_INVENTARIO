const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const db = require('../config/db');
const {
  generateBase32Secret,
  verifyTotp,
  buildOtpAuthUri,
  generateBackupCodes,
  hashBackupCode,
} = require('../utils/totp');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// Caché en memoria sincronizada con la tabla sesiones_revocadas para validación de baja latencia
const revokedJtiCache = new Set();

if (!JWT_SECRET) {
  console.error('[CRITICAL] JWT_SECRET no está configurado en las variables de entorno.');
}

async function isTokenRevoked(jti) {
  if (!jti) return false;
  if (revokedJtiCache.has(jti)) return true;
  try {
    const res = await db.pool.query(
      'SELECT jti FROM sesiones_revocadas WHERE jti = $1 AND expira_en > NOW() LIMIT 1',
      [jti]
    );
    if (res.rows.length > 0) {
      revokedJtiCache.add(jti);
      return true;
    }
  } catch {
    // Si la tabla aún se está inicializando, continuar con caché
  }
  return false;
}

async function login(req, res) {
  try {
    const { email, password, mfaCode } = req.body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Debes proporcionar email y contraseña válidos' });
    }

    const result = await db.query(
      `SELECT id, email, password_hash, nombre_completo, cedula, rol, cargo, departamento, activo,
              COALESCE(mfa_enabled, false) AS mfa_enabled, mfa_secret, mfa_backup_codes
       FROM usuarios
       WHERE LOWER(email) = LOWER($1)`,
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

    // Verificación de Segundo Factor de Autenticación (MFA - TOTP / Códigos de Respaldo)
    if (user.mfa_enabled && user.mfa_secret) {
      if (!mfaCode || String(mfaCode).trim() === '') {
        return res.status(200).json({
          mfaRequired: true,
          message: 'Ingresa el código de 6 dígitos de tu aplicación autenticadora (MFA) o un código de respaldo.',
        });
      }

      const cleanCode = String(mfaCode).trim();
      let isMfaValid = verifyTotp(cleanCode, user.mfa_secret);

      // Si no es un TOTP de 6 dígitos, verificar si corresponde a un código de recuperación de un solo uso
      if (!isMfaValid && user.mfa_backup_codes) {
        try {
          const storedHashes = JSON.parse(user.mfa_backup_codes);
          if (Array.isArray(storedHashes)) {
            const candidateHash = hashBackupCode(cleanCode);
            const idx = storedHashes.indexOf(candidateHash);
            if (idx !== -1) {
              isMfaValid = true;
              storedHashes.splice(idx, 1);
              await db.pool.query(
                'UPDATE usuarios SET mfa_backup_codes = $1, updated_at = NOW() WHERE id = $2',
                [JSON.stringify(storedHashes), user.id]
              );
            }
          }
        } catch {
          // Ignorar errores de parseo de códigos de respaldo
        }
      }

      if (!isMfaValid) {
        return res.status(401).json({
          error: 'Código de verificación MFA inválido o expirado',
          mfaRequired: true,
        });
      }
    }

    // Identificador aleatorio único de sesión (jti) para control y revocación de sesión
    const sessionJti = crypto.randomUUID();

    const tokenPayload = {
      id: user.id,
      email: user.email,
      nombre_completo: user.nombre_completo,
      cedula: user.cedula,
      rol: user.rol,
      jti: sessionJti,
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
        mfa_enabled: Boolean(user.mfa_enabled),
      },
    });
  } catch (error) {
    console.error('[Auth] Error en login:', error);
    return res.status(500).json({ error: 'Error interno en el servidor de autenticación' });
  }
}

async function logout(req, res) {
  try {
    const user = req.user;
    if (user && user.jti) {
      revokedJtiCache.add(user.jti);
      const expDate = user.exp
        ? new Date(user.exp * 1000)
        : new Date(Date.now() + 8 * 60 * 60 * 1000);

      await db.query(
        `INSERT INTO sesiones_revocadas (jti, usuario_id, expira_en)
         VALUES ($1, $2, $3)
         ON CONFLICT (jti) DO NOTHING`,
        [user.jti, user.id || null, expDate.toISOString()]
      );

      // Limpieza oportunista de sesiones revocadas ya expiradas
      db.pool
        .query('DELETE FROM sesiones_revocadas WHERE expira_en <= NOW()')
        .catch(() => {});
    }

    return res.json({ message: 'Sesión cerrada e invalidada correctamente' });
  } catch (error) {
    console.error('[Auth] Error en logout:', error);
    return res.status(500).json({ error: 'Error al cerrar sesión' });
  }
}

async function getProfile(req, res) {
  try {
    const result = await db.query(
      `SELECT id, email, nombre_completo, cedula, rol, cargo, departamento, activo,
              COALESCE(mfa_enabled, false) AS mfa_enabled, created_at
       FROM usuarios
       WHERE id = $1`,
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

// Paso 1 MFA: Generar secreto TOTP y URI otpauth:// para vincular con app autenticadora
async function setupMfa(req, res) {
  try {
    const userId = req.user.id;
    const userRes = await db.query('SELECT id, email, mfa_enabled FROM usuarios WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = userRes.rows[0];
    const secret = generateBase32Secret(20);
    const otpauthUrl = buildOtpAuthUri({
      secret,
      accountName: user.email,
      issuer: 'Inventario TI',
    });

    await db.query(
      'UPDATE usuarios SET mfa_secret = $1, updated_at = NOW() WHERE id = $2',
      [secret, userId]
    );

    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 220,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    return res.json({
      secret,
      otpauthUrl,
      qrCodeDataUrl,
      issuer: 'Inventario TI',
      account: user.email,
    });
  } catch (error) {
    console.error('[Auth MFA] Error al iniciar configuración MFA:', error);
    return res.status(500).json({ error: 'Error al generar clave secreta MFA' });
  }
}

// Paso 2 MFA: Verificar código de 6 dígitos y activar MFA + generar códigos de respaldo
async function enableMfa(req, res) {
  try {
    const userId = req.user.id;
    const { code } = req.body;

    if (!code || String(code).trim().length < 6) {
      return res.status(400).json({ error: 'Debes ingresar el código de 6 dígitos generado por tu aplicación autenticadora' });
    }

    const userRes = await db.query('SELECT id, email, nombre_completo, mfa_secret FROM usuarios WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = userRes.rows[0];
    if (!user.mfa_secret) {
      return res.status(400).json({ error: 'Primero debes iniciar la vinculación MFA para generar tu clave secreta' });
    }

    const isValid = verifyTotp(code, user.mfa_secret);
    if (!isValid) {
      return res.status(400).json({ error: 'El código ingresado es incorrecto o ha expirado. Verifica la hora de tu dispositivo.' });
    }

    const { plainCodes, hashedCodes } = generateBackupCodes(6);

    await db.query(
      'UPDATE usuarios SET mfa_enabled = true, mfa_backup_codes = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(hashedCodes), userId]
    );

    return res.json({
      message: 'Autenticación Multifactor (MFA) activada exitosamente',
      mfa_enabled: true,
      backupCodes: plainCodes,
    });
  } catch (error) {
    console.error('[Auth MFA] Error al activar MFA:', error);
    return res.status(500).json({ error: 'Error al activar la Autenticación Multifactor' });
  }
}

// Desactivar MFA (requiere confirmar la contraseña actual del usuario o código TOTP válido)
async function disableMfa(req, res) {
  try {
    const userId = req.user.id;
    const { password, code } = req.body;

    const userRes = await db.query(
      'SELECT id, password_hash, mfa_secret FROM usuarios WHERE id = $1',
      [userId]
    );
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = userRes.rows[0];
    let authorized = false;

    if (password && typeof password === 'string') {
      authorized = await bcrypt.compare(password, user.password_hash);
    }
    if (!authorized && code && user.mfa_secret) {
      authorized = verifyTotp(code, user.mfa_secret);
    }

    if (!authorized) {
      return res.status(401).json({ error: 'Debes confirmar tu contraseña actual o un código TOTP válido para desactivar MFA' });
    }

    await db.query(
      'UPDATE usuarios SET mfa_enabled = false, mfa_secret = NULL, mfa_backup_codes = NULL, updated_at = NOW() WHERE id = $1',
      [userId]
    );

    return res.json({
      message: 'Autenticación Multifactor (MFA) desactivada correctamente',
      mfa_enabled: false,
    });
  } catch (error) {
    console.error('[Auth MFA] Error al desactivar MFA:', error);
    return res.status(500).json({ error: 'Error al desactivar la Autenticación Multifactor' });
  }
}

module.exports = {
  login,
  logout,
  getProfile,
  setupMfa,
  enableMfa,
  disableMfa,
  isTokenRevoked,
};
