import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, MapPin, Tag, Users } from 'lucide-react';
import apiService from '../services/api';

// Default tags from database
// Tags will be loaded from the database

const PAGE_SIZE = 3;

export default function ExplorarEventosPage() {
  const [filtros, setFiltros] = useState({ nombre: '', tag: '', fecha: '' });
  const [pagina, setPagina] = useState(1);
  const [eventos, setEventos] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Load events and tags from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Build search parameters
        const params = {
          limit: 50,
          offset: 0,
        };
        
        // Add search parameters based on filters
        if (filtros.nombre) {
          params.name = filtros.nombre;
        }
        if (filtros.fecha) {
          params.startdate = filtros.fecha;
        }
        if (filtros.tag) {
          params.tag = filtros.tag;
        }
        
        const eventsData = await apiService.getEvents(params);
        
        setEventos(eventsData);
        setTags([]); // Por ahora, no hay tags disponibles
        setError(null);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filtros.nombre, filtros.fecha, filtros.tag]);

  // Pagination (now handled by backend, but keeping client-side pagination for UI)
  const totalPaginas = Math.ceil(eventos.length / PAGE_SIZE);
  const eventosPagina = eventos.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE);

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
          {/* Filtro de tags temporalmente deshabilitado
          <div className="relative w-full md:w-1/3">
            <Tag className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <select
              name="tag"
              value={filtros.tag}
              onChange={handleFiltroChange}
              className="input-field pl-10"
            >
              <option value="">Todos los tags</option>
              {tags.map(tag => (
                <option key={tag.id} value={tag.name}>{tag.name}</option>
              ))}
            </select>
          </div>
          */}
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
        {loading && (
          <div className="col-span-full text-center text-gray-500 py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            Cargando eventos...
          </div>
        )}
        
        {error && (
          <div className="col-span-full text-center text-red-500 py-12">
            <div className="mb-4">❌ {error}</div>
            <button 
              onClick={() => window.location.reload()} 
              className="btn-primary"
            >
              Reintentar
            </button>
          </div>
        )}
        
        {!loading && !error && eventosPagina.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-12">No se encontraron eventos.</div>
        )}
        {eventosPagina.map(ev => (
          <div
            key={ev.id}
            className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-300 cursor-pointer"
            onClick={() => handleCardClick(ev.id)}
          >
            <div className="h-32 w-full overflow-hidden">
              <img 
                src={`https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=220&fit=crop&${ev.id}`} 
                alt={ev.name} 
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
              />
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-secondary mb-1 truncate">{ev.name}</h3>
                <div className="flex items-center text-gray-500 text-xs mb-2 gap-2">
                  <Calendar className="w-4 h-4" /> {ev.start_date?.split('T')[0]}
                  <MapPin className="w-4 h-4 ml-4" /> {ev.location_name}
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {ev.tags && ev.tags.map(tag => (
                    <span key={tag} className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-semibold">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-gray-600 mb-2 text-xs line-clamp-2">{ev.description}</p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-primary text-base">{ev.price === 0 ? 'Gratis' : `$${ev.price}`}</span>
                <button 
                  className={`btn-primary flex items-center gap-1 text-sm px-4 py-2 ${ev.enabled_for_enrollment === '1' ? '' : 'opacity-50 cursor-not-allowed'}`} 
                  onClick={e => { e.stopPropagation(); }}
                  disabled={ev.enabled_for_enrollment !== '1'}
                >
                  <Users className="w-4 h-4" /> 
                  {ev.enabled_for_enrollment === '1' ? 'Unirse' : 'Completo'}
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