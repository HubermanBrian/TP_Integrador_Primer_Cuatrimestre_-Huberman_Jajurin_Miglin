# EventosApp - Sistema de Gestión de Eventos

Una aplicación completa para la gestión y exploración de eventos, con backend en Node.js/Express y frontend en React.

## 🚀 Características Principales

### Backend
- **API RESTful** con Express.js
- **Base de datos PostgreSQL** con stored procedures
- **Autenticación JWT** con bcrypt
- **Stored Procedures** para operaciones complejas
- **Validación de datos** y manejo de errores

### Frontend
- **React 18** con Vite
- **Tailwind CSS** para estilos
- **Framer Motion** para animaciones
- **React Router** para navegación
- **API Service** centralizado para comunicación con backend

## 📋 Requisitos Previos

- Node.js (v16 o superior)
- PostgreSQL (v12 o superior)
- npm o yarn

## 🛠️ Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd gf
```

### 2. Configurar la base de datos

#### Crear la base de datos PostgreSQL:
```sql
CREATE DATABASE eventos_db;
```

#### Ejecutar el script de base de datos:
```bash
psql -U postgres -d eventos_db -f database.sql
```

### 3. Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=eventos_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Server Configuration
PORT=3000
```

### 4. Instalar dependencias del backend
```bash
npm install
```

### 5. Instalar dependencias del frontend
```bash
cd frontend
npm install
cd ..
```

## 🚀 Ejecutar la aplicación

### Backend
```bash
npm start
```
El servidor se ejecutará en `http://localhost:3000`

### Frontend
```bash
cd frontend
npm run dev
```
La aplicación se ejecutará en `http://localhost:5173`

## 🧪 Probar la base de datos

Para verificar que todo funciona correctamente:

```bash
node test-database.js
```

Este script probará:
- Conexión a la base de datos
- Stored procedures de registro de usuarios
- Stored procedures de eventos
- Consultas básicas

## 📚 Stored Procedures Implementadas

### 1. `register_user(p_username, p_password, p_first_name, p_last_name)`
Registra un nuevo usuario en el sistema.

**Parámetros:**
- `p_username`: Nombre de usuario (email)
- `p_password`: Contraseña hasheada
- `p_first_name`: Nombre del usuario
- `p_last_name`: Apellido del usuario

**Retorna:**
- `id`: ID del usuario creado
- `username`: Nombre de usuario
- `first_name`: Nombre
- `last_name`: Apellido
- `success`: Boolean indicando éxito
- `message`: Mensaje descriptivo

### 2. `get_events_with_details(p_limit, p_offset, p_category_id, p_location_id, p_search_term)`
Obtiene eventos con información completa.

**Parámetros:**
- `p_limit`: Límite de resultados (default: 50)
- `p_offset`: Offset para paginación (default: 0)
- `p_category_id`: ID de categoría para filtrar (opcional)
- `p_location_id`: ID de ubicación para filtrar (opcional)
- `p_search_term`: Término de búsqueda (opcional)

**Retorna:**
Información completa del evento incluyendo:
- Datos básicos del evento
- Información de la categoría
- Información de la ubicación
- Información del creador
- Tags asociados

### 3. `get_event_by_id(p_event_id)`
Obtiene detalles completos de un evento específico.

**Parámetros:**
- `p_event_id`: ID del evento

**Retorna:**
Información detallada del evento incluyendo:
- Todos los datos del evento
- Información de ubicación con coordenadas
- Información del creador
- Tags asociados
- Número de inscripciones

## 🔌 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión

### Eventos
- `GET /api/events` - Listar eventos
- `GET /api/events/:id` - Obtener evento específico
- `POST /api/events` - Crear evento
- `PUT /api/events/:id` - Actualizar evento
- `POST /api/events/:id/enroll` - Inscribirse a evento
- `GET /api/events/:id/enrollments` - Listar inscripciones

### Ubicaciones
- `GET /api/event-locations` - Listar ubicaciones

### Usuarios
- `GET /api/users` - Listar usuarios
- `GET /api/users/:id` - Obtener usuario específico

## 🎨 Estructura del Frontend

```
frontend/
├── src/
│   ├── components/          # Componentes reutilizables
│   ├── pages/              # Páginas de la aplicación
│   ├── services/           # Servicios de API
│   ├── App.jsx             # Componente principal
│   └── main.jsx            # Punto de entrada
├── public/                 # Archivos estáticos
└── package.json
```

## 🔧 Estructura del Backend

```
├── routes/                 # Rutas de la API
│   ├── auth.js            # Autenticación
│   ├── events.js          # Eventos
│   ├── user.js            # Usuarios
│   └── event-location.js  # Ubicaciones
├── models/                # Modelos de datos
├── db.js                  # Configuración de base de datos
├── database.sql           # Script de base de datos
└── index.js               # Servidor principal
```

## 🎯 Funcionalidades Implementadas

### ✅ Completadas
- [x] Stored procedures para registro de usuarios
- [x] Stored procedures para consulta de eventos
- [x] API RESTful completa
- [x] Frontend con React y Tailwind CSS
- [x] Autenticación JWT
- [x] Página de exploración de eventos con datos reales
- [x] Página de registro de usuarios
- [x] Página de login
- [x] Manejo de errores y estados de carga
- [x] Validación de formularios

### 🔄 En Desarrollo
- [ ] Dashboard de usuario
- [ ] Creación de eventos
- [ ] Gestión de inscripciones
- [ ] Panel de administración

## 🐛 Solución de Problemas

### Error de conexión a la base de datos
1. Verificar que PostgreSQL esté ejecutándose
2. Verificar las credenciales en `.env`
3. Verificar que la base de datos `eventos_db` exista
4. Ejecutar `node test-database.js` para diagnosticar

### Error de CORS
Si tienes problemas de CORS, verificar que el frontend esté configurado para conectarse al puerto correcto del backend.

### Error de stored procedures
Si las stored procedures no funcionan, verificar que el archivo `database.sql` se haya ejecutado completamente.

## 📝 Notas de Desarrollo

- Las contraseñas se hashean con bcrypt antes de almacenarse
- Los tokens JWT expiran en 12 horas
- Las imágenes de eventos usan Unsplash como placeholder
- La paginación está implementada en el frontend y backend

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles. 