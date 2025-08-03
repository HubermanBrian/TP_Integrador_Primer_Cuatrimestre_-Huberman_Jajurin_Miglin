require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

// Importar rutas
const eventsRouter = require('./routes/events');
const userRouter = require('./routes/user');
const authRouter = require('./routes/auth');
const eventLocationRouter = require('./routes/event-location');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de prueba para verificar que el backend funciona
app.get('/api/health', async (req, res) => {
  try {
    // Probar conexión a la base de datos
    const dbConnected = await db.testConnection();
    
    res.json({ 
      status: 'OK', 
      message: 'Backend funcionando correctamente',
      database: dbConnected ? 'Conectado' : 'Error de conexión',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Error en el servidor',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Rutas de la API
app.use('/api/events', eventsRouter);
app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/event-locations', eventLocationRouter);

// Ruta de prueba para eventos
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API de eventos funcionando',
    endpoints: {
      events: '/api/events',
      users: '/api/users',
      auth: '/api/auth',
      locations: '/api/event-locations'
    },
    database: {
      tables: [
        'users',
        'events', 
        'event_categories',
        'event_locations',
        'event_enrollments',
        'event_tags',
        'locations',
        'provinces',
        'tags'
      ]
    }
  });
});

const PORT = process.env.PORT || 3000;

// Inicializar el servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos antes de iniciar el servidor
    console.log('🔍 Probando conexión a la base de datos...');
    const dbConnected = await db.testConnection();
    
    if (!dbConnected) {
      console.log('⚠️  Advertencia: No se pudo conectar a la base de datos');
      console.log('💡 Asegúrate de:');
      console.log('   1. Tener PostgreSQL instalado y ejecutándose');
      console.log('   2. Crear la base de datos "eventos_db"');
      console.log('   3. Ejecutar el archivo database.sql');
      console.log('   4. Configurar las variables de entorno en .env');
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor backend ejecutándose en puerto ${PORT}`);
      console.log(`📡 API disponible en http://localhost:${PORT}/api`);
      console.log(`🔍 Prueba la API en: http://localhost:${PORT}/api/health`);
      console.log(`🗄️  Base de datos: ${dbConnected ? '✅ Conectado' : '❌ Error'}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();
