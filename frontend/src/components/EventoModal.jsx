import { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Tag, Image, DollarSign, FileText } from 'lucide-react';
import apiService from '../services/api';

export default function EventoModal({ open, onClose, onSave, initialData }) {
  const [form, setForm] = useState({
    nombre: '',
    fecha: '',
    lugar: '',
    precio: '',
    tags: [],
    imagen: '',
    descripcion: ''
  });
  const [errors, setErrors] = useState({});
  const [availableTags, setAvailableTags] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoadingTags(true);
        const tags = await apiService.getTags();
        setAvailableTags(tags);
      } catch (err) {
        console.error('Error fetching tags:', err);
        // Fallback to empty array if API fails
        setAvailableTags([]);
      } finally {
        setLoadingTags(false);
      }
    };

    if (open) {
      fetchTags();
    }
  }, [open]);

  useEffect(() => {
    if (initialData) {
      setForm({ ...initialData, precio: initialData.precio?.toString() ?? '' });
    } else {
      setForm({ nombre: '', fecha: '', lugar: '', precio: '', tags: [], imagen: '', descripcion: '' });
    }
    setErrors({});
  }, [open, initialData]);

  if (!open) return null;

  const validate = () => {
    const newErrors = {};
    if (!form.nombre || form.nombre.length < 3) newErrors.nombre = 'El nombre debe tener al menos 3 letras';
    if (!form.fecha) newErrors.fecha = 'La fecha es obligatoria';
    if (!form.lugar || form.lugar.length < 3) newErrors.lugar = 'El lugar debe tener al menos 3 letras';
    if (form.precio === '' || isNaN(Number(form.precio)) || Number(form.precio) < 0) newErrors.precio = 'Precio inválido';
    if (form.tags.length === 0) newErrors.tags = 'Selecciona al menos un tag';
    if (!form.imagen || !form.imagen.startsWith('http')) newErrors.imagen = 'URL de imagen inválida';
    if (!form.descripcion || form.descripcion.length < 10) newErrors.descripcion = 'La descripción debe tener al menos 10 letras';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleTagToggle = (tag) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({ ...form, precio: Number(form.precio) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 relative animate-fade-in">
        <button className="absolute top-4 right-4 text-gray-400 hover:text-primary" onClick={onClose}>
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-primary mb-6">{initialData ? 'Editar evento' : 'Crear nuevo evento'}</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1">Nombre</label>
            <div className="relative">
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className={`input-field pl-10 ${errors.nombre ? 'border-red-500' : ''}`}
                placeholder="Nombre del evento"
              />
              <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            </div>
            {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fecha</label>
              <div className="relative">
                <input
                  type="date"
                  name="fecha"
                  value={form.fecha}
                  onChange={handleChange}
                  className={`input-field pl-10 ${errors.fecha ? 'border-red-500' : ''}`}
                />
                <Calendar className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              </div>
              {errors.fecha && <p className="text-xs text-red-500 mt-1">{errors.fecha}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lugar</label>
              <div className="relative">
                <input
                  type="text"
                  name="lugar"
                  value={form.lugar}
                  onChange={handleChange}
                  className={`input-field pl-10 ${errors.lugar ? 'border-red-500' : ''}`}
                  placeholder="Lugar del evento"
                />
                <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              </div>
              {errors.lugar && <p className="text-xs text-red-500 mt-1">{errors.lugar}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Precio</label>
              <div className="relative">
                <input
                  type="number"
                  name="precio"
                  value={form.precio}
                  onChange={handleChange}
                  className={`input-field pl-10 ${errors.precio ? 'border-red-500' : ''}`}
                  min="0"
                  placeholder="Precio"
                />
                <DollarSign className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              </div>
              {errors.precio && <p className="text-xs text-red-500 mt-1">{errors.precio}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Imagen (URL)</label>
              <div className="relative">
                <input
                  type="text"
                  name="imagen"
                  value={form.imagen}
                  onChange={handleChange}
                  className={`input-field pl-10 ${errors.imagen ? 'border-red-500' : ''}`}
                  placeholder="https://..."
                />
                <Image className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              </div>
              {errors.imagen && <p className="text-xs text-red-500 mt-1">{errors.imagen}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            {loadingTags ? (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm">Cargando tags...</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableTags.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay tags disponibles</p>
                ) : (
                  availableTags.map(tag => (
                    <button
                      type="button"
                      key={tag.id}
                      className={`px-3 py-1 rounded-full border text-xs font-semibold transition-colors duration-200 ${form.tags.includes(tag.name) ? 'bg-primary text-white border-primary' : 'bg-gray-100 text-primary border-gray-200 hover:bg-primary/10'}`}
                      onClick={() => handleTagToggle(tag.name)}
                    >
                      <Tag className="w-3 h-3 inline mr-1" />{tag.name}
                    </button>
                  ))
                )}
              </div>
            )}
            {errors.tags && <p className="text-xs text-red-500 mt-1">{errors.tags}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              className={`input-field min-h-[80px] ${errors.descripcion ? 'border-red-500' : ''}`}
              placeholder="Describe el evento..."
            />
            {errors.descripcion && <p className="text-xs text-red-500 mt-1">{errors.descripcion}</p>}
          </div>
          <div className="flex justify-end mt-6">
            <button type="submit" className="btn-primary px-8 py-3 text-lg">
              {initialData ? 'Guardar cambios' : 'Crear evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 