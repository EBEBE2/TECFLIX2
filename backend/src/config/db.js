const { Pool } = require('pg');
require('dotenv').config();

// ConfiguraciÃ³n de conexiÃ³n a PostgreSQL
const poolConfig = {
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'tecflix_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 4000,
};

const pool = new Pool(poolConfig);

let isPostgresConnected = false;

// Probar conexiÃ³n y registrar estado
pool.connect()
  .then((client) => {
    isPostgresConnected = true;
    console.log(`[PostgreSQL] Conectado exitosamente a la base de datos: ${poolConfig.database}`);
    client.release();
  })
  .catch((err) => {
    isPostgresConnected = false;
    console.warn(`[PostgreSQL Aviso] No se pudo conectar a PostgreSQL (${err.message}).`);
    console.warn(`[PostgreSQL Aviso] TECFLIX utilizarÃ¡ el almacÃ©n de datos sincronizado en memoria para permitir pruebas inmediatas.`);
  });

// AlmacÃ©n en memoria de respaldo si PostgreSQL aÃºn no estÃ¡ inicializado
const memoryStore = {
  users: [
    {
      id: 1,
      email: 'creador@tecflix.com',
      password_hash: '$2a$10$Q7eY7lC2l36/G6pWpS8.QO9P4QeL9Nq0l9mP.f8J2C1v5D6F7G8H.', // TecflixCreator2026!
      full_name: 'SimÃ³n Productor',
      role: 'creator',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
      bio: 'Director y creador de contenidos 4K Ultra HD en TECFLIX.',
      created_at: new Date()
    },
    {
      id: 2,
      email: 'suscriptor@tecflix.com',
      password_hash: '$2a$10$Q7eY7lC2l36/G6pWpS8.QO9P4QeL9Nq0l9mP.f8J2C1v5D6F7G8H.', // TecflixUser2026!
      full_name: 'Ana MartÃ­nez',
      role: 'subscriber',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
      bio: 'FanÃ¡tica del cine y series de ciencia ficciÃ³n en TECFLIX.',
      created_at: new Date()
    },
    {
      id: 3,
      email: 'nuevo@tecflix.com',
      password_hash: '$2a$10$Q7eY7lC2l36/G6pWpS8.QO9P4QeL9Nq0l9mP.f8J2C1v5D6F7G8H.', // TecflixUser2026!
      full_name: 'Carlos GÃ³mez (En Periodo de Prueba)',
      role: 'subscriber',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
      bio: 'Explorando catÃ¡logo TECFLIX en periodo inicial.',
      created_at: new Date()
    }
  ],
  profile_skins: [
    {
      id: 1,
      name: 'Violeta NeÃ³n Imperial',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
      frame_style: 'neon_purple',
      glow_color: '#a855f7',
      theme_accent: '#7c3aed',
      border_width: 3,
      is_custom: false
    },
    {
      id: 2,
      name: 'Matriz CuÃ¡ntica Cian',
      avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&h=200&fit=crop',
      frame_style: 'cyber_pulse',
      glow_color: '#06b6d4',
      theme_accent: '#0891b2',
      border_width: 4,
      is_custom: false
    },
    {
      id: 3,
      name: 'Corona Dorada VIP',
      avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop',
      frame_style: 'golden_vip',
      glow_color: '#f59e0b',
      theme_accent: '#d97706',
      border_width: 4,
      is_custom: false
    },
    {
      id: 4,
      name: 'Llama CarmesÃ­ Estelar',
      avatar_url: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&h=200&fit=crop',
      frame_style: 'crimson_flame',
      glow_color: '#ef4444',
      theme_accent: '#b91c1c',
      border_width: 3,
      is_custom: false
    },
    {
      id: 5,
      name: 'Nebulosa HologrÃ¡fica',
      avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop',
      frame_style: 'holographic',
      glow_color: '#c084fc',
      theme_accent: '#9333ea',
      border_width: 5,
      is_custom: false
    },
    {
      id: 6,
      name: 'Sombra Obsidiana',
      avatar_url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&h=200&fit=crop',
      frame_style: 'obsidian_dark',
      glow_color: '#94a3b8',
      theme_accent: '#475569',
      border_width: 2,
      is_custom: false
    }
  ],
  profiles: [
    { id: 1, user_id: 2, name: 'Ana Principal', skin_id: 1, is_kids: false },
    { id: 2, user_id: 2, name: 'Pekes Kids', skin_id: 5, is_kids: true },
    { id: 3, user_id: 3, name: 'Carlos Tech', skin_id: 2, is_kids: false },
    { id: 4, user_id: 1, name: 'SimÃ³n Estudio', skin_id: 3, is_kids: false }
  ],
  payment_methods: [
    {
      id: 1,
      user_id: 2,
      role_type: 'subscriber',
      type: 'credit',
      cardholder_name: 'Ana MartÃ­nez R.',
      card_brand: 'Visa',
      card_last4: '4242',
      exp_month: 12,
      exp_year: 2028,
      is_default: true,
      billing_address: 'Av. Principal 1040, Ciudad de MÃ©xico'
    },
    {
      id: 2,
      user_id: 2,
      role_type: 'subscriber',
      type: 'debit',
      cardholder_name: 'Ana MartÃ­nez R.',
      card_brand: 'Mastercard',
      card_last4: '8812',
      exp_month: 8,
      exp_year: 2027,
      is_default: false,
      billing_address: 'Av. Principal 1040, Ciudad de MÃ©xico'
    },
    {
      id: 3,
      user_id: 1,
      role_type: 'creator',
      type: 'debit',
      cardholder_name: 'SimÃ³n Productor',
      card_brand: 'Mastercard',
      card_last4: '9934',
      exp_month: 11,
      exp_year: 2029,
      is_default: true,
      billing_address: 'Parque TecnolÃ³gico 402, Monterrey'
    },
    {
      id: 4,
      user_id: 1,
      role_type: 'creator',
      type: 'credit',
      cardholder_name: 'SimÃ³n Productor',
      card_brand: 'American Express',
      card_last4: '1004',
      exp_month: 5,
      exp_year: 2028,
      is_default: false,
      billing_address: 'Parque TecnolÃ³gico 402, Monterrey'
    },
    {
      id: 5,
      user_id: 3,
      role_type: 'subscriber',
      type: 'credit',
      cardholder_name: 'Carlos GÃ³mez P.',
      card_brand: 'Visa',
      card_last4: '5521',
      exp_month: 3,
      exp_year: 2029,
      is_default: true,
      billing_address: 'Avenida Central 222, CDMX'
    }
  ],
  subscriptions: [
    {
      id: 1,
      user_id: 2,
      plan_name: 'TECFLIX Purple Pass',
      status: 'active',
      trial_ends_at: new Date(Date.now() - 5 * 86400000),
      billing_starts_at: new Date(Date.now() - 4 * 86400000),
      videos_watched_count: 18,
      max_free_videos: 2,
      monthly_price: 9.99,
      currency: 'USD',
      payment_method_id: 1,
      last_billed_at: new Date(Date.now() - 4 * 86400000)
    },
    {
      id: 2,
      user_id: 3,
      plan_name: 'TECFLIX Trial Pass',
      status: 'trial',
      trial_ends_at: new Date(Date.now() + 24 * 3600000), // 1 dÃ­a a partir de ahora
      billing_starts_at: new Date(Date.now() + 24 * 3600000),
      videos_watched_count: 1, // Ha visto 1 de 2 permitidos
      max_free_videos: 2,
      monthly_price: 9.99,
      currency: 'USD',
      payment_method_id: 5
    }
  ],
  categories: [
    { id: 1, name: 'Originales TECFLIX', slug: 'originales-tecflix', description: 'Producciones audiovisuales exclusivas' },
    { id: 2, name: 'FicciÃ³n CuÃ¡ntica & Espacio', slug: 'ficcion-cuantica', description: 'Aventuras en el cosmos' },
    { id: 3, name: 'AnimaciÃ³n Digital 4K', slug: 'animacion-digital', description: 'Creaciones visuales por computadora' },
    { id: 4, name: 'Comunidad de Creadores', slug: 'comunidad-creadores', description: 'Videos subidos por creadores independientes' },
    { id: 5, name: 'Documentales de TecnologÃ­a', slug: 'documentales-tec', description: 'Cloud, IA y streaming' }
  ],
  videos: [
    {
      id: 1,
      creator_id: 1,
      category_id: 1,
      title: 'Protocolo Aurora: La Resistencia PÃºrpura',
      description: 'En una metrÃ³poli iluminada por luces violetas, una piloto debe coordinar una red de satÃ©lites para restaurar la energÃ­a de su civilizaciÃ³n.',
      duration_seconds: 734,
      thumbnail_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1280&h=720&fit=crop',
      video_url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      storage_type: 'gcs',
      gcs_bucket: 'tecflix-global-videos-prod',
      gcs_object_key: 'originals/aurora-protocol-4k.mp4',
      views_count: 1420,
      is_featured: true,
      is_published: true,
      tags: ['Ciencia FicciÃ³n', 'Futurismo', 'AcciÃ³n', 'NeÃ³n'],
      release_year: 2026,
      rating: '16+'
    },
    {
      id: 2,
      creator_id: 1,
      category_id: 3,
      title: 'El GuardiÃ¡n del Valle Cristalino',
      description: 'Un habitante de un bosque encantado descubre una fuente de energÃ­a que protege la naturaleza de tormentas cÃ³smicas.',
      duration_seconds: 596,
      thumbnail_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1280&h=720&fit=crop',
      video_url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      storage_type: 'gcs',
      gcs_bucket: 'tecflix-global-videos-prod',
      gcs_object_key: 'animation/crystal-guardian.mp4',
      views_count: 3890,
      is_featured: false,
      is_published: true,
      tags: ['AnimaciÃ³n', 'Familiar', 'Aventura', 'CGI'],
      release_year: 2026,
      rating: 'Todo PÃºblico'
    },
    {
      id: 3,
      creator_id: 1,
      category_id: 2,
      title: 'Horizontes Infinitos: TravesÃ­a a Polaris',
      description: 'Una cientÃ­fica viaja hacia los lÃ­mites del sistema estelar para recuperar datos cartogrÃ¡ficos de mundos inexplorados.',
      duration_seconds: 888,
      thumbnail_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1280&h=720&fit=crop',
      video_url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      storage_type: 'gcs',
      gcs_bucket: 'tecflix-global-videos-prod',
      gcs_object_key: 'fantasy/polaris-odyssey.mp4',
      views_count: 2150,
      is_featured: false,
      is_published: true,
      tags: ['Espacio', 'Aventura', 'Drama', 'ExploraciÃ³n'],
      release_year: 2026,
      rating: '13+'
    },
    {
      id: 4,
      creator_id: 1,
      category_id: 2,
      title: 'Ecos del Ciberespacio',
      description: 'Investigadores descubren una dimensiÃ³n digital oculta que responde armÃ³nicamente a frecuencias sonoras y visuales.',
      duration_seconds: 720,
      thumbnail_url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1280&h=720&fit=crop',
      video_url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      storage_type: 'gcs',
      gcs_bucket: 'tecflix-global-videos-prod',
      gcs_object_key: 'scifi/cyber-echoes.mp4',
      views_count: 1875,
      is_featured: false,
      is_published: true,
      tags: ['Sci-Fi', 'Misterio', 'Digital', 'TecnologÃ­a'],
      release_year: 2026,
      rating: '16+'
    },
    {
      id: 5,
      creator_id: 1,
      category_id: 4,
      title: 'SinfonÃ­a Violeta: Estudio Creativo',
      description: 'Un recorrido cinematogrÃ¡fico por las composiciones sonoras y visuales de creadores independientes en el laboratorio TECFLIX.',
      duration_seconds: 420,
      thumbnail_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1280&h=720&fit=crop',
      video_url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      storage_type: 'gcs',
      gcs_bucket: 'tecflix-global-videos-prod',
      gcs_object_key: 'creators/violet-symphony.mp4',
      views_count: 940,
      is_featured: false,
      is_published: true,
      tags: ['MÃºsica', 'NeÃ³n', 'Creadores', 'Arte'],
      release_year: 2026,
      rating: 'Todo PÃºblico'
    },
    {
      id: 6,
      creator_id: 1,
      category_id: 5,
      title: 'Arquitectura Cloud & Streaming Inteligente',
      description: 'ExplicaciÃ³n tÃ©cnica y visual de cÃ³mo Google Cloud Storage y las bases de datos PostgreSQL potencian plataformas de streaming.',
      duration_seconds: 600,
      thumbnail_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1280&h=720&fit=crop',
      video_url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      storage_type: 'gcs',
      gcs_bucket: 'tecflix-global-videos-prod',
      gcs_object_key: 'tech/cloud-architecture.mp4',
      views_count: 1290,
      is_featured: false,
      is_published: true,
      tags: ['Google Cloud', 'PostgreSQL', 'Infraestructura', 'Streaming'],
      release_year: 2026,
      rating: 'Todo PÃºblico'
    }
  ],
  billing_transactions: [
    {
      id: 1,
      user_id: 2,
      subscription_id: 1,
      payment_method_id: 1,
      amount: 9.99,
      currency: 'USD',
      status: 'succeeded',
      card_type: 'credit',
      description: 'MembresÃ­a Mensual TECFLIX VIP',
      invoice_number: 'INV-TEC-2026-00891',
      created_at: new Date(Date.now() - 4 * 86400000)
    }
  ],
  user_video_views: [],
  user_watchlist: []
};

// FunciÃ³n auxiliar para consultas seguras
const query = async (text, params = []) => {
  if (isPostgresConnected) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.error('[PostgreSQL Error]', err.message);
      throw err;
    }
  } else {
    return { rows: [], rowCount: 0 };
  }
};

module.exports = {
  pool,
  query,
  get isPostgresConnected() {
    return isPostgresConnected;
  },
  memoryStore
};

