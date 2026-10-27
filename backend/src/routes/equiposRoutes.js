const express = require('express');
const router = express.Router();
const equiposController = require('../controllers/equiposController');
const { authenticateToken, authorize } = require('../middlewares/auth');

// Listar y consultar equipos (ADMIN y TECNICO ven todos, EMPLEADO solo los propios)
router.get('/', authenticateToken, equiposController.getEquipos);
router.get('/conteos', authenticateToken, equiposController.getConteosModulos);
router.get('/resumen-asignaciones', authenticateToken, equiposController.getResumenAsignaciones);
router.get('/:id', authenticateToken, equiposController.getEquipoById);
router.get('/:id/acta-entrega', authenticateToken, equiposController.descargarActaEntrega);
router.post('/:id/acta-entrega', authenticateToken, equiposController.descargarActaEntrega);
router.get('/:id/hoja-de-vida', authenticateToken, equiposController.descargarHojaDeVida);
router.get('/:id/hoja-de-vida/descargar', authenticateToken, equiposController.descargarHojaDeVida);
router.get('/:id/hoja-de-vida/datos', authenticateToken, equiposController.getHojaVida);
router.put('/:id/hoja-de-vida', authenticateToken, authorize(['ADMIN', 'TECNICO']), equiposController.updateHojaVida);
router.post('/:id/hoja-de-vida/acciones', authenticateToken, authorize(['ADMIN', 'TECNICO']), equiposController.agregarAccionHojaVida);
router.delete('/:id/hoja-de-vida/acciones/:accionId', authenticateToken, authorize(['ADMIN', 'TECNICO']), equiposController.eliminarAccionHojaVida);

// Operaciones de modificación (ADMIN y TECNICO)
router.post('/', authenticateToken, authorize(['ADMIN', 'TECNICO']), equiposController.createEquipo);
router.put('/:id', authenticateToken, authorize(['ADMIN', 'TECNICO']), equiposController.updateEquipo);
router.post('/:id/baja', authenticateToken, authorize(['ADMIN', 'TECNICO']), equiposController.darDeBaja);
router.post('/:id/prestamo', authenticateToken, authorize(['ADMIN', 'TECNICO']), equiposController.registrarPrestamo);
router.post('/:id/devolucion', authenticateToken, authorize(['ADMIN', 'TECNICO']), equiposController.registrarDevolucion);
router.delete('/:id', authenticateToken, authorize(['ADMIN', 'TECNICO']), equiposController.deleteEquipo);

// Reporte de fallas (Permitido a EMPLEADOS, TECNICO y ADMIN)
router.post('/:id/reportar-fallo', authenticateToken, equiposController.reportarFallo);

module.exports = router;
