import { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, Users, Globe, Calendar, MapPin, LogOut, UserCheck, UserPlus, XCircle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EventoModal from '../components/EventoModal';
import apiService from '../services/api';

export default function DashboardPage() {
  const [eventosCreados, setEventosCreados] = useState([]);
  const [eventosUnidos, setEventosUnidos] = useState([]);
  const [eventosMundiales, setEventosMundiales] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editEvento, setEditEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();
  const [advertencia, setAdvertencia] = useState({ show: false, id: null, nombre: '' });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');
        

        const userProfile = await apiService.getProfile();
        setUser(userProfile);
        

        const createdEvents = await apiService.getUserCreatedEvents();
        setEventosCreados(createdEvents);

        const joinedEvents = await apiService.getUserJoinedEvents();
        setEventosUnidos(joinedEvents);

        const globalEvents = await apiService.getEvents();
        setEventosMundiales(globalEvents);
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Error al cargar los datos del dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    try {
      setSearching(true);
      const term = searchTerm.trim();
      const isDate = /^\d{4}-\d{2}-\d{2}$/.test(term);
      const params = isDate ? { startdate: term } : { search: term };
      const results = await apiService.getEvents(params);
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching events:', err);
      setError(err.message || 'Error al buscar eventos');
    } finally {
      setSearching(false);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleEliminar = (id) => {
    const evento = eventosCreados.find(ev => ev.id === id);
    setAdvertencia({ show: true, id, nombre: evento.name });
  };

  const confirmarEliminar = async () => {
    try {
      await apiService.deleteEvent(advertencia.id);
      setEventosCreados(eventosCreados.filter(ev => ev.id !== advertencia.id));
      setAdvertencia({ show: false, id: null, nombre: '' });
    } catch (err) {
      console.error('Error deleting event:', err);
      setError(err.message || 'Error al eliminar el evento');
    }
  };

  const cancelarEliminar = () => {
    setAdvertencia({ show: false, id: null, nombre: '' });
  };

  const handleEditar = (id) => {
    const evento = eventosCreados.find(ev => ev.id === id);
    setEditEvento(evento);
    setModalOpen(true);
  };

  const handleUnirse = async (id) => {
    try {
      await apiService.joinEvent(id);
      const evento = eventosMundiales.find(ev => ev.id === id);
      setEventosUnidos([...eventosUnidos, evento]);
      setEventosMundiales(eventosMundiales.filter(ev => ev.id !== id));
    } catch (err) {
      console.error('Error joining event:', err);
      setError(err.message || 'Error al unirse al evento');
    }
  };

  const handleCancelarUnion = async (id) => {
    try {
      await apiService.leaveEvent(id);
      const evento = eventosUnidos.find(ev => ev.id === id);
      setEventosUnidos(eventosUnidos.filter(ev => ev.id !== id));
      setEventosMundiales([...eventosMundiales, evento]);
    } catch (err) {
      console.error('Error leaving event:', err);
      setError(err.message || 'Error al cancelar inscripción');
    }
  };

  const handleNuevoEvento = () => {
    setEditEvento(null);
    setModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleDetalle = (id) => {
    navigate(`/evento/${id}`);
  };

  const handleSaveEvento = async (evento) => {
    try {
      if (editEvento) {

        const updatedEvent = await apiService.updateEvent(editEvento.id, evento);
        setEventosCreados(eventosCreados.map(ev => ev.id === editEvento.id ? updatedEvent : ev));
      } else {

        const newEvent = await apiService.createEvent(evento);
        setEventosCreados([...eventosCreados, newEvent]);
      }
      setModalOpen(false);
      setEditEvento(null);
    } catch (err) {
      console.error('Error saving event:', err);
      setError(err.message || 'Error al guardar el evento');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-10 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-10 px-4">
      <EventoModal open={modalOpen} onClose={() => { setModalOpen(false); setEditEvento(null); }} onSave={handleSaveEvento} initialData={editEvento} />
      

      {error && (
        <div className="max-w-5xl mx-auto mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-800">❌ {error}</p>
            </div>
          </div>
        </div>
      )}
      

      {advertencia.show && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">¿Eliminar evento?</h2>
            <p className="mb-6">¿Estás seguro que deseas eliminar el evento <b>"{advertencia.nombre}"</b>? Esta acción no se puede deshacer.</p>
            <div className="flex justify-center gap-4">
              <button className="btn-secondary px-4 py-2" onClick={cancelarEliminar}>Cancelar</button>
              <button className="btn-secondary px-4 py-2 text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700" onClick={confirmarEliminar}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
      
      <header className="mb-10 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              Bienvenido, {user ? `${user.first_name} ${user.last_name}` : 'Usuario'} 
            </h1>
            <p className="text-gray-600 mt-2">Gestiona tus eventos y descubre nuevos</p>
          </div>
          <div className="flex gap-3">
            <button className="btn-primary flex items-center gap-2" onClick={() => window.location.reload()}>
              <UserCheck className="w-4 h-4" /> Actualizar mis eventos
            </button>
            <button className="btn-secondary flex items-center gap-2" onClick={handleLogout}>
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </button>
          </div>
        </div>
        

        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Buscar por nombre o fecha (YYYY-MM-DD)..."
              />
            </div>
            <button 
              onClick={handleSearch}
              disabled={searching}
              className="btn-primary flex items-center gap-2 px-6 py-2"
            >
              {searching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Buscar
                </>
              )}
            </button>
            <button 
              onClick={() => navigate('/explorar')}
              className="btn-secondary flex items-center gap-2 px-4 py-2"
            >
              <Globe className="w-4 h-4" />
              Explorar todos
            </button>
          </div>
        </div>
      </header>


      {searchResults.length > 0 && (
        <div className="max-w-5xl mx-auto mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-secondary flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" /> Resultados de búsqueda para "{searchTerm}"
              </h2>
              <button 
                onClick={() => { setSearchResults([]); setSearchTerm(''); }}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Limpiar búsqueda
              </button>
            </div>
            <div className="space-y-4">
              {searchResults.map(ev => (
                <div key={ev.id} className="flex justify-between items-center bg-blue-50/60 rounded-xl p-4 border border-blue-100 cursor-pointer hover:bg-blue-100/60 transition gap-4" onClick={() => handleDetalle(ev.id)}>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-primary truncate">{ev.name}</h3>
                    <div className="text-gray-500 flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" /> {new Date(ev.start_date).toLocaleDateString()}
                      <MapPin className="w-4 h-4 ml-4" /> {ev.location_name || ev.location?.name || 'Sin ubicación'}
                    </div>
                    <p className="text-gray-600 text-sm mt-1 truncate">{ev.description}</p>
                  </div>
                  <div className="flex flex-row gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                    <button className="btn-primary flex items-center gap-1 px-3 py-2 text-sm" onClick={() => handleUnirse(ev.id)}>
                      <Users className="w-4 h-4" /> Unirse
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">

        <section className="space-y-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-secondary flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" /> Eventos creados por mí
              </h2>
              <button className="btn-primary flex items-center gap-2" onClick={handleNuevoEvento}>
                <Plus className="w-4 h-4" /> Nuevo evento
              </button>
            </div>
            <div className="space-y-4">
              {eventosCreados.length === 0 && (
                <div className="text-gray-500 text-center">No tienes eventos creados.</div>
              )}
              {eventosCreados.map(ev => (
                <div key={ev.id} className="flex flex-col md:flex-row md:items-center justify-between bg-blue-50/60 rounded-xl p-4 border border-blue-100 cursor-pointer hover:bg-blue-100/60 transition gap-4" onClick={() => handleDetalle(ev.id)}>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-primary truncate">{ev.name}</h3>
                    <div className="text-gray-500 flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" /> {new Date(ev.start_date).toLocaleDateString()}
                      <MapPin className="w-4 h-4 ml-4" /> {ev.location_name}
                    </div>
                    <p className="text-gray-600 text-sm mt-1 truncate">{ev.description}</p>
                  </div>
                  <div className="flex flex-row gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                    <button className="btn-secondary flex items-center gap-1 px-3 py-2 text-sm" onClick={() => handleEditar(ev.id)}>
                      <Pencil className="w-4 h-4" /> Editar
                    </button>
                    <button className="btn-secondary flex items-center gap-1 px-3 py-2 text-sm text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleEliminar(ev.id)} title="Solo puedes eliminar eventos que creaste tú">
                      <Trash2 className="w-4 h-4" /> Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-secondary flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-primary" /> Eventos a los que me uní
            </h2>
            <div className="space-y-4">
              {eventosUnidos.length === 0 && (
                <div className="text-gray-500 text-center">No te has unido a ningún evento.</div>
              )}
              {eventosUnidos.map(ev => (
                <div key={ev.id} className="flex flex-col md:flex-row md:items-center justify-between bg-green-50/60 rounded-xl p-4 border border-green-100 cursor-pointer hover:bg-green-100/60 transition gap-4" onClick={() => handleDetalle(ev.id)}>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-green-700 truncate">{ev.name}</h3>
                    <div className="text-gray-500 flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" /> {new Date(ev.start_date).toLocaleDateString()}
                      <MapPin className="w-4 h-4 ml-4" /> {ev.location_name}
                    </div>
                    <p className="text-gray-600 text-sm mt-1 truncate">{ev.description}</p>
                  </div>
                  <div className="flex flex-row gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                    <button className="btn-secondary flex items-center gap-2 px-3 py-2 text-sm text-red-600 border-red-400 hover:bg-red-50 hover:text-red-700" onClick={() => handleCancelarUnion(ev.id)}>
                      <XCircle className="w-4 h-4" /> Cancelar inscripción
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>


        <section className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 h-fit">
          <h2 className="text-xl font-bold text-secondary mb-4 flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary" /> Eventos disponibles
          </h2>
          <div className="space-y-4">
            {eventosMundiales.length === 0 && (
              <div className="text-gray-500 text-center">No hay eventos disponibles.</div>
            )}
            {eventosMundiales.map(ev => (
              <div key={ev.id} className="flex justify-between items-center bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-secondary">{ev.name}</h3>
                  <div className="text-gray-500 flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4" /> {new Date(ev.start_date).toLocaleDateString()}
                    <MapPin className="w-4 h-4 ml-4" /> {ev.location_name}
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{ev.description}</p>
                </div>
                <button className="btn-primary flex items-center gap-1" onClick={() => handleUnirse(ev.id)}>
                  <Users className="w-4 h-4" /> Unirse
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
} 