const fs = require('fs');
const path = require('path');
const { pool, isPostgresConnected, memoryStore } = require('../config/db');
const storageService = require('../services/storageService');

/**
 * Obtener catálogo de videos con filtros opcionales
 */
async function getVideos(req, res) {
  try {
    const { category, search, featured } = req.query;

    if (isPostgresConnected) {
      let queryStr = `
        SELECT v.*, c.name as category_name, c.slug as category_slug, u.full_name as creator_name, u.avatar_url as creator_avatar
        FROM videos v
        LEFT JOIN categories c ON v.category_id = c.id
        LEFT JOIN users u ON v.creator_id = u.id
        WHERE v.is_published = TRUE
      `;
      const queryParams = [];

      if (category) {
        queryParams.push(category);
        queryStr += ` AND (c.slug = $${queryParams.length} OR c.name ILIKE $${queryParams.length})`;
      }

      if (search) {
        queryParams.push(`%${search}%`);
        queryStr += ` AND (v.title ILIKE $${queryParams.length} OR v.description ILIKE $${queryParams.length})`;
      }

      if (featured === 'true') {
        queryStr += ` AND v.is_featured = TRUE`;
      }

      queryStr += ` ORDER BY v.is_featured DESC, v.created_at DESC`;

      const result = await pool.query(queryStr, queryParams);
      return res.json({ success: true, count: result.rowCount, data: result.rows });
    } else {
      let filtered = [...memoryStore.videos].filter(v => v.is_published);

      if (category) {
        const cat = memoryStore.categories.find(c => c.slug === category || c.name.toLowerCase() === category.toLowerCase());
        if (cat) {
          filtered = filtered.filter(v => v.category_id === cat.id);
        }
      }

      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(v => v.title.toLowerCase().includes(s) || v.description.toLowerCase().includes(s));
      }

      if (featured === 'true') {
        filtered = filtered.filter(v => v.is_featured);
      }

      const enriched = filtered.map(v => {
        const cat = memoryStore.categories.find(c => c.id === v.category_id) || {};
        const creator = memoryStore.users.find(u => u.id === v.creator_id) || {};
        return {
          ...v,
          category_name: cat.name || 'General',
          category_slug: cat.slug || 'general',
          creator_name: creator.full_name || 'Creador TECFLIX',
          creator_avatar: creator.avatar_url || ''
        };
      });

      return res.json({ success: true, count: enriched.length, data: enriched });
    }
  } catch (err) {
    console.error('[Error en getVideos]', err);
    return res.status(500).json({ success: false, message: 'Error al consultar videos.', error: err.message });
  }
}

/**
 * Obtener un video por su ID
 */
