const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const tareasController = require('../controllers/tareasController');
const { authenticateToken, authorize } = require('../middlewares/auth');

const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `import-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB máximo
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.csv', '.xlsx', '.xls', '.xltx'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos CSV o Excel (.csv, .xlsx, .xls, .xltx)'));
    }
  },
});

// Encolar tarea de carga masiva (ADMIN y TECNICO)
router.post(
  '/carga-masiva',
  authenticateToken,
  authorize(['ADMIN', 'TECNICO']),
  upload.single('archivo'),
  tareasController.crearTareaCargaMasiva
);

// Descargar plantilla oficial de inventario (.xltx)
router.get('/plantilla', authenticateToken, tareasController.descargarPlantilla);

// Consultar estado de una tarea por ID
router.get('/:id', authenticateToken, tareasController.getTareaById);

// Listar tareas recientes (ADMIN y TECNICO)
router.get('/', authenticateToken, authorize(['ADMIN', 'TECNICO']), tareasController.getTareas);

module.exports = router;
