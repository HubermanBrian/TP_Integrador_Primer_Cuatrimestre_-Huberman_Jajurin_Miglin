require('dotenv').config();
const { Pool } = require('pg');

// Configuración de la base de datos PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'eventos_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'tu_password',
  // Configuraciones adicionales para mejor rendimiento
  max: 20, // máximo número de conexiones en el pool
  idleTimeoutMillis: 30000, // tiempo máximo que una conexión puede estar inactiva
  connectionTimeoutMillis: 2000, // tiempo máximo para establecer una conexión
});

// Función para probar la conexión
pool.on('connect', () => {
  console.log('✅ Conectado a la base de datos PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error en la conexión de la base de datos:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool: pool,
  // Función para probar la conexión
  testConnection: async () => {
    try {
      const result = await pool.query('SELECT NOW()');
      console.log('✅ Conexión a la base de datos exitosa:', result.rows[0]);
      return true;
    } catch (error) {
      console.error('❌ Error al conectar con la base de datos:', error.message);
      return false;
    }
  }
};