async function getVideoById(req, res) {
  try {
    const { id } = req.params;
    const videoId = parseInt(id, 10);

    if (isPostgresConnected) {
      const result = await pool.query(
        `SELECT v.*, c.name as category_name, c.slug as category_slug, u.full_name as creator_name, u.avatar_url as creator_avatar
         FROM videos v
         LEFT JOIN categories c ON v.category_id = c.id
         LEFT JOIN users u ON v.creator_id = u.id
         WHERE v.id = $1`,
        [videoId]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'Video no encontrado.' });
      }
      return res.json({ success: true, data: result.rows[0] });
    } else {
      const v = memoryStore.videos.find(x => x.id === videoId);
      if (!v) {
        return res.status(404).json({ success: false, message: 'Video no encontrado.' });
      }
      const cat = memoryStore.categories.find(c => c.id === v.category_id) || {};
      const creator = memoryStore.users.find(u => u.id === v.creator_id) || {};
      return res.json({
        success: true,
        data: {
          ...v,
          category_name: cat.name || 'General',
          category_slug: cat.slug || 'general',
          creator_name: creator.full_name || 'Creador TECFLIX',
          creator_avatar: creator.avatar_url || ''
        }
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error al consultar video.', error: err.message });
  }
}

/**
 * Subida de video por parte de un Creador (Google Cloud Storage / Local)
 */
async function uploadVideo(req, res) {
  try {
    const { title, description, category_id, tags, duration_seconds = 0, is_featured = false, rating = '16+' } = req.body;
    const creatorId = req.user.id;

    if (!title) {
      return res.status(400).json({ success: false, message: 'El título del video es obligatorio.' });
    }

    // Archivos subidos vía Multer
    const videoFile = req.files && req.files.video ? req.files.video[0] : null;
    const thumbnailFile = req.files && req.files.thumbnail ? req.files.thumbnail[0] : null;

    let finalVideoUrl = req.body.video_url;
    let finalThumbnailUrl = req.body.thumbnail_url || 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1280&h=720&fit=crop';
    let storageType = 'gcs';
    let gcsBucket = storageService.getBucketName();
    let gcsObjectKey = null;

    // Subir video a Google Cloud Storage si viene en el payload
    if (videoFile) {
      const uploadRes = await storageService.uploadFile(videoFile, 'videos');
      finalVideoUrl = uploadRes.url;
      storageType = uploadRes.storageType;
      gcsBucket = uploadRes.bucket;
      gcsObjectKey = uploadRes.objectKey;
    }

    // Subir miniatura si viene en el payload
    if (thumbnailFile) {
      const thumbRes = await storageService.uploadFile(thumbnailFile, 'thumbnails');
      finalThumbnailUrl = thumbRes.url;
    }

    if (!finalVideoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Debes adjuntar un archivo de video o proporcionar una URL válida de video.'
      });
    }

    // Formatear etiquetas
    let parsedTags = ['TECFLIX', 'Original'];
    if (tags) {
      if (Array.isArray(tags)) parsedTags = tags;
      else if (typeof tags === 'string') parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    const catId = category_id ? parseInt(category_id, 10) : 1;
    const duration = parseInt(duration_seconds, 10) || 600;

    let createdVideo = null;

    if (isPostgresConnected) {
      const insertRes = await pool.query(
        `INSERT INTO videos
          (creator_id, category_id, title, description, duration_seconds, thumbnail_url, video_url, storage_type, gcs_bucket, gcs_object_key, views_count, is_featured, is_published, tags, release_year, rating)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, $11, TRUE, $12, 2026, $13)
         RETURNING *`,
        [creatorId, catId, title.trim(), description || '', duration, finalThumbnailUrl, finalVideoUrl, storageType, gcsBucket, gcsObjectKey, is_featured === 'true' || is_featured === true, parsedTags, rating]
      );
      createdVideo = insertRes.rows[0];
    } else {
      createdVideo = {
        id: memoryStore.videos.length + 1,
        creator_id: creatorId,
        category_id: catId,
        title: title.trim(),
        description: description || '',
        duration_seconds: duration,
        thumbnail_url: finalThumbnailUrl,
        video_url: finalVideoUrl,
        storage_type: storageType,
        gcs_bucket: gcsBucket,
        gcs_object_key: gcsObjectKey,
        views_count: 0,
        is_featured: is_featured === 'true' || is_featured === true,
        is_published: true,
        tags: parsedTags,
        release_year: 2026,
        rating,
        created_at: new Date()
      };
      memoryStore.videos.unshift(createdVideo);
    }

    return res.status(201).json({
      success: true,
      message: `Video subido exitosamente a ${storageType === 'gcs' ? 'Google Cloud Storage' : 'Almacenamiento Local TECFLIX'}.`,
      data: createdVideo
    });
  } catch (err) {
    console.error('[Error en uploadVideo]', err);
    return res.status(500).json({ success: false, message: 'Error al subir el video.', error: err.message });
  }
}

/**
 * Verificador y ejecutor de visualización con reglas de cobro (Regla: 2 videos y 1 día)
 */
