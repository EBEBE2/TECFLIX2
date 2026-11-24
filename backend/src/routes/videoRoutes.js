const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const os = require('os');
const videoController = require('../controllers/videoController');
const { requireAuth, requireRole, optionalAuth } = require('../middleware/authMiddleware');

// Configuración de Multer para subida de videos y miniaturas
const upload = multer({
  dest: path.join(os.tmpdir(), 'tecflix-uploads'),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB
  }
});

// Rutas públicas / catálogo
router.get('/', optionalAuth, videoController.getVideos);
router.get('/:id', optionalAuth, videoController.getVideoById);

// Subida de video (Solo creador)
router.post(
  '/upload',
  requireAuth,
  requireRole('creator'),
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  videoController.uploadVideo
);

// Registrar reproducción y validar reglas de cobro (Suscriptor)
router.post('/:id/watch', requireAuth, videoController.watchVideo);

// Eliminar video (Solo creador propietario)
router.delete('/:id', requireAuth, requireRole('creator'), videoController.deleteVideo);

module.exports = router;
