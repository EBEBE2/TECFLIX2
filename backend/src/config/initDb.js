const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const dbHost = process.env.PGHOST || 'localhost';
const dbPort = parseInt(process.env.PGPORT || '5432', 10);
const dbUser = process.env.PGUSER || 'postgres';
const dbPassword = process.env.PGPASSWORD || 'postgres';
const dbName = process.env.PGDATABASE || 'tecflix_db';

async function initDatabase() {
  console.log(`[TECFLIX DB Init] Iniciando configuración de base de datos en ${dbHost}:${dbPort}...`);

  // Paso 1: Conectar a la base de datos por defecto 'postgres' para verificar/crear 'tecflix_db'
  const rootClient = new Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: 'postgres'
  });

  try {
    await rootClient.connect();
    console.log('[TECFLIX DB Init] Conectado al servidor PostgreSQL.');

    const checkDbRes = await rootClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkDbRes.rowCount === 0) {
      console.log(`[TECFLIX DB Init] Creando base de datos '${dbName}'...`);
      await rootClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`[TECFLIX DB Init] Base de datos '${dbName}' creada exitosamente.`);
    } else {
      console.log(`[TECFLIX DB Init] La base de datos '${dbName}' ya existe.`);
    }
  } catch (err) {
    console.warn(`[TECFLIX DB Init Advertencia] Error comprobando base de datos con usuario '${dbUser}': ${err.message}`);
    console.log(`[TECFLIX DB Init] Si la base de datos '${dbName}' ya está creada manualmente, continuaremos conectando directamente.`);
  } finally {
    try {
      await rootClient.end();
    } catch (_) {}
  }

  // Paso 2: Conectar a 'tecflix_db' y ejecutar schema.sql y seed.sql
  const targetClient = new Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName
  });

  try {
    await targetClient.connect();
    console.log(`[TECFLIX DB Init] Conectado a '${dbName}'. Ejecutando esquema y semillas...`);

    const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
    const seedPath = path.resolve(__dirname, '../../../database/seed.sql');

    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await targetClient.query(schemaSql);
      console.log('[TECFLIX DB Init] Esquema SQL (schema.sql) aplicado correctamente.');
    } else {
      console.error(`[TECFLIX DB Init] Archivo schema.sql no encontrado en: ${schemaPath}`);
    }

    if (fs.existsSync(seedPath)) {
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      await targetClient.query(seedSql);
      console.log('[TECFLIX DB Init] Semillas iniciales (seed.sql) aplicadas correctamente.');
    } else {
      console.error(`[TECFLIX DB Init] Archivo seed.sql no encontrado en: ${seedPath}`);
    }

    // Comprobar conteos
    const usersCount = await targetClient.query('SELECT count(*) FROM users');
    const videosCount = await targetClient.query('SELECT count(*) FROM videos');
    const skinsCount = await targetClient.query('SELECT count(*) FROM profile_skins');

    console.log('---------------------------------------------------------');
    console.log('Base de datos TECFLIX inicializada con éxito:');
    console.log(`- Usuarios: ${usersCount.rows[0].count}`);
    console.log(`- Videos:   ${videosCount.rows[0].count}`);
    console.log(`- Skins:    ${skinsCount.rows[0].count}`);
    console.log('---------------------------------------------------------');
  } catch (err) {
    console.error(`[TECFLIX DB Init Error] Error aplicando esquema a '${dbName}': ${err.message}`);
    console.log('Verifica la contraseña en el archivo .env (PGPASSWORD).');
  } finally {
    try {
      await targetClient.end();
    } catch (_) {}
  }
}

if (require.main === module) {
  initDatabase().catch(console.error);
}

module.exports = initDatabase;
