const { pool, isPostgresConnected, memoryStore } = require('../config/db');

async function getCategories(req, res) {
  try {
    if (isPostgresConnected) {
      const result = await pool.query('SELECT * FROM categories ORDER BY id ASC');
      return res.json({ success: true, data: result.rows });
    } else {
      return res.json({ success: true, data: memoryStore.categories });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error al consultar categorías.', error: err.message });
  }
}

module.exports = {
  getCategories
};
