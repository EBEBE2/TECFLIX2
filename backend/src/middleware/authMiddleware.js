const jwt = require('jsonwebtoken');
const { pool, isPostgresConnected, memoryStore } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'tecflix_ultra_violet_secret_jwt_key_2026';

/**
 * Middleware para validar el token JWT y autenticar usuario
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Acceso no autorizado. Se requiere token Bearer en el encabezado Authorization.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    let user = null;

    if (isPostgresConnected) {
      const result = await pool.query(
        'SELECT id, email, full_name, role, avatar_url, bio, created_at FROM users WHERE id = $1',
        [decoded.id]
      );
      if (result.rowCount > 0) {
        user = result.rows[0];
      }
    } else {
      user = memoryStore.users.find((u) => u.id === decoded.id);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Sesión inválida o el usuario no existe.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token expirado o inválido.',
      error: err.message
    });
  }
}

/**
 * Middleware para restringir acceso según el rol del usuario ('creator', 'subscriber', 'admin')
 * @param  {...string} allowedRoles Roles permitidos
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Esta acción requiere rol: ${allowedRoles.join(' o ')}. Tu rol actual es: ${req.user.role}.`
      });
    }

    next();
  };
}

/**
 * Middleware de autenticación opcional (no bloquea si no hay token)
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      if (isPostgresConnected) {
        const result = await pool.query(
          'SELECT id, email, full_name, role, avatar_url FROM users WHERE id = $1',
          [decoded.id]
        );
        if (result.rowCount > 0) {
          req.user = result.rows[0];
        }
      } else {
        req.user = memoryStore.users.find((u) => u.id === decoded.id);
      }
    }
  } catch (_) {
    // Si falla token opcional, continuar como invitado
  }
  next();
}

module.exports = {
  requireAuth,
  requireRole,
  optionalAuth,
  JWT_SECRET
};
