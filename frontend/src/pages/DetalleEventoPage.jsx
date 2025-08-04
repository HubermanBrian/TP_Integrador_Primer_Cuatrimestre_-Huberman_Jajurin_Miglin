import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Calendar, MapPin, Tag, Users, ArrowLeft, XCircle, User, Star } from 'lucide-react';
import apiService from '../services/api';

export default function DetalleEventoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evento, setEvento] = useState(null);
  const [participantes, setParticipantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unido, setUnido] = useState(false);

  useEffect(() => {
    const fetchEvento = async () => {
      try {
        setLoading(true);
        const eventData = await apiService.getEventById(id);
        setEvento(eventData);
        
        // Fetch participants for this event
        const participantsData = await apiService.getEventParticipants(id);
        setParticipantes(participantsData);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError(err.message || 'Error al cargar el evento');
      } finally {
        setLoading(false);
      }
    };

    fetchEvento();
  }, [id]);

  const handleUnirse = async () => {
    try {
      await apiService.joinEvent(id);
      setUnido(true);
      // Refresh participants list
      const participantsData = await apiService.getEventParticipants(id);
      setParticipantes(participantsData);
    } catch (err) {
      console.error('Error joining event:', err);
      setError(err.message || 'Error al unirse al evento');
    }
  };

  const handleCancelar = async () => {
    try {
      await apiService.leaveEvent(id);
      setUnido(false);
      // Refresh participants list
      const participantsData = await apiService.getEventParticipants(id);
      setParticipantes(participantsData);
    } catch (err) {
      console.error('Error leaving event:', err);
      setError(err.message || 'Error al cancelar inscripción');
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-500">Cargando evento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center text-red-500">
        <p>❌ {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary mt-4"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!evento) {
    return <div className="max-w-2xl mx-auto py-16 text-center text-gray-500">Evento no encontrado.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <button className="flex items-center gap-2 text-primary mb-6 hover:underline" onClick={() => navigate(-1)}>
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="relative">
          <img 
            src={evento.image_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=350&fit=crop'} 
            alt={evento.name} 
            className="w-full h-56 object-cover" 
          />
          <div className="absolute top-2 left-2 bg-white/80 rounded-full p-2 shadow">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
        </div>
        <div className="p-6">
          <h1 className="text-3xl font-bold text-secondary mb-2">{evento.name}</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700 text-sm mb-4">
            <div>
              <span className="font-semibold">Fecha:</span> {new Date(evento.start_date).toLocaleDateString()}
            </div>
            <div>
              <span className="font-semibold">Duración:</span> {evento.duration_in_minutes ? `${evento.duration_in_minutes} minutos` : 'Por definir'}
            </div>
            <div>
              <span className="font-semibold">Precio:</span> <span className="text-primary font-bold">{evento.price === 0 ? 'Gratis' : `$${evento.price}`}</span>
            </div>
            <div>
              <span className="font-semibold">Inscripción:</span> {evento.enabled_for_enrollment === '1' ? 'Habilitada' : 'No habilitada'}
            </div>
            <div>
              <span className="font-semibold">Capacidad:</span> {evento.max_assistance}
            </div>
            <div>
              <span className="font-semibold">Organizador:</span> {evento.creator_user?.first_name} {evento.creator_user?.last_name} <span className="text-xs text-gray-500">({evento.creator_user?.username})</span>
            </div>
          </div>
          
          {/* Información de ubicación */}
          {evento.event_location && (
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <h3 className="font-semibold text-secondary mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Ubicación del Evento
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-semibold">Lugar:</span> {evento.event_location.name}
                </div>
                <div>
                  <span className="font-semibold">Capacidad:</span> {evento.event_location.max_capacity}
                </div>
                <div className="sm:col-span-2">
                  <span className="font-semibold">Dirección:</span> {evento.event_location.full_address}
                </div>
                {evento.event_location.location && (
                  <>
                    <div>
                      <span className="font-semibold">Localidad:</span> {evento.event_location.location.name}
                    </div>
                    <div>
                      <span className="font-semibold">Provincia:</span> {evento.event_location.location.province?.name || 'No especificada'}
                    </div>
                  </>
                )}
                {evento.event_location.creator_user && (
                  <div className="sm:col-span-2">
                    <span className="font-semibold">Creador de ubicación:</span> {evento.event_location.creator_user.first_name} {evento.event_location.creator_user.last_name}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="mb-4">
            <span className="font-semibold">Descripción:</span>
            <p className="text-gray-600 text-base leading-relaxed mt-1">{evento.description}</p>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {evento.tags && evento.tags.map(tag => (
              <span key={tag.id} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                <Tag className="w-3 h-3 inline mr-1" />{tag.name}
              </span>
            ))}
          </div>
          {/* Botón de inscripción */}
          {unido ? (
            <button className="btn-secondary flex items-center gap-2 text-lg px-8 py-3 text-red-600 border-red-400 hover:bg-red-50" onClick={handleCancelar}>
              <XCircle className="w-5 h-5" /> Cancelar inscripción
            </button>
          ) : (
            <button className="btn-primary flex items-center gap-2 text-lg px-8 py-3" onClick={handleUnirse}>
              <Users className="w-5 h-5" /> Unirse
            </button>
          )}
        </div>
      </div>
      {/* Participantes */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mt-8 p-6">
        <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
          <User className="w-6 h-6" /> Participantes ({participantes.length})
        </h2>
        {participantes.length === 0 ? (
          <div className="text-gray-500 text-center py-8">Aún no hay participantes en este evento.</div>
        ) : (
          <ul className="space-y-4">
            {participantes.map(p => (
              <li key={p.id} className="flex flex-col md:flex-row md:items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-3">
                  <User className="w-8 h-8 text-primary" />
                  <div>
                    <div className="font-semibold text-secondary">{p.first_name} {p.last_name} <span className="text-xs text-gray-400">({p.username})</span></div>
                    <div className="text-xs text-gray-500">
                      {p.attended ? 'Asistió' : 'No asistió'}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col md:items-end mt-2 md:mt-0">
                  {p.rating && (
                    <div className="flex items-center gap-1 text-yellow-500 mb-1">
                      {Array.from({ length: p.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400" />
                      ))}
                      <span className="text-xs text-gray-600 ml-2">{p.rating}/5</span>
                    </div>
                  )}
                  {p.observations && (
                    <div className="text-xs text-gray-700 italic">"{p.observations}"</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 