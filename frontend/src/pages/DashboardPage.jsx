import { useState } from 'react';
import { Pencil, Trash2, Plus, Users, Globe, Calendar, MapPin, LogOut, UserCheck, UserPlus, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EventoModal from '../components/EventoModal';

const eventosCreadosInicial = [
  {
    id: 1,
    nombre: "Mi Recital",
    fecha: "2024-07-10",
    lugar: "Teatro Gran Rex",
    precio: 100,
    tags: ["Música"],
    imagen: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=220&fit=crop",
    descripcion: "Un show inolvidable",
  },
  {
    id: 2,
    nombre: "Charla de Tecnología",
    fecha: "2024-08-01",
    lugar: "Auditorio ORT",
    precio: 0,
    tags: ["Tecnología"],
    imagen: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=220&fit=crop",
    descripcion: "Charlas sobre IA y futuro",
  },
];

const eventosUnidosInicial = [
  {
    id: 201,
    nombre: "Feria de Startups",
    fecha: "2024-09-05",
    lugar: "Centro de Convenciones",
    descripcion: "Networking y charlas de innovación",
  },
];

const eventosMundialesInicial = [
  {
    id: 101,
    nombre: "Concierto Global",
    fecha: "2024-09-15",
    lugar: "Estadio Wembley",
    descripcion: "Evento internacional de música",
  },
  {
    id: 102,
    nombre: "Hackathon Mundial",
    fecha: "2024-10-20",
    lugar: "Online",
    descripcion: "Competencia de programación global",
  },
];

export default function DashboardPage() {
  const [eventosCreados, setEventosCreados] = useState(eventosCreadosInicial);
  const [eventosUnidos, setEventosUnidos] = useState(eventosUnidosInicial);
  const [eventosMundiales, setEventosMundiales] = useState(eventosMundialesInicial);
  const [modalOpen, setModalOpen] = useState(false);
  const [editEvento, setEditEvento] = useState(null);
  const navigate = useNavigate();
  const [advertencia, setAdvertencia] = useState({ show: false, id: null, nombre: '' });

  const handleEliminar = (id) => {
    const evento = eventosCreados.find(ev => ev.id === id);
    setAdvertencia({ show: true, id, nombre: evento.nombre });
  };

  const confirmarEliminar = () => {
    setEventosCreados(eventosCreados.filter(ev => ev.id !== advertencia.id));
    setAdvertencia({ show: false, id: null, nombre: '' });
  };

  const cancelarEliminar = () => {
    setAdvertencia({ show: false, id: null, nombre: '' });
  };

  const handleEditar = (id) => {
    const evento = eventosCreados.find(ev => ev.id === id);
    setEditEvento(evento);
    setModalOpen(true);
  };

  const handleUnirse = (id) => {
    const evento = eventosMundiales.find(ev => ev.id === id);
    setEventosUnidos([...eventosUnidos, { ...evento, id: Date.now() }]);
    setEventosMundiales(eventosMundiales.filter(ev => ev.id !== id));
  };

  const handleCancelarUnion = (id) => {
    setEventosUnidos(eventosUnidos.filter(ev => ev.id !== id));
  };

  const handleNuevoEvento = () => {
    setEditEvento(null);
    setModalOpen(true);
  };

  const handleLogout = () => {
    navigate('/login');
  };

  const handleDetalle = (id) => {
    navigate(`/evento/${id}`);
  };

  const handleSaveEvento = (evento) => {
    if (editEvento) {
      // Editar
      setEventosCreados(eventosCreados.map(ev => ev.id === editEvento.id ? { ...evento, id: editEvento.id } : ev));
    } else {
      // Crear
      setEventosCreados([
        ...eventosCreados,
        { ...evento, id: Date.now() }
      ]);
    }
    setModalOpen(false);
    setEditEvento(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-10 px-4">
      <EventoModal open={modalOpen} onClose={() => { setModalOpen(false); setEditEvento(null); }} onSave={handleSaveEvento} initialData={editEvento} />
      {/* Modal de advertencia para eliminar */}
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
      <header className="flex justify-between items-center mb-10 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-primary">Bienvenido, Usuario 👋</h1>
        <button className="btn-secondary flex items-center gap-2" onClick={handleLogout}>
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </button>
      </header>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Mis eventos */}
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
                    <h3 className="text-lg font-semibold text-primary truncate">{ev.nombre}</h3>
                    <div className="text-gray-500 flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" /> {ev.fecha}
                      <MapPin className="w-4 h-4 ml-4" /> {ev.lugar}
                    </div>
                    <p className="text-gray-600 text-sm mt-1 truncate">{ev.descripcion}</p>
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
                    <h3 className="text-lg font-semibold text-green-700 truncate">{ev.nombre}</h3>
                    <div className="text-gray-500 flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" /> {ev.fecha}
                      <MapPin className="w-4 h-4 ml-4" /> {ev.lugar}
                    </div>
                    <p className="text-gray-600 text-sm mt-1 truncate">{ev.descripcion}</p>
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

        {/* Eventos mundiales */}
        <section className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 h-fit">
          <h2 className="text-xl font-bold text-secondary mb-4 flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary" /> Eventos mundiales
          </h2>
          <div className="space-y-4">
            {eventosMundiales.length === 0 && (
              <div className="text-gray-500 text-center">No hay eventos mundiales disponibles.</div>
            )}
            {eventosMundiales.map(ev => (
              <div key={ev.id} className="flex justify-between items-center bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-secondary">{ev.nombre}</h3>
                  <div className="text-gray-500 flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4" /> {ev.fecha}
                    <MapPin className="w-4 h-4 ml-4" /> {ev.lugar}
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{ev.descripcion}</p>
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