const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, isPostgresConnected, memoryStore } = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * Registro de nuevo usuario (Creador o Suscriptor con credenciales separadas)
 */
async function register(req, res) {
  try {
    const { email, password, full_name, role = 'subscriber', avatar_url, bio } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporciona email, contraseña y nombre completo.'
      });
    }

    if (!['creator', 'subscriber'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "El rol debe ser 'creator' (Creador de contenido) o 'subscriber' (Suscriptor espectador)."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres.'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const normalizedEmail = email.trim().toLowerCase();
    const defaultAvatar = avatar_url || (role === 'creator'
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop'
      : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop');

    let newUser = null;

    if (isPostgresConnected) {
      // Verificar si ya existe
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
      if (existingUser.rowCount > 0) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe una cuenta registrada con este correo electrónico.'
        });
      }

      // Insertar usuario
      const insertUserRes = await pool.query(
        `INSERT INTO users (email, password_hash, full_name, role, avatar_url, bio)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, email, full_name, role, avatar_url, bio, created_at`,
        [normalizedEmail, hashedPassword, full_name.trim(), role, defaultAvatar, bio || null]
      );
      newUser = insertUserRes.rows[0];

      // Crear perfil predeterminado
      const profileName = role === 'creator' ? `${full_name.trim()} (Estudio)` : `${full_name.trim()} (Principal)`;
      await pool.query(
        `INSERT INTO profiles (user_id, name, skin_id, is_kids)
         VALUES ($1, $2, 1, FALSE)`,
        [newUser.id, profileName]
      );

      // Si es suscriptor, inicializar registro de suscripción con periodo de prueba de 1 día y 2 videos
      if (role === 'subscriber') {
        await pool.query(
          `INSERT INTO subscriptions (user_id, plan_name, status, trial_ends_at, billing_starts_at, videos_watched_count, max_free_videos, monthly_price)
           VALUES ($1, 'TECFLIX Purple Pass', 'trial', CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day', 0, 2, 9.99)`,
          [newUser.id]
        );
      }
    } else {
      // Memory Store Fallback
      const existing = memoryStore.users.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe una cuenta con este correo electrónico.'
        });
      }

      newUser = {
        id: memoryStore.users.length + 1,
        email: normalizedEmail,
        password_hash: hashedPassword,
        full_name: full_name.trim(),
        role,
        avatar_url: defaultAvatar,
        bio: bio || null,
        created_at: new Date()
      };
      memoryStore.users.push(newUser);

      // Perfil en memoria
      const profileName = role === 'creator' ? `${full_name.trim()} (Estudio)` : `${full_name.trim()} (Principal)`;
      memoryStore.profiles.push({
        id: memoryStore.profiles.length + 1,
        user_id: newUser.id,
        name: profileName,
        skin_id: 1,
        is_kids: false
      });

      // Suscripción en memoria
      if (role === 'subscriber') {
        memoryStore.subscriptions.push({
          id: memoryStore.subscriptions.length + 1,
          user_id: newUser.id,
          plan_name: 'TECFLIX Purple Pass',
          status: 'trial',
          trial_ends_at: new Date(Date.now() + 24 * 3600000),
          billing_starts_at: new Date(Date.now() + 24 * 3600000),
          videos_watched_count: 0,
          max_free_videos: 2,
          monthly_price: 9.99,
          currency: 'USD'
        });
      }
    }

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: `¡Registro exitoso como ${role === 'creator' ? 'Creador de Contenido' : 'Suscriptor Espectador'}!`,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        avatar_url: newUser.avatar_url,
        bio: newUser.bio
      }
    });
  } catch (err) {
    console.error('[Error en register]', err);
    return res.status(500).json({
      success: false,
      message: 'Ocurrió un error en el servidor al procesar el registro.',
      error: err.message
    });
  }
}

/**
 * Inicio de sesión para Creadores o Suscriptores
 */
