const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

// Métodos de pago (Crédito y Débito)
router.get('/methods', requireAuth, billingController.getPaymentMethods);
router.post('/methods', requireAuth, billingController.addPaymentMethod);
router.delete('/methods/:id', requireAuth, billingController.deletePaymentMethod);

// Suscripción y reglas de cobro (Suscriptor)
router.get('/subscription', requireAuth, billingController.getSubscriptionStatus);
router.post('/subscribe', requireAuth, billingController.activateSubscription);

// Finanzas y liquidaciones del creador
router.get('/creator-stats', requireAuth, requireRole('creator'), billingController.getCreatorFinancialStats);

module.exports = router;
