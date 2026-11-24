const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const { pool, isPostgresConnected } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const videoRoutes = require('./routes/videoRoutes');
const profileRoutes = require('./routes/profileRoutes');
const billingRoutes = require('./routes/billingRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globales
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos subidos localmente (con soporte de streaming HTTP Range)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/categories', categoryRoutes);

// Endpoint de comprobación de salud del sistema
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'TECFLIX Streaming API',
    database: isPostgresConnected ? 'PostgreSQL (Activo)' : 'Modo Sincronizado en Memoria',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error('[TECFLIX Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor en TECFLIX API',
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
});

app.listen(PORT, () => {
  console.log('========================================================');
  console.log(`🎬 TECFLIX API Server iniciado en http://localhost:${PORT}`);
  console.log(`📡 Endpoints disponibles en http://localhost:${PORT}/api`);
  console.log('========================================================');
});

module.exports = app;
