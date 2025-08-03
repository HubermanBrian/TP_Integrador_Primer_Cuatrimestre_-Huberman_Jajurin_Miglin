import { useState } from 'react';

// Simulación de ubicaciones iniciales
const ubicacionesIniciales = [
  {
    id: 1,
    nombre: 'Estadio Luna Park',
    direccion: 'Av. Madero 470',
    ciudad: 'Buenos Aires',
  },
  {
    id: 2,
    nombre: 'Teatro Gran Rex',
    direccion: 'Av. Corrientes 857',
    ciudad: 'Buenos Aires',
  },
  {
    id: 3,
    nombre: 'Centro de Convenciones',
    direccion: 'Av. Figueroa Alcorta 2099',
    ciudad: 'Buenos Aires',
  },
];

const PAGE_SIZE = 3;

export default function EventLocationsPage() {
  const [ubicaciones, setUbicaciones] = useState(ubicacionesIniciales);
  const [pagina, setPagina] = useState(1);
  const [form, setForm] = useState({ nombre: '', direccion: '', ciudad: '' });
  const [editId, setEditId] = useState(null);

  // Paginación
  const totalPaginas = Math.ceil(ubicaciones.length / PAGE_SIZE);
  const ubicacionesPagina = ubicaciones.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE);

  // Handlers CRUD
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = e => {
    e.preventDefault();
    if (editId) {
      setUbicaciones(ubicaciones.map(u => u.id === editId ? { ...form, id: editId } : u));
      setEditId(null);
    } else {
      setUbicaciones([...ubicaciones, { ...form, id: Date.now() }]);
    }
    setForm({ nombre: '', direccion: '', ciudad: '' });
  };

  const handleEdit = id => {
    const u = ubicaciones.find(u => u.id === id);
    setForm({ nombre: u.nombre, direccion: u.direccion, ciudad: u.ciudad });
    setEditId(id);
  };

  const handleDelete = id => {
    setUbicaciones(ubicaciones.filter(u => u.id !== id));
    if (editId === id) {
      setForm({ nombre: '', direccion: '', ciudad: '' });
      setEditId(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-primary mb-8">Ubicaciones de Eventos</h1>
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
          {ubicacionesPagina.map(u => (
            <li key={u.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="font-semibold text-primary">{u.nombre}</div>
                <div className="text-gray-500 text-sm">{u.direccion}, {u.ciudad}</div>
              </div>
              <div className="flex gap-2">
                <button className="btn-secondary px-3 py-1 text-sm" onClick={() => handleEdit(u.id)}>Editar</button>
                <button className="btn-secondary px-3 py-1 text-sm text-red-600 border-red-400 hover:bg-red-50 hover:text-red-700" onClick={() => handleDelete(u.id)}>Eliminar</button>
              </div>
            </li>
          ))}
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