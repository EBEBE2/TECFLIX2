-- ====================================================================
-- TECFLIX - Semillas de Base de Datos (Contenido Original)
-- ====================================================================

-- 1. Insertar Usuarios
INSERT INTO users (id, email, password_hash, full_name, role, avatar_url, bio)
VALUES
(1, 'creador@tecflix.com', '$2a$10$Q7eY7lC2l36/G6pWpS8.QO9P4QeL9Nq0l9mP.f8J2C1v5D6F7G8H.', 'SimÃ³n Productor', 'creator', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop', 'Director cinematogrÃ¡fico y creador visual original en TECFLIX.'),
(2, 'suscriptor@tecflix.com', '$2a$10$Q7eY7lC2l36/G6pWpS8.QO9P4QeL9Nq0l9mP.f8J2C1v5D6F7G8H.', 'Ana MartÃ­nez', 'subscriber', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', 'Espectadora premium de TECFLIX.'),
(3, 'nuevo@tecflix.com', '$2a$10$Q7eY7lC2l36/G6pWpS8.QO9P4QeL9Nq0l9mP.f8J2C1v5D6F7G8H.', 'Carlos GÃ³mez (En Periodo de Prueba)', 'subscriber', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop', 'Explorando catÃ¡logo en periodo inicial.')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

-- 2. Skins de Perfil
INSERT INTO profile_skins (id, name, avatar_url, frame_style, glow_color, theme_accent, border_width, is_custom)
VALUES
(1, 'Violeta NeÃ³n Imperial', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop', 'neon_purple', '#a855f7', '#7c3aed', 3, FALSE),
(2, 'Matriz CuÃ¡ntica Cian', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop', 'cyber_pulse', '#06b6d4', '#0891b2', 4, FALSE),
(3, 'Corona Dorada VIP', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop', 'golden_vip', '#f59e0b', '#d97706', 4, FALSE),
(4, 'Llama CarmesÃ­ Estelar', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&h=200&fit=crop', 'crimson_flame', '#ef4444', '#b91c1c', 3, FALSE),
(5, 'Nebulosa HologrÃ¡fica', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop', 'holographic', '#c084fc', '#9333ea', 5, FALSE),
(6, 'Sombra Obsidiana', 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&h=200&fit=crop', 'obsidian_dark', '#94a3b8', '#475569', 2, FALSE)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 3. Perfiles de Usuario
INSERT INTO profiles (id, user_id, name, skin_id, is_kids, preferred_language)
VALUES
(1, 2, 'Ana Principal', 1, FALSE, 'es'),
(2, 2, 'Pekes Kids', 5, TRUE, 'es'),
(3, 3, 'Carlos Tech', 2, FALSE, 'es'),
(4, 1, 'SimÃ³n Estudio', 3, FALSE, 'es')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 4. MÃ©todos de Pago
INSERT INTO payment_methods (id, user_id, role_type, type, cardholder_name, card_brand, card_last4, exp_month, exp_year, is_default, billing_address)
VALUES
(1, 2, 'subscriber', 'credit', 'Ana MartÃ­nez R.', 'Visa', '4242', 12, 2028, TRUE, 'Av. Principal 1040, Ciudad de MÃ©xico'),
(2, 2, 'subscriber', 'debit', 'Ana MartÃ­nez R.', 'Mastercard', '8812', 08, 2027, FALSE, 'Av. Principal 1040, Ciudad de MÃ©xico'),
(3, 1, 'creator', 'debit', 'SimÃ³n Productor', 'Mastercard', '9934', 11, 2029, TRUE, 'Parque TecnolÃ³gico 402, Monterrey'),
(4, 1, 'creator', 'credit', 'SimÃ³n Productor', 'American Express', '1004', 05, 2028, FALSE, 'Parque TecnolÃ³gico 402, Monterrey'),
(5, 3, 'subscriber', 'credit', 'Carlos GÃ³mez P.', 'Visa', '5521', 03, 2029, TRUE, 'Avenida Central 222, CDMX')
ON CONFLICT (id) DO UPDATE SET cardholder_name = EXCLUDED.cardholder_name;

-- 5. Suscripciones (Reglas: 2 videos y 1 dÃ­a de prueba inicial)
INSERT INTO subscriptions (id, user_id, plan_name, status, trial_ends_at, billing_starts_at, videos_watched_count, max_free_videos, monthly_price, currency, payment_method_id, last_billed_at)
VALUES
(1, 2, 'TECFLIX Purple Pass', 'active', CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP - INTERVAL '4 days', 18, 2, 9.99, 'USD', 1, CURRENT_TIMESTAMP - INTERVAL '4 days')
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

INSERT INTO subscriptions (id, user_id, plan_name, status, trial_ends_at, billing_starts_at, videos_watched_count, max_free_videos, monthly_price, currency, payment_method_id)
VALUES
(2, 3, 'TECFLIX Trial Pass', 'trial', CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day', 1, 2, 9.99, 'USD', 5)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

-- 6. Transacciones de Cobro
INSERT INTO billing_transactions (id, user_id, subscription_id, payment_method_id, amount, currency, status, card_type, description, invoice_number)
VALUES
(1, 2, 1, 1, 9.99, 'USD', 'succeeded', 'credit', 'MembresÃ­a Mensual TECFLIX VIP', 'INV-TEC-2026-00891')
ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description;

-- 7. CategorÃ­as
INSERT INTO categories (id, name, slug, description)
VALUES
(1, 'Originales TECFLIX', 'originales-tecflix', 'Producciones audiovisuales exclusivas con estÃ©tica de neÃ³n morado.'),
(2, 'FicciÃ³n CuÃ¡ntica & Espacio', 'ficcion-cuantica', 'Aventuras en el cosmos y tecnologÃ­as del futuro.'),
(3, 'AnimaciÃ³n Digital 4K', 'animacion-digital', 'Creaciones visuales y modelado por computadora en alta definiciÃ³n.'),
(4, 'Comunidad de Creadores', 'comunidad-creadores', 'Videos subidos por creadores independientes a travÃ©s de Google Cloud Storage.'),
(5, 'Documentales de TecnologÃ­a', 'documentales-tec', 'AnÃ¡lisis sobre computaciÃ³n en la nube, inteligencia artificial y streaming.')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 8. Videos Originales TECFLIX
INSERT INTO videos (id, creator_id, category_id, title, description, duration_seconds, thumbnail_url, video_url, storage_type, gcs_bucket, gcs_object_key, views_count, is_featured, is_published, tags, release_year, rating)
VALUES
(
    1, 1, 1,
    'Protocolo Aurora: La Resistencia PÃºrpura',
    'En una metrÃ³poli iluminada por luces violetas, una piloto debe coordinar una red de satÃ©lites para restaurar la energÃ­a de su civilizaciÃ³n antes de la medianoche.',
    734,
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1280&h=720&fit=crop',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    'gcs',
    'tecflix-global-videos-prod',
    'originals/aurora-protocol-4k.mp4',
    1420,
    TRUE,
    TRUE,
    ARRAY['Ciencia FicciÃ³n', 'Futurismo', 'AcciÃ³n', 'NeÃ³n'],
    2026,
    '16+'
),
(
    2, 1, 3,
    'El GuardiÃ¡n del Valle Cristalino',
    'Un curioso habitante de un bosque encantado descubre una fuente de energÃ­a misteriosa que protege la naturaleza de tormentas cÃ³smicas.',
    596,
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1280&h=720&fit=crop',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    'gcs',
    'tecflix-global-videos-prod',
    'animation/crystal-guardian.mp4',
    3890,
    FALSE,
    TRUE,
    ARRAY['AnimaciÃ³n', 'Familiar', 'Aventura', 'CGI'],
    2026,
    'Todo PÃºblico'
),
(
    3, 1, 2,
    'Horizontes Infinitos: TravesÃ­a a Polaris',
    'Una cientÃ­fica solitaria viaja hacia los lÃ­mites del sistema estelar para recuperar datos cartogrÃ¡ficos de mundos inexplorados.',
    888,
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1280&h=720&fit=crop',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    'gcs',
    'tecflix-global-videos-prod',
    'fantasy/polaris-odyssey.mp4',
    2150,
    FALSE,
    TRUE,
    ARRAY['Espacio', 'Aventura', 'Drama', 'ExploraciÃ³n'],
    2026,
    '13+'
),
(
    4, 1, 2,
    'Ecos del Ciberespacio',
    'Investigadores descubren una dimensiÃ³n digital oculta que responde armÃ³nicamente a frecuencias sonoras y visuales.',
    720,
    'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1280&h=720&fit=crop',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    'gcs',
    'tecflix-global-videos-prod',
    'scifi/cyber-echoes.mp4',
    1875,
    FALSE,
    TRUE,
    ARRAY['Sci-Fi', 'Misterio', 'Digital', 'TecnologÃ­a'],
    2026,
    '16+'
),
(
    5, 1, 4,
    'SinfonÃ­a Violeta: Estudio Creativo',
    'Un recorrido cinematogrÃ¡fico por las composiciones sonoras y visuales de creadores independientes en el laboratorio TECFLIX.',
    420,
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1280&h=720&fit=crop',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    'gcs',
    'tecflix-global-videos-prod',
    'creators/violet-symphony.mp4',
    940,
    FALSE,
    TRUE,
    ARRAY['MÃºsica', 'NeÃ³n', 'Creadores', 'Arte'],
    2026,
    'Todo PÃºblico'
),
(
    6, 1, 5,
    'Arquitectura Cloud & Streaming Inteligente',
    'ExplicaciÃ³n tÃ©cnica y visual de cÃ³mo Google Cloud Storage y las bases de datos PostgreSQL potencian plataformas de streaming de alta demanda.',
    600,
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1280&h=720&fit=crop',
    'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    'gcs',
    'tecflix-global-videos-prod',
    'tech/cloud-architecture.mp4',
    1290,
    FALSE,
    TRUE,
    ARRAY['Google Cloud', 'PostgreSQL', 'Infraestructura', 'Streaming'],
    2026,
    'Todo PÃºblico'
)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;

-- Ajuste de secuencias
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('profile_skins_id_seq', (SELECT MAX(id) FROM profile_skins));
SELECT setval('profiles_id_seq', (SELECT MAX(id) FROM profiles));
SELECT setval('payment_methods_id_seq', (SELECT MAX(id) FROM payment_methods));
SELECT setval('subscriptions_id_seq', (SELECT MAX(id) FROM subscriptions));
SELECT setval('billing_transactions_id_seq', (SELECT MAX(id) FROM billing_transactions));
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
SELECT setval('videos_id_seq', (SELECT MAX(id) FROM videos));

