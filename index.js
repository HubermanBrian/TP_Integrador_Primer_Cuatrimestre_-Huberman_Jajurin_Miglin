require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

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
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend funcionando correctamente',
    timestamp: new Date().toISOString()
  });
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
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend ejecutándose en puerto ${PORT}`);
  console.log(`📡 API disponible en http://localhost:${PORT}/api`);
  console.log(`🔍 Prueba la API en: http://localhost:${PORT}/api/health`);
});
