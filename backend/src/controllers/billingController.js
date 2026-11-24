const { pool, isPostgresConnected, memoryStore } = require('../config/db');

/**
 * Obtener métodos de pago (Crédito y Débito) del usuario o creador
 */
async function getPaymentMethods(req, res) {
  try {
    const userId = req.user.id;

    if (isPostgresConnected) {
      const result = await pool.query(
        `SELECT id, user_id, role_type, type, cardholder_name, card_brand, card_last4, exp_month, exp_year, is_default, billing_address, created_at
         FROM payment_methods
         WHERE user_id = $1
         ORDER BY is_default DESC, created_at DESC`,
        [userId]
      );
      return res.json({ success: true, data: result.rows });
    } else {
      const list = memoryStore.payment_methods.filter(m => m.user_id === userId);
      return res.json({ success: true, data: list });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error al consultar métodos de pago.', error: err.message });
  }
}

/**
 * Registrar un nuevo método de pago (Tarjeta de Crédito o Débito)
 */
async function addPaymentMethod(req, res) {
  try {
    const userId = req.user.id;
    const roleType = req.user.role; // 'creator' o 'subscriber'
    const { type = 'credit', cardholder_name, card_number, exp_month, exp_year, billing_address, is_default = true } = req.body;

    if (!cardholder_name || !card_number || !exp_month || !exp_year) {
      return res.status(400).json({
        success: false,
        message: 'Por favor completa todos los campos de la tarjeta: titular, número, mes y año.'
      });
    }

    if (!['credit', 'debit'].includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "El tipo de tarjeta debe ser 'credit' (Crédito) o 'debit' (Débito)."
      });
    }

    // Normalizar y extraer últimos 4 dígitos
    const cleanNumber = card_number.replace(/\s+/g, '').replace(/-/g, '');
    const cardLast4 = cleanNumber.slice(-4) || '4242';

    // Determinar marca de tarjeta
    let brand = 'Visa';
    if (cleanNumber.startsWith('5') || cleanNumber.startsWith('2')) brand = 'Mastercard';
    else if (cleanNumber.startsWith('3')) brand = 'American Express';

    if (isPostgresConnected) {
      if (is_default) {
        await pool.query(`UPDATE payment_methods SET is_default = FALSE WHERE user_id = $1`, [userId]);
      }

      const result = await pool.query(
        `INSERT INTO payment_methods
          (user_id, role_type, type, cardholder_name, card_brand, card_last4, exp_month, exp_year, is_default, billing_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, user_id, role_type, type, cardholder_name, card_brand, card_last4, exp_month, exp_year, is_default, billing_address, created_at`,
        [userId, roleType, type.toLowerCase(), cardholder_name.trim(), brand, cardLast4, parseInt(exp_month, 10), parseInt(exp_year, 10), is_default, billing_address || '']
      );

      return res.status(201).json({
        success: true,
        message: `Tarjeta de ${type === 'credit' ? 'Crédito' : 'Débito'} registrada exitosamente.`,
        data: result.rows[0]
      });
    } else {
      if (is_default) {
        memoryStore.payment_methods.forEach(m => {
          if (m.user_id === userId) m.is_default = false;
        });
      }

      const newMethod = {
        id: memoryStore.payment_methods.length + 1,
        user_id: userId,
        role_type: roleType,
        type: type.toLowerCase(),
        cardholder_name: cardholder_name.trim(),
        card_brand: brand,
        card_last4: cardLast4,
        exp_month: parseInt(exp_month, 10),
        exp_year: parseInt(exp_year, 10),
        is_default: Boolean(is_default),
        billing_address: billing_address || '',
        created_at: new Date()
      };
      memoryStore.payment_methods.push(newMethod);

      return res.status(201).json({
        success: true,
        message: `Tarjeta de ${type === 'credit' ? 'Crédito' : 'Débito'} registrada exitosamente.`,
        data: newMethod
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error registrando método de pago.', error: err.message });
  }
}

/**
 * Eliminar un método de pago
 */
async function deletePaymentMethod(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (isPostgresConnected) {
      await pool.query(`DELETE FROM payment_methods WHERE id = $1 AND user_id = $2`, [id, userId]);
    } else {
      const idx = memoryStore.payment_methods.findIndex(m => m.id === parseInt(id, 10) && m.user_id === userId);
      if (idx !== -1) memoryStore.payment_methods.splice(idx, 1);
    }

    return res.json({ success: true, message: 'Método de pago eliminado.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error eliminando método de pago.', error: err.message });
  }
}

/**
 * Consultar estado de la suscripción y reglas de cobro
 */
async function getSubscriptionStatus(req, res) {
  try {
    const userId = req.user.id;

    let sub = null;

    if (isPostgresConnected) {
      const result = await pool.query(
        `SELECT s.*, pm.card_brand, pm.card_last4, pm.type as card_type
         FROM subscriptions s
         LEFT JOIN payment_methods pm ON s.payment_method_id = pm.id
         WHERE s.user_id = $1`,
        [userId]
      );
      if (result.rowCount > 0) sub = result.rows[0];
    } else {
      sub = memoryStore.subscriptions.find(s => s.user_id === userId);
      if (sub && sub.payment_method_id) {
        const pm = memoryStore.payment_methods.find(m => m.id === sub.payment_method_id);
        if (pm) {
          sub.card_brand = pm.card_brand;
          sub.card_last4 = pm.card_last4;
          sub.card_type = pm.type;
        }
      }
    }

    if (!sub) {
      // Estado predeterminado si es nuevo
      return res.json({
        success: true,
        data: {
          status: 'trial',
          plan_name: 'TECFLIX Purple Pass',
          videos_watched_count: 0,
          max_free_videos: 2,
          trial_ends_at: new Date(Date.now() + 24 * 3600000),
          billing_starts_at: new Date(Date.now() + 24 * 3600000),
          monthly_price: 9.99,
          currency: 'USD'
        }
      });
    }

    return res.json({ success: true, data: sub });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error al consultar suscripción.', error: err.message });
  }
}

/**
 * Activar o renovar la membresía (cobro de suscripción con tarjeta de crédito o débito)
 */
async function activateSubscription(req, res) {
  try {
    const userId = req.user.id;
    const { payment_method_id } = req.body;

    let pm = null;

    // Verificar método de pago
    if (isPostgresConnected) {
      const pmRes = payment_method_id
        ? await pool.query('SELECT * FROM payment_methods WHERE id = $1 AND user_id = $2', [payment_method_id, userId])
        : await pool.query('SELECT * FROM payment_methods WHERE user_id = $1 ORDER BY is_default DESC LIMIT 1', [userId]);

      if (pmRes.rowCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'Debes registrar una tarjeta de crédito o débito para activar tu suscripción.'
        });
      }
      pm = pmRes.rows[0];

      // Actualizar o crear suscripción como 'active'
      const invoiceNumber = `INV-TEC-${Date.now().toString().slice(-6)}`;
      const price = 9.99;

      const subUpdate = await pool.query(
        `INSERT INTO subscriptions (user_id, plan_name, status, trial_ends_at, billing_starts_at, videos_watched_count, max_free_videos, monthly_price, currency, payment_method_id, last_billed_at, updated_at)
         VALUES ($1, 'TECFLIX Purple Pass VIP', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0, 2, $2, 'USD', $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO UPDATE SET
           status = 'active',
           payment_method_id = $3,
           last_billed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [userId, price, pm.id]
      );

      // Registrar transacción de cobro
      await pool.query(
        `INSERT INTO billing_transactions (user_id, subscription_id, payment_method_id, amount, currency, status, card_type, description, invoice_number)
         VALUES ($1, $2, $3, $4, 'USD', 'succeeded', $5, 'Activación Membresía TECFLIX VIP (Acceso Ilimitado)', $6)`,
        [userId, subUpdate.rows[0].id, pm.id, price, pm.type, invoiceNumber]
      );

      return res.json({
        success: true,
        message: `¡Membresía activada con éxito! Cobro de $${price} USD procesado a tu tarjeta de ${pm.type === 'credit' ? 'Crédito' : 'Débito'} terminada en ${pm.card_last4}.`,
        subscription: subUpdate.rows[0],
        invoice: { invoiceNumber, amount: price, currency: 'USD' }
      });
    } else {
      pm = payment_method_id
        ? memoryStore.payment_methods.find(m => m.id === parseInt(payment_method_id, 10) && m.user_id === userId)
        : memoryStore.payment_methods.find(m => m.user_id === userId);

      if (!pm) {
        return res.status(400).json({
          success: false,
          message: 'Debes registrar una tarjeta de crédito o débito para activar tu suscripción.'
        });
      }

      let sub = memoryStore.subscriptions.find(s => s.user_id === userId);
      if (!sub) {
        sub = {
          id: memoryStore.subscriptions.length + 1,
          user_id: userId,
          plan_name: 'TECFLIX Purple Pass VIP',
          status: 'active',
          trial_ends_at: new Date(),
          billing_starts_at: new Date(),
          videos_watched_count: 0,
          max_free_videos: 2,
          monthly_price: 9.99,
          currency: 'USD',
          payment_method_id: pm.id,
          last_billed_at: new Date()
        };
        memoryStore.subscriptions.push(sub);
      } else {
        sub.status = 'active';
        sub.payment_method_id = pm.id;
        sub.last_billed_at = new Date();
      }

      const invoiceNumber = `INV-TEC-${Date.now().toString().slice(-6)}`;
      memoryStore.billing_transactions.push({
        id: memoryStore.billing_transactions.length + 1,
        user_id: userId,
        subscription_id: sub.id,
        payment_method_id: pm.id,
        amount: 9.99,
        currency: 'USD',
        status: 'succeeded',
        card_type: pm.type,
        description: 'Activación Membresía TECFLIX VIP (Acceso Ilimitado)',
        invoice_number: invoiceNumber,
        created_at: new Date()
      });

      return res.json({
        success: true,
        message: `¡Membresía activada con éxito! Cobro de $9.99 USD procesado a tu tarjeta de ${pm.type === 'credit' ? 'Crédito' : 'Débito'} terminada en ${pm.card_last4}.`,
        subscription: sub,
        invoice: { invoiceNumber, amount: 9.99, currency: 'USD' }
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error procesando cobro de suscripción.', error: err.message });
  }
}

/**
 * Obtener estadísticas financieras del creador (vistas acumuladas y pagos pendientes/realizados)
 */
async function getCreatorFinancialStats(req, res) {
  try {
    const creatorId = req.user.id;

    if (isPostgresConnected) {
      const viewsRes = await pool.query(
        `SELECT COALESCE(SUM(views_count), 0) as total_views, count(*) as total_videos
         FROM videos WHERE creator_id = $1`,
        [creatorId]
      );
      const totalViews = parseInt(viewsRes.rows[0].total_views, 10);
      const totalVideos = parseInt(viewsRes.rows[0].total_videos, 10);

      // Estimar regalías: $0.05 USD por reproducción
      const estimatedEarnings = (totalViews * 0.05).toFixed(2);

      const cardsRes = await pool.query(
        `SELECT id, type, card_brand, card_last4, is_default FROM payment_methods WHERE user_id = $1 AND role_type = 'creator'`,
        [creatorId]
      );

      return res.json({
        success: true,
        data: {
          total_views: totalViews,
          total_videos: totalVideos,
          estimated_earnings: parseFloat(estimatedEarnings),
          currency: 'USD',
          rate_per_view: 0.05,
          payout_methods: cardsRes.rows
        }
      });
    } else {
      const myVideos = memoryStore.videos.filter(v => v.creator_id === creatorId);
      const totalViews = myVideos.reduce((acc, v) => acc + (v.views_count || 0), 0);
      const estimatedEarnings = (totalViews * 0.05).toFixed(2);
      const payoutMethods = memoryStore.payment_methods.filter(m => m.user_id === creatorId && m.role_type === 'creator');

      return res.json({
        success: true,
        data: {
          total_views: totalViews,
          total_videos: myVideos.length,
          estimated_earnings: parseFloat(estimatedEarnings),
          currency: 'USD',
          rate_per_view: 0.05,
          payout_methods: payoutMethods
        }
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error consultando finanzas del creador.', error: err.message });
  }
}

module.exports = {
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  getSubscriptionStatus,
  activateSubscription,
  getCreatorFinancialStats
};