async function watchVideo(req, res) {
  try {
    const { id } = req.params;
    const videoId = parseInt(id, 10);
    const user = req.user;
    const { profile_id } = req.body;

    // Si es creador, no tiene restricción de suscriptor
    if (user.role === 'creator') {
      return res.json({
        success: true,
        allowed: true,
        role: 'creator',
        message: 'Acceso total de Creador habilitado.'
      });
    }

    // Para suscriptores: consultar estado de suscripción
    let sub = null;

    if (isPostgresConnected) {
      const subRes = await pool.query(
        `SELECT * FROM subscriptions WHERE user_id = $1`,
        [user.id]
      );
      if (subRes.rowCount > 0) sub = subRes.rows[0];
    } else {
      sub = memoryStore.subscriptions.find(s => s.user_id === user.id);
    }

    // Si no tiene registro de suscripción, crearlo en trial
    if (!sub) {
      sub = {
        user_id: user.id,
        plan_name: 'TECFLIX Purple Pass',
        status: 'trial',
        trial_ends_at: new Date(Date.now() + 24 * 3600000),
        billing_starts_at: new Date(Date.now() + 24 * 3600000),
        videos_watched_count: 0,
        max_free_videos: 2,
        monthly_price: 9.99
      };
      if (!isPostgresConnected) {
        memoryStore.subscriptions.push(sub);
      }
    }

    const now = new Date();
    const trialEndsAt = new Date(sub.trial_ends_at);
    const isTrialExpired = now > trialEndsAt;
    const hasWatchedMaxFree = sub.videos_watched_count >= (sub.max_free_videos || 2);

    // REGLA CLAVE DE COBRO:
    // Si la suscripción no está activa y ya vio 2 videos O expiró el día de prueba:
    if (sub.status !== 'active') {
      if (isTrialExpired) {
        return res.status(402).json({
          success: false,
          allowed: false,
          requires_billing: true,
          reason: 'trial_expired',
          message: 'Tu periodo de prueba inicial de 1 día ha concluido. Para continuar disfrutando del catálogo completo de TECFLIX activa tu suscripción mensual.',
          subscription: sub
        });
      }

      if (hasWatchedMaxFree) {
        return res.status(402).json({
          success: false,
          allowed: false,
          requires_billing: true,
          reason: 'max_free_videos_reached',
          message: `Has alcanzado el límite inicial de ${sub.max_free_videos || 2} videos de prueba. Activa tu suscripción para desbloquear reproducciones ilimitadas.`,
          subscription: sub
        });
      }

      // Si aún está dentro del periodo y del conteo, incrementar videos_watched_count
      const newCount = sub.videos_watched_count + 1;
      if (isPostgresConnected) {
        await pool.query(
          `UPDATE subscriptions SET videos_watched_count = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
          [newCount, user.id]
        );
      } else {
        sub.videos_watched_count = newCount;
      }

      // Registrar reproducción
      if (isPostgresConnected) {
        await pool.query(
          `INSERT INTO user_video_views (user_id, profile_id, video_id, watched_seconds, completed)
           VALUES ($1, $2, $3, 0, FALSE)`,
          [user.id, profile_id || null, videoId]
        );
        await pool.query(`UPDATE videos SET views_count = views_count + 1 WHERE id = $1`, [videoId]);
      } else {
        memoryStore.user_video_views.push({
          user_id: user.id,
          profile_id: profile_id || null,
          video_id: videoId,
          viewed_at: new Date()
        });
        const v = memoryStore.videos.find(x => x.id === videoId);
        if (v) v.views_count = (v.views_count || 0) + 1;
      }

      return res.json({
        success: true,
        allowed: true,
        status: 'trial',
        videos_watched_count: newCount,
        max_free_videos: sub.max_free_videos || 2,
        remaining_free_videos: Math.max(0, (sub.max_free_videos || 2) - newCount),
        message: `Video ${newCount} de ${sub.max_free_videos || 2} de tu prueba gratuita.`
      });
    }

    // Si la suscripción está 'active' -> Ilimitado
    if (isPostgresConnected) {
      await pool.query(
        `INSERT INTO user_video_views (user_id, profile_id, video_id, watched_seconds, completed)
         VALUES ($1, $2, $3, 0, FALSE)`,
        [user.id, profile_id || null, videoId]
      );
      await pool.query(`UPDATE videos SET views_count = views_count + 1 WHERE id = $1`, [videoId]);
    } else {
      const v = memoryStore.videos.find(x => x.id === videoId);
      if (v) v.views_count = (v.views_count || 0) + 1;
    }

    return res.json({
      success: true,
      allowed: true,
      status: 'active',
      message: 'Reproducción ilimitada con Membresía TECFLIX Activa.'
    });
  } catch (err) {
    console.error('[Error en watchVideo]', err);
    return res.status(500).json({ success: false, message: 'Error procesando solicitud de reproducción.', error: err.message });
  }
}

/**
 * Eliminar video publicado por el Creador
 */
async function deleteVideo(req, res) {
  try {
    const { id } = req.params;
    const videoId = parseInt(id, 10);
    const creatorId = req.user.id;

    if (isPostgresConnected) {
      const result = await pool.query(
        `DELETE FROM videos WHERE id = $1 AND creator_id = $2 RETURNING id`,
        [videoId, creatorId]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, message: 'Video no encontrado o no eres el propietario.' });
      }
    } else {
      const idx = memoryStore.videos.findIndex(v => v.id === videoId && v.creator_id === creatorId);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Video no encontrado o no eres el propietario.' });
      }
      memoryStore.videos.splice(idx, 1);
    }

    return res.json({ success: true, message: 'Video eliminado con éxito.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error al eliminar video.', error: err.message });
  }
}

module.exports = {
  getVideos,
  getVideoById,
  uploadVideo,
  watchVideo,
  deleteVideo
};
