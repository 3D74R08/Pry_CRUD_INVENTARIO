const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');
const { loginLimiter } = require('../middlewares/rateLimiter');

router.post('/login', loginLimiter, authController.login);
router.post('/logout', authenticateToken, authController.logout);
router.get('/me', authenticateToken, authController.getProfile);

// Rutas de Autenticación Multifactor (MFA - TOTP RFC 6238)
router.post('/mfa/setup', authenticateToken, authController.setupMfa);
router.post('/mfa/enable', authenticateToken, authController.enableMfa);
router.post('/mfa/disable', authenticateToken, authController.disableMfa);

module.exports = router;