async function login(req, res) {
  try {
    const { email, password, expectedRole } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor ingresa tu correo electrónico y contraseña.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = null;

    if (isPostgresConnected) {
      const result = await pool.query(
        'SELECT id, email, password_hash, full_name, role, avatar_url, bio FROM users WHERE email = $1',
        [normalizedEmail]
      );
      if (result.rowCount > 0) {
        user = result.rows[0];
      }
    } else {
      user = memoryStore.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas. Correo electrónico o contraseña incorrectos.'
      });
    }

    // Verificar si el portal exige un rol específico
    if (expectedRole && user.role !== expectedRole) {
      return res.status(403).json({
        success: false,
        message: `Esta cuenta está registrada como '${user.role === 'creator' ? 'Creador' : 'Suscriptor'}'. Por favor accede desde el portal correspondiente.`
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas. Contraseña incorrecta.'
      });
    }

    // Obtener detalles de suscripción si es suscriptor
    let subscription = null;
    if (user.role === 'subscriber') {
      if (isPostgresConnected) {
        const subRes = await pool.query(
          `SELECT status, trial_ends_at, billing_starts_at, videos_watched_count, max_free_videos, monthly_price
           FROM subscriptions WHERE user_id = $1`,
          [user.id]
        );
        if (subRes.rowCount > 0) {
          subscription = subRes.rows[0];
        }
      } else {
        subscription = memoryStore.subscriptions.find((s) => s.user_id === user.id) || null;
      }
    }

    // Obtener perfiles
    let profiles = [];
    if (isPostgresConnected) {
      const profRes = await pool.query(
        `SELECT p.id, p.name, p.skin_id, p.is_kids, s.name as skin_name, s.avatar_url, s.frame_style, s.glow_color, s.theme_accent
         FROM profiles p
         LEFT JOIN profile_skins s ON p.skin_id = s.id
         WHERE p.user_id = $1`,
        [user.id]
      );
      profiles = profRes.rows;
    } else {
      profiles = memoryStore.profiles
        .filter((p) => p.user_id === user.id)
        .map((p) => {
          const skin = memoryStore.profile_skins.find((s) => s.id === p.skin_id) || {};
          return { ...p, ...skin, skin_name: skin.name };
        });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      message: `¡Bienvenido de nuevo a TECFLIX, ${user.full_name}!`,
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        avatar_url: user.avatar_url,
        bio: user.bio
      },
      subscription,
      profiles
    });
  } catch (err) {
    console.error('[Error en login]', err);
    return res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión.',
      error: err.message
    });
  }
}

/**
 * Obtener perfil de usuario actual con token
 */
async function getMe(req, res) {
  try {
    const user = req.user;
    let subscription = null;
    let profiles = [];

    if (user.role === 'subscriber') {
      if (isPostgresConnected) {
        const subRes = await pool.query(
          `SELECT status, trial_ends_at, billing_starts_at, videos_watched_count, max_free_videos, monthly_price
           FROM subscriptions WHERE user_id = $1`,
          [user.id]
        );
        if (subRes.rowCount > 0) subscription = subRes.rows[0];
      } else {
        subscription = memoryStore.subscriptions.find((s) => s.user_id === user.id) || null;
      }
    }

    if (isPostgresConnected) {
      const profRes = await pool.query(
        `SELECT p.id, p.name, p.skin_id, p.is_kids, s.name as skin_name, s.avatar_url, s.frame_style, s.glow_color, s.theme_accent
         FROM profiles p
         LEFT JOIN profile_skins s ON p.skin_id = s.id
         WHERE p.user_id = $1`,
        [user.id]
      );
      profiles = profRes.rows;
    } else {
      profiles = memoryStore.profiles
        .filter((p) => p.user_id === user.id)
        .map((p) => {
          const skin = memoryStore.profile_skins.find((s) => s.id === p.skin_id) || {};
          return { ...p, ...skin, skin_name: skin.name };
        });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        avatar_url: user.avatar_url,
        bio: user.bio
      },
      subscription,
      profiles
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error al consultar perfil del usuario.',
      error: err.message
    });
  }
}

module.exports = {
  register,
  login,
  getMe
};
