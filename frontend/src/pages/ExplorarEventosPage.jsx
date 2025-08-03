import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, MapPin, Tag, Users } from 'lucide-react';

const TAGS = ['Música', 'Tecnología', 'Arte', 'Deportes', 'Cine', 'Educación'];

const USUARIO_ACTUAL = 'yo_usuario';

const eventosSimulados = [
  {
    id: 1,
    nombre: 'Concierto de Rock',
    descripcion: 'Vive la mejor experiencia de rock en vivo. Con bandas invitadas y un show de luces espectacular. No te lo pierdas.',
    fecha: '2024-07-15',
    duracion: '3 horas',
    precio: 150,
    inscripcionHabilitada: true,
    capacidad: 5000,
    creador: {
      username: 'organizador1',
      nombre: 'Carlos',
      apellido: 'García',
      email: 'carlos@eventos.com',
    },
    ubicacion: {
      nombre: 'Estadio Luna Park',
      direccion: 'Av. Madero 470',
      ciudad: 'Buenos Aires',
    },
    tags: ['Música'],
    imagen: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=220&fit=crop',
  },
  {
    id: 2,
    nombre: 'Feria de Tecnología',
    descripcion: 'Descubre las últimas tendencias en tecnología.',
    fecha: '2024-08-10',
    duracion: '5 horas',
    precio: 0,
    inscripcionHabilitada: true,
    capacidad: 2000,
    creador: {
      username: USUARIO_ACTUAL,
      nombre: 'Mi Nombre',
      apellido: 'Apellido',
      email: 'yo@email.com',
    },
    ubicacion: {
      nombre: 'Centro de Convenciones',
      direccion: 'Av. Figueroa Alcorta 2099',
      ciudad: 'Buenos Aires',
    },
    tags: ['Tecnología', 'Educación'],
    imagen: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=220&fit=crop',
  },
  {
    id: 3,
    nombre: 'Exposición de Arte',
    descripcion: 'Obras de artistas nacionales e internacionales.',
    fecha: '2024-09-01',
    duracion: '2 horas',
    precio: 80,
    inscripcionHabilitada: true,
    capacidad: 1000,
    creador: {
      username: 'organizador2',
      nombre: 'Ana',
      apellido: 'Martínez',
      email: 'ana@eventos.com',
    },
    ubicacion: {
      nombre: 'Museo Nacional',
      direccion: 'Av. Corrientes 1234',
      ciudad: 'Buenos Aires',
    },
    tags: ['Arte'],
    imagen: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=220&fit=crop',
  },
  {
    id: 4,
    nombre: 'Maratón Ciudad',
    descripcion: 'Participa en la maratón más grande de la ciudad.',
    fecha: '2024-10-05',
    duracion: '4 horas',
    precio: 50,
    inscripcionHabilitada: true,
    capacidad: 3000,
    creador: {
      username: USUARIO_ACTUAL,
      nombre: 'Tu Nombre',
      apellido: 'Tu Apellido',
      email: 'tu@email.com',
    },
    ubicacion: {
      nombre: 'Parque Central',
      direccion: 'Av. 9 de Julio 1000',
      ciudad: 'Buenos Aires',
    },
    tags: ['Deportes'],
    imagen: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=220&fit=crop',
  },
  {
    id: 5,
    nombre: 'Festival de Cine',
    descripcion: 'Proyecciones de películas internacionales.',
    fecha: '2024-11-20',
    duracion: '6 horas',
    precio: 120,
    inscripcionHabilitada: true,
    capacidad: 4000,
    creador: {
      username: 'organizador1',
      nombre: 'Carlos',
      apellido: 'García',
      email: 'carlos@eventos.com',
    },
    ubicacion: {
      nombre: 'Cinepolis',
      direccion: 'Av. Rivadavia 1000',
      ciudad: 'Buenos Aires',
    },
    tags: ['Cine'],
    imagen: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?w=400&h=220&fit=crop',
  },
  {
    id: 6,
    nombre: 'Charla de IA',
    descripcion: 'Aprende sobre inteligencia artificial.',
    fecha: '2024-12-01',
    duracion: '1 hora',
    precio: 0,
    inscripcionHabilitada: true,
    capacidad: 1500,
    creador: {
      username: 'organizador2',
      nombre: 'Ana',
      apellido: 'Martínez',
      email: 'ana@eventos.com',
    },
    ubicacion: {
      nombre: 'Auditorio ORT',
      direccion: 'Av. Corrientes 1234',
      ciudad: 'Buenos Aires',
    },
    tags: ['Tecnología', 'Educación'],
    imagen: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=400&h=220&fit=crop',
  },
];

