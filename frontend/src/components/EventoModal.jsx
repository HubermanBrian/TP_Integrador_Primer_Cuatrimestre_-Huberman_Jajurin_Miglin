import { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Tag, Image, DollarSign, FileText } from 'lucide-react';
import apiService from '../services/api';

export default function EventoModal({ open, onClose, onSave, initialData }) {
  const [form, setForm] = useState({
    name: '',
    start_date: '',
    id_event_location: '',
    price: '',
    tags: [],
    Img_url: '',
    description: '',
    id_event_category: '',
    duration_in_minutes: '',
    max_assistance: '',
    enabled_for_enrollment: true
  });
  const [errors, setErrors] = useState({});
  const [availableTags, setAvailableTags] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(false);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoadingTags(true);
        const tags = await apiService.getTags();
        setAvailableTags(tags);
      } catch (err) {
        console.error('Error fetching tags:', err);
        setAvailableTags([]);
      } finally {
        setLoadingTags(false);
      }
    };
    const fetchMeta = async () => {
      try {
        setLoadingMeta(true);
        const [cats, locs] = await Promise.all([
          apiService.getEventCategories().catch(() => []),
          apiService.getLocations().catch(() => [])
        ]);
        setAvailableCategories(Array.isArray(cats) ? cats : []);
        setAvailableLocations(Array.isArray(locs) ? locs : []);
      } catch (err) {
        console.error('Error fetching meta:', err);
        setAvailableCategories([]);
        setAvailableLocations([]);
      } finally {
        setLoadingMeta(false);
      }
    };

    if (open) {
      fetchTags();
      fetchMeta();
    }
  }, [open]);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        start_date: initialData.start_date ? initialData.start_date.slice(0, 10) : '',
        id_event_location: initialData.id_event_location || '',
        price: initialData.price?.toString() ?? '',
        tags: Array.isArray(initialData.tags) ? initialData.tags : [],
        Img_url: initialData.Img_url || '',
        description: initialData.description || '',
        id_event_category: initialData.id_event_category || '',
        duration_in_minutes: initialData.duration_in_minutes?.toString() || '',
        max_assistance: initialData.max_assistance?.toString() || '',
        enabled_for_enrollment: typeof initialData.enabled_for_enrollment === 'boolean' ? initialData.enabled_for_enrollment : true
      });
    } else {
      setForm({
        name: '',
        start_date: '',
        id_event_location: '',
        price: '',
        tags: [],
        Img_url: '',
        description: '',
        id_event_category: '',
        duration_in_minutes: '',
        max_assistance: '',
        enabled_for_enrollment: true
      });
    }
    setErrors({});
  }, [open, initialData]);

  if (!open) return null;

  const validate = () => {
    const newErrors = {};
    if (!form.name || form.name.length < 3) newErrors.name = 'El nombre debe tener al menos 3 letras';
    if (!form.start_date) newErrors.start_date = 'La fecha es obligatoria';
    if (!form.id_event_location) newErrors.id_event_location = 'La ubicación es obligatoria';
    if (!form.id_event_category) newErrors.id_event_category = 'La categoría es obligatoria';
    if (form.price === '' || isNaN(Number(form.price)) || Number(form.price) < 0) newErrors.price = 'Precio inválido';
    if (!form.description || form.description.length < 10) newErrors.description = 'La descripción debe tener al menos 10 letras';
    if (form.duration_in_minutes && (isNaN(Number(form.duration_in_minutes)) || Number(form.duration_in_minutes) < 0)) newErrors.duration_in_minutes = 'Duración inválida';
    if (form.max_assistance && (isNaN(Number(form.max_assistance)) || Number(form.max_assistance) <= 0)) newErrors.max_assistance = 'Cupos inválidos';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleTagToggle = (tagId) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(id => id !== tagId)
        : [...prev.tags, tagId]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      ...form,
      price: Number(form.price),
      id_event_location: Number(form.id_event_location),
      id_event_category: Number(form.id_event_category),
      duration_in_minutes: form.duration_in_minutes ? Number(form.duration_in_minutes) : 0,
      max_assistance: form.max_assistance ? Number(form.max_assistance) : undefined,
      tags: form.tags
    });
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
                name="name"
                value={form.name}
                onChange={handleChange}
                className={`input-field pl-10 ${errors.name ? 'border-red-500' : ''}`}
                placeholder="Nombre del evento"
              />
              <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            </div>
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fecha</label>
              <div className="relative">
                <input
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                  className={`input-field pl-10 ${errors.start_date ? 'border-red-500' : ''}`}
                />
                <Calendar className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              </div>
              {errors.start_date && <p className="text-xs text-red-500 mt-1">{errors.start_date}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ubicación</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <select
                  name="id_event_location"
                  value={form.id_event_location}
                  onChange={handleChange}
                  className={`input-field pl-10 ${errors.id_event_location ? 'border-red-500' : ''}`}
                >
                  <option value="">Selecciona una ubicación</option>
                  {availableLocations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              {errors.id_event_location && <p className="text-xs text-red-500 mt-1">{errors.id_event_location}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Categoría</label>
            <select
              name="id_event_category"
              value={form.id_event_category}
              onChange={handleChange}
              className={`input-field ${errors.id_event_category ? 'border-red-500' : ''}`}
            >
              <option value="">Selecciona una categoría</option>
              {availableCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.id_event_category && <p className="text-xs text-red-500 mt-1">{errors.id_event_category}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Precio</label>
              <div className="relative">
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  className={`input-field pl-10 ${errors.price ? 'border-red-500' : ''}`}
                  min="0"
                  placeholder="Ingresa el precio"
                />
                <DollarSign className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              </div>
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Imagen</label>
              <div className="relative">
                              <input
                type="text"
                name="image_url"
                value={form.Img_url}
                onChange={handleChange}
                className={`input-field pl-10 ${errors.Img_url ? 'border-red-500' : ''}`}
                placeholder="URL de imagen (opcional)"
              />
                <Image className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              </div>
              {errors.Img_url && <p className="text-xs text-red-500 mt-1">{errors.Img_url}</p>}
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
                  <p className="text-sm text-gray-500">Sin tags disponibles</p>
                ) : (
                  availableTags.map(tag => (
                    <button
                      type="button"
                      key={tag.id}
                      className={`px-3 py-1 rounded-full border text-xs font-semibold transition-colors duration-200 ${form.tags.includes(tag.id) ? 'bg-primary text-white border-primary' : 'bg-gray-100 text-primary border-gray-200 hover:bg-primary/10'}`}
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      <Tag className="w-3 h-3 inline mr-1" />{tag.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className={`input-field min-h-[80px] ${errors.description ? 'border-red-500' : ''}`}
              placeholder="Describe el evento..."
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Duración (minutos)</label>
              <input
                type="number"
                name="duration_in_minutes"
                value={form.duration_in_minutes}
                onChange={handleChange}
                className={`input-field ${errors.duration_in_minutes ? 'border-red-500' : ''}`}
                min="0"
                placeholder="Ej: 120"
              />
              {errors.duration_in_minutes && <p className="text-xs text-red-500 mt-1">{errors.duration_in_minutes}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cupos</label>
              <input
                type="number"
                name="max_assistance"
                value={form.max_assistance}
                onChange={handleChange}
                className={`input-field ${errors.max_assistance ? 'border-red-500' : ''}`}
                min="1"
                placeholder="Ej: 50"
              />
              {errors.max_assistance && <p className="text-xs text-red-500 mt-1">{errors.max_assistance}</p>}
            </div>
          </div>
          <div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="enabled_for_enrollment"
                checked={!!form.enabled_for_enrollment}
                onChange={(e) => setForm(f => ({ ...f, enabled_for_enrollment: e.target.checked }))}
                className="h-4 w-4"
              />
              Habilitar inscripción
            </label>
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