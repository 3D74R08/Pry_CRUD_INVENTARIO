const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');
const { loginLimiter } = require('../middlewares/rateLimiter');

router.post('/login', loginLimiter, authController.login);
router.get('/me', authenticateToken, authController.getProfile);

module.exports = router;
