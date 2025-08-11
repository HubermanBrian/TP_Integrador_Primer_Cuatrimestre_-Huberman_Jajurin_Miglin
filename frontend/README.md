# EvenTroca - Frontend

Una aplicación web moderna para descubrir y participar en eventos increíbles. Desarrollada con React, Vite y Tailwind CSS.

## 🚀 Características

- **Diseño Moderno**: Interfaz elegante y profesional con animaciones sutiles
- **Autenticación Completa**: Sistema de registro e inicio de sesión
- **Responsive**: Optimizada para todos los dispositivos
- **Animaciones**: Efectos de scroll y transiciones suaves
- **Validaciones**: Formularios con validación en tiempo real
- **Colores Personalizados**: Paleta de colores #0061E0, blanco y negro

## 🛠️ Tecnologías Utilizadas

- **React 18** - Biblioteca de interfaz de usuario
- **Vite** - Herramienta de construcción rápida
- **Tailwind CSS** - Framework de CSS utilitario
- **Framer Motion** - Biblioteca de animaciones
- **React Router** - Enrutamiento de la aplicación
- **Lucide React** - Iconos modernos
- **Axios** - Cliente HTTP para llamadas a la API

## 📦 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd frontend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Ejecutar en modo desarrollo**
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador**
   ```
   http://localhost:3000
   ```

## 🏗️ Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
├── pages/              # Páginas principales
│   ├── LandingPage.jsx # Página de inicio
│   ├── LoginPage.jsx   # Página de login
│   └── SignUpPage.jsx  # Página de registro
├── App.jsx             # Componente principal
├── main.jsx           # Punto de entrada
└── index.css          # Estilos globales
```

## 🎨 Páginas Implementadas

### 1. Landing Page (`/`)
- Hero section con llamada a la acción
- Sección de características
- Eventos próximos
- Footer completo
- Animaciones de scroll

### 2. Login Page (`/login`)
- Formulario de inicio de sesión
- Validación de campos
- Opción "Recordarme"
- Enlaces a redes sociales
- Sin animaciones de scroll (como solicitado)

### 3. Sign Up Page (`/signup`)
- Formulario de registro completo
- Validaciones en tiempo real
- Indicador de fortaleza de contraseña
- Términos y condiciones
- Enlaces a redes sociales

## 🎯 Funcionalidades Implementadas

### Autenticación
- ✅ Registro de usuarios
- ✅ Inicio de sesión
- ✅ Validaciones de formularios
- ✅ Indicador de fortaleza de contraseña
- ✅ Términos y condiciones

### Diseño
- ✅ Paleta de colores personalizada (#0061E0, blanco, negro)
- ✅ Diseño moderno y estético
- ✅ Animaciones de scroll (excepto en login)
- ✅ Responsive design
- ✅ Efectos hover y transiciones

### UX/UI
- ✅ Navegación intuitiva
- ✅ Feedback visual en formularios
- ✅ Estados de carga
- ✅ Mensajes de error
- ✅ Iconos descriptivos

## 🔧 Scripts Disponibles

```bash
npm run dev      # Ejecutar en modo desarrollo
npm run build    # Construir para producción
npm run preview  # Vista previa de la build
npm run lint     # Ejecutar linter
```

## 🌐 API Endpoints (Backend)

La aplicación está preparada para conectarse con los siguientes endpoints:

### Autenticación
- `POST /api/user/register` - Registro de usuarios
- `POST /api/user/login` - Inicio de sesión

### Eventos
- `GET /api/event/` - Listado de eventos
- `GET /api/event/{id}` - Detalle de evento
- `POST /api/event/` - Crear evento
- `PUT /api/event/` - Actualizar evento
- `DELETE /api/event/{id}` - Eliminar evento

### Inscripciones
- `POST /api/event/{id}/enrollment/` - Inscribirse a evento
- `DELETE /api/event/{id}/enrollment/` - Cancelar inscripción

## 🎨 Personalización

### Colores
Los colores principales están definidos en `tailwind.config.js`:
- **Primary**: #0061E0 (Azul principal)
- **Secondary**: #000000 (Negro)
- **White**: #FFFFFF (Blanco)

### Animaciones
Las animaciones de scroll están configuradas en `src/index.css` y se activan automáticamente al hacer scroll.

## 📱 Responsive Design

La aplicación está optimizada para:
- 📱 Móviles (320px+)
- 📱 Tablets (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Pantallas grandes (1280px+)

## 🚀 Próximos Pasos

1. **Integración con Backend**: Conectar con la API real
2. **Gestión de Estado**: Implementar Redux o Context API
3. **Dashboard de Usuario**: Panel de control personalizado
4. **Búsqueda de Eventos**: Filtros y búsqueda avanzada
5. **Notificaciones**: Sistema de alertas en tiempo real

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.

## 👥 Contribución

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request para sugerencias y mejoras.

---

**Desarrollado con ❤️ para el TP Integrador de Eventos**