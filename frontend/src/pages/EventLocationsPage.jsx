import { useState, useEffect } from 'react';
import apiService from '../services/api';

const PAGE_SIZE = 3;

export default function EventLocationsPage() {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [form, setForm] = useState({ nombre: '', direccion: '', ciudad: '' });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        setError('');
        const locations = await apiService.getLocations();
        setUbicaciones(locations);
      } catch (err) {
        console.error('Error fetching locations:', err);
        setError(err.message || 'Error al cargar las ubicaciones');
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  // Paginación
  const totalPaginas = Math.ceil(ubicaciones.length / PAGE_SIZE);
  const ubicacionesPagina = ubicaciones.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE);

  // Handlers CRUD
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (editId) {
        const updatedLocation = await apiService.updateLocation(editId, form);
        setUbicaciones(ubicaciones.map(u => u.id === editId ? updatedLocation : u));
        setEditId(null);
      } else {
        const newLocation = await apiService.createLocation(form);
        setUbicaciones([...ubicaciones, newLocation]);
      }
      setForm({ nombre: '', direccion: '', ciudad: '' });
    } catch (err) {
      console.error('Error saving location:', err);
      setError(err.message || 'Error al guardar la ubicación');
    }
  };

  const handleEdit = id => {
    const u = ubicaciones.find(u => u.id === id);
    setForm({ nombre: u.name, direccion: u.address, ciudad: u.city });
    setEditId(id);
  };

  const handleDelete = async id => {
    try {
      await apiService.deleteLocation(id);
      setUbicaciones(ubicaciones.filter(u => u.id !== id));
      if (editId === id) {
        setForm({ nombre: '', direccion: '', ciudad: '' });
        setEditId(null);
      }
    } catch (err) {
      console.error('Error deleting location:', err);
      setError(err.message || 'Error al eliminar la ubicación');
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-500">Cargando ubicaciones...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-primary mb-8">Ubicaciones de Eventos</h1>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-800">❌ {error}</p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8 flex flex-col gap-4">
        <input
          type="text"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          className="input-field"
          placeholder="Nombre de la ubicación"
          required
        />
        <input
          type="text"
          name="direccion"
          value={form.direccion}
          onChange={handleChange}
          className="input-field"
          placeholder="Dirección"
          required
        />
        <input
          type="text"
          name="ciudad"
          value={form.ciudad}
          onChange={handleChange}
          className="input-field"
          placeholder="Ciudad"
          required
        />
        <button type="submit" className="btn-primary self-end">{editId ? 'Actualizar' : 'Agregar'}</button>
      </form>
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-secondary mb-4">Lista de ubicaciones</h2>
        <ul className="divide-y divide-gray-100">
          {ubicacionesPagina.length === 0 ? (
            <li className="py-8 text-center text-gray-500">No hay ubicaciones disponibles.</li>
          ) : (
            ubicacionesPagina.map(u => (
              <li key={u.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-primary">{u.name}</div>
                  <div className="text-gray-500 text-sm">{u.address}, {u.city}</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary px-3 py-1 text-sm" onClick={() => handleEdit(u.id)}>Editar</button>
                  <button className="btn-secondary px-3 py-1 text-sm text-red-600 border-red-400 hover:bg-red-50 hover:text-red-700" onClick={() => handleDelete(u.id)}>Eliminar</button>
                </div>
              </li>
            ))
          )}
        </ul>
        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4">
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
    </div>
  );
} 