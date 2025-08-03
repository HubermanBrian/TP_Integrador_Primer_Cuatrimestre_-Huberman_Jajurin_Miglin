// Configuración de ejemplo para la base de datos
// Copia este archivo como config.js y ajusta los valores según tu configuración

module.exports = {
  // Configuración del servidor
  port: process.env.PORT || 3000,
  
  // Configuración de la base de datos PostgreSQL
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'eventos_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'tu_password',
  },
  
  // Configuración JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'tu_jwt_secret_super_seguro',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  // Configuración de CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  }
}; 