const express = require('express');
const router = express.Router();
const eventosController = require('../controllers/eventosController');
const { authenticateToken } = require('../middlewares/auth');

router.get('/', authenticateToken, eventosController.getAllEventos);
router.get('/metricas', authenticateToken, eventosController.getMetricasDashboard);
router.get('/recientes', authenticateToken, eventosController.getEventosRecientes);
router.get('/equipo/:equipoId', authenticateToken, eventosController.getEventosByEquipo);

module.exports = router;
