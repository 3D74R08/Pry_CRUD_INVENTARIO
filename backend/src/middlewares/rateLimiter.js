const rateLimit = require('express-rate-limit');

// Limitador general de la API (300 peticiones cada 15 minutos por IP)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas solicitudes desde esta dirección IP. Por favor intenta de nuevo más tarde.',
  },
});

// Limitador estricto contra ataques de fuerza bruta en autenticación:
// Máximo 5 intentos fallidos por ventana de 15 minutos por IP.
// Las solicitudes con autenticación exitosa (HTTP 2xx) NO consumen intentos.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiados intentos fallidos de inicio de sesión. Por motivos de seguridad, espera 15 minutos antes de volver a intentar.',
  },
});

module.exports = {
  generalLimiter,
  loginLimiter,
};
