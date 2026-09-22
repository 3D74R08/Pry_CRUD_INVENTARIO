const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { authenticateToken, authorize } = require('../middlewares/auth');

// Todas las rutas de usuarios son exclusivas del rol ADMIN
router.use(authenticateToken, authorize(['ADMIN']));

router.get('/', usuariosController.getUsuarios);
router.post('/', usuariosController.createUsuario);
router.put('/:id', usuariosController.updateUsuario);
router.patch('/:id/toggle-activo', usuariosController.toggleUsuarioActivo);
router.delete('/:id', usuariosController.deleteUsuario);

module.exports = router;
