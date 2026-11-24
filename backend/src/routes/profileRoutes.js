const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { requireAuth, optionalAuth } = require('../middleware/authMiddleware');

router.get('/', requireAuth, profileController.getProfiles);
router.post('/', requireAuth, profileController.createProfile);
router.put('/:id/skin', requireAuth, profileController.updateProfileSkin);

// Rutas de skins
router.get('/skins/all', optionalAuth, profileController.getSkins);
router.post('/skins/custom', requireAuth, profileController.createCustomSkin);

module.exports = router;
