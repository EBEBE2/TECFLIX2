-- ====================================================================
-- TECFLIX - Video Streaming Platform Database Schema
-- PostgreSQL 14+ / 16+ / 18+
-- ====================================================================

-- Habilitar extensión para UUIDs si es necesario
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: USERS (Usuarios y Creadores con credenciales separadas)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('creator', 'subscriber', 'admin')),
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA: PROFILE_SKINS (Skins, marcos de neón y estilos visuales)
CREATE TABLE IF NOT EXISTS profile_skins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT NOT NULL,
    frame_style VARCHAR(50) NOT NULL DEFAULT 'neon_purple', -- neon_purple, cyber_pulse, golden_vip, crimson_flame, holographic, obsidian_dark
    glow_color VARCHAR(30) NOT NULL DEFAULT '#a855f7',
    theme_accent VARCHAR(30) NOT NULL DEFAULT '#7c3aed',
    border_width INT DEFAULT 3,
    is_custom BOOLEAN DEFAULT FALSE,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLA: PROFILES (Perfiles de visualización por cuenta)
CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    skin_id INT REFERENCES profile_skins(id) ON DELETE SET NULL,
    is_kids BOOLEAN DEFAULT FALSE,
    preferred_language VARCHAR(30) DEFAULT 'es',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABLA: PAYMENT_METHODS (Tarjetas de Crédito y Débito para Creadores y Suscriptores)
CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_type VARCHAR(50) NOT NULL CHECK (role_type IN ('creator', 'subscriber')),
    type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit')),
    cardholder_name VARCHAR(150) NOT NULL,
    card_brand VARCHAR(50) DEFAULT 'Visa', -- Visa, Mastercard, AMEX
    card_last4 VARCHAR(4) NOT NULL,
    exp_month INT NOT NULL CHECK (exp_month BETWEEN 1 AND 12),
    exp_year INT NOT NULL CHECK (exp_year >= 2026),
    provider_token VARCHAR(255),
    is_default BOOLEAN DEFAULT TRUE,
    billing_address VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABLA: SUBSCRIPTIONS (Reglas de cobro para suscriptores: 2 videos y 1 día de prueba)
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_name VARCHAR(50) DEFAULT 'TECFLIX Purple Pass',
    status VARCHAR(50) NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'cancelled')),
    trial_ends_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 day'),
    billing_starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 day'),
    videos_watched_count INT NOT NULL DEFAULT 0,
    max_free_videos INT NOT NULL DEFAULT 2,
    monthly_price NUMERIC(10,2) NOT NULL DEFAULT 9.99,
    currency VARCHAR(30) DEFAULT 'USD',
    payment_method_id INT REFERENCES payment_methods(id) ON DELETE SET NULL,
    last_billed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABLA: BILLING_TRANSACTIONS (Historial de transacciones de cobro)
CREATE TABLE IF NOT EXISTS billing_transactions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscription_id INT REFERENCES subscriptions(id) ON DELETE SET NULL,
    payment_method_id INT REFERENCES payment_methods(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(30) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'succeeded' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
    card_type VARCHAR(20) CHECK (card_type IN ('credit', 'debit')),
    description VARCHAR(255) NOT NULL,
    invoice_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. TABLA: CATEGORIES (Categorías de streaming)
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- 8. TABLA: VIDEOS (Videos subidos a Google Cloud Storage o local)
CREATE TABLE IF NOT EXISTS videos (
    id SERIAL PRIMARY KEY,
    creator_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_seconds INT NOT NULL DEFAULT 0,
    thumbnail_url TEXT NOT NULL,
    video_url TEXT NOT NULL,
    storage_type VARCHAR(20) NOT NULL DEFAULT 'gcs' CHECK (storage_type IN ('gcs', 'local', 'external')),
    gcs_bucket VARCHAR(255),
    gcs_object_key VARCHAR(500),
    views_count INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    tags TEXT[],
    release_year INT DEFAULT 2026,
    rating VARCHAR(30) DEFAULT '16+',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. TABLA: USER_VIDEO_VIEWS (Historial de reproducciones y contador para paywall)
CREATE TABLE IF NOT EXISTS user_video_views (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_id INT REFERENCES profiles(id) ON DELETE SET NULL,
    video_id INT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    watched_seconds INT DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. TABLA: USER_WATCHLIST (Mi lista / favoritos)
CREATE TABLE IF NOT EXISTS user_watchlist (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_id INT REFERENCES profiles(id) ON DELETE SET NULL,
    video_id INT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (profile_id, video_id)
);

-- 11. TABLA: CREATOR_PAYOUTS (Liquidaciones y cobros para creadores)
CREATE TABLE IF NOT EXISTS creator_payouts (
    id SERIAL PRIMARY KEY,
    creator_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_method_id INT REFERENCES payment_methods(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(30) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'paid' CHECK (status IN ('pending', 'processing', 'paid')),
    views_settled INT DEFAULT 0,
    period_start DATE,
    period_end DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar rendimiento de búsquedas y reproducciones
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category_id);
CREATE INDEX IF NOT EXISTS idx_videos_creator ON videos(creator_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_views_user ON user_video_views(user_id);