const PAGE_SIZE = 3;

export default function ExplorarEventosPage() {
  const [filtros, setFiltros] = useState({ nombre: '', tag: '', fecha: '' });
  const [pagina, setPagina] = useState(1);
  const navigate = useNavigate();

  // Filtrado
  const eventosFiltrados = eventosSimulados.filter(ev => {
    const matchNombre = filtros.nombre === '' || ev.nombre.toLowerCase().includes(filtros.nombre.toLowerCase());
    const matchTag = filtros.tag === '' || ev.tags.includes(filtros.tag);
    const matchFecha = filtros.fecha === '' || ev.fecha === filtros.fecha;
    return matchNombre && matchTag && matchFecha;
  });

  // Paginación
  const totalPaginas = Math.ceil(eventosFiltrados.length / PAGE_SIZE);
  const eventosPagina = eventosFiltrados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE);

  const handleFiltroChange = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
    setPagina(1);
  };

  const handleCardClick = (id) => {
    navigate(`/evento/${id}`);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-primary mb-8 flex items-center gap-2">
        <Search className="w-7 h-7" /> Explorar eventos
      </h1>
      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full flex flex-col md:flex-row gap-4">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="text"
              name="nombre"
              value={filtros.nombre}
              onChange={handleFiltroChange}
              className="input-field pl-10"
              placeholder="Buscar por nombre..."
            />
          </div>
          <div className="relative w-full md:w-1/3">
            <Tag className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <select
              name="tag"
              value={filtros.tag}
              onChange={handleFiltroChange}
              className="input-field pl-10"
            >
              <option value="">Todos los tags</option>
              {TAGS.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
          <div className="relative w-full md:w-1/3">
            <Calendar className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="date"
              name="fecha"
              value={filtros.fecha}
              onChange={handleFiltroChange}
              className="input-field pl-10"
            />
          </div>
        </div>
      </div>
      {/* Resultados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {eventosPagina.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-12">No se encontraron eventos.</div>
        )}
        {eventosPagina.map(ev => (
          <div
            key={ev.id}
            className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-300 cursor-pointer"
            onClick={() => handleCardClick(ev.id)}
          >
            <div className="h-32 w-full overflow-hidden">
              <img src={ev.imagen} alt={ev.nombre} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-secondary mb-1 truncate">{ev.nombre}</h3>
                <div className="flex items-center text-gray-500 text-xs mb-2 gap-2">
                  <Calendar className="w-4 h-4" /> {ev.fecha}
                  <MapPin className="w-4 h-4 ml-4" /> {ev.ubicacion.nombre}
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {ev.tags.map(tag => (
                    <span key={tag} className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-semibold">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-gray-600 mb-2 text-xs line-clamp-2">{ev.descripcion}</p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-primary text-base">{ev.precio === 0 ? 'Gratis' : `$${ev.precio}`}</span>
                <button className="btn-primary flex items-center gap-1 text-sm px-4 py-2" onClick={e => { e.stopPropagation(); }}>
                  <Users className="w-4 h-4" /> Unirse
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex justify-center items-center gap-2">
          {Array.from({ length: totalPaginas }, (_, i) => (
            <button
              key={i}
              className={`btn-secondary px-3 py-1 ${pagina === i + 1 ? 'bg-primary text-white' : ''}`}
              onClick={() => setPagina(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 