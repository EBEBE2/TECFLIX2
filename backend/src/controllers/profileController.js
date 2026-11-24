const { pool, isPostgresConnected, memoryStore } = require('../config/db');

/**
 * Obtener todos los perfiles del usuario actual
 */
async function getProfiles(req, res) {
  try {
    const userId = req.user.id;

    if (isPostgresConnected) {
      const result = await pool.query(
        `SELECT p.*, s.name as skin_name, s.avatar_url, s.frame_style, s.glow_color, s.theme_accent, s.border_width
         FROM profiles p
         LEFT JOIN profile_skins s ON p.skin_id = s.id
         WHERE p.user_id = $1
         ORDER BY p.id ASC`,
        [userId]
      );
      return res.json({ success: true, data: result.rows });
    } else {
      const list = memoryStore.profiles
        .filter(p => p.user_id === userId)
        .map(p => {
          const skin = memoryStore.profile_skins.find(s => s.id === p.skin_id) || {};
          return {
            ...p,
            skin_name: skin.name || 'Por defecto',
            avatar_url: skin.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
            frame_style: skin.frame_style || 'neon_purple',
            glow_color: skin.glow_color || '#a855f7',
            theme_accent: skin.theme_accent || '#7c3aed',
            border_width: skin.border_width || 3
          };
        });
      return res.json({ success: true, data: list });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error al consultar perfiles.', error: err.message });
  }
}

/**
 * Crear un nuevo perfil para la cuenta
 */
async function createProfile(req, res) {
  try {
    const userId = req.user.id;
    const { name, skin_id = 1, is_kids = false } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'El nombre del perfil es requerido.' });
    }

    if (isPostgresConnected) {
      const result = await pool.query(
        `INSERT INTO profiles (user_id, name, skin_id, is_kids)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, name.trim(), skin_id, is_kids]
      );
      return res.status(201).json({ success: true, message: 'Perfil creado con éxito.', data: result.rows[0] });
    } else {
      const newP = {
        id: memoryStore.profiles.length + 1,
        user_id: userId,
        name: name.trim(),
        skin_id: skin_id || 1,
        is_kids: Boolean(is_kids),
        created_at: new Date()
      };
      memoryStore.profiles.push(newP);
      return res.status(201).json({ success: true, message: 'Perfil creado con éxito.', data: newP });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error al crear perfil.', error: err.message });
  }
}

/**
 * Actualizar la skin asignada a un perfil
 */
async function updateProfileSkin(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { skin_id } = req.body;

    if (!skin_id) {
      return res.status(400).json({ success: false, message: 'Debe especificarse el skin_id.' });
    }

    if (isPostgresConnected) {
      const result = await pool.query(
        `UPDATE profiles SET skin_id = $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
        [skin_id, id, userId]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'Perfil no encontrado.' });
      }
      return res.json({ success: true, message: 'Skin de perfil actualizada.', data: result.rows[0] });
    } else {
      const p = memoryStore.profiles.find(x => x.id === parseInt(id, 10) && x.user_id === userId);
      if (!p) {
        return res.status(404).json({ success: false, message: 'Perfil no encontrado.' });
      }
      p.skin_id = parseInt(skin_id, 10);
      return res.json({ success: true, message: 'Skin de perfil actualizada.', data: p });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error actualizando skin.', error: err.message });
  }
}

/**
 * Obtener catálogo de skins disponibles
 */
async function getSkins(req, res) {
  try {
    const userId = req.user ? req.user.id : null;

    if (isPostgresConnected) {
      const result = await pool.query(
        `SELECT * FROM profile_skins
         WHERE is_custom = FALSE OR created_by = $1
         ORDER BY id ASC`,
        [userId]
      );
      return res.json({ success: true, data: result.rows });
    } else {
      const list = memoryStore.profile_skins.filter(s => !s.is_custom || s.created_by === userId);
      return res.json({ success: true, data: list });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error al obtener skins.', error: err.message });
  }
}

/**
 * Crear una skin personalizada
 */
async function createCustomSkin(req, res) {
  try {
    const userId = req.user.id;
    const { name, avatar_url, frame_style = 'neon_purple', glow_color = '#a855f7', theme_accent = '#7c3aed', border_width = 3 } = req.body;

    if (!name || !avatar_url) {
      return res.status(400).json({ success: false, message: 'Nombre y URL de avatar son requeridos.' });
    }

    if (isPostgresConnected) {
      const result = await pool.query(
        `INSERT INTO profile_skins (name, avatar_url, frame_style, glow_color, theme_accent, border_width, is_custom, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7)
         RETURNING *`,
        [name.trim(), avatar_url.trim(), frame_style, glow_color, theme_accent, parseInt(border_width, 10) || 3, userId]
      );
      return res.status(201).json({ success: true, message: '¡Skin personalizada creada!', data: result.rows[0] });
    } else {
      const newSkin = {
        id: memoryStore.profile_skins.length + 1,
        name: name.trim(),
        avatar_url: avatar_url.trim(),
        frame_style,
        glow_color,
        theme_accent,
        border_width: parseInt(border_width, 10) || 3,
        is_custom: true,
        created_by: userId
      };
      memoryStore.profile_skins.push(newSkin);
      return res.status(201).json({ success: true, message: '¡Skin personalizada creada!', data: newSkin });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error al crear skin.', error: err.message });
  }
}

module.exports = {
  getProfiles,
  createProfile,
  updateProfileSkin,
  getSkins,
  createCustomSkin
};
