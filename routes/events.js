const express = require('express');
const router = express.Router();
const db = require('../db-supabase');

// Listar eventos futuros con información completa
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0, category_id, location_id, search, name, startdate, tag } = req.query;
    const now = new Date();
    
    // Construir filtros
    const filters = {};
    if (category_id) filters.category = category_id;
    if (location_id) filters.location = location_id;
    if (name) filters.name = name;
    if (search && !filters.name) filters.name = search;
    
    // Obtener eventos usando la nueva función
    const result = await db.getEvents(filters);
    
    // Filtrar eventos futuros y aplicar búsqueda
    let events = result.rows.filter(event => new Date(event.start_date) > now);

    // Filtrar por fecha exacta (solo parte de fecha)
    if (startdate) {
      events = events.filter(event => {
        const d = new Date(event.start_date);
        const dateOnly = d.toISOString().slice(0, 10);
        return dateOnly === startdate;
      });
    }

    // Aplicar búsqueda por texto si se proporciona
    if (search) {
      events = events.filter(event => 
        event.name.toLowerCase().includes(search.toLowerCase()) ||
        event.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Aplicar límite y offset
    events = events.slice(offset, offset + parseInt(limit));
    
    // Transformar la estructura de datos
    const transformedEvents = events.map(event => ({
      id: event.id,
      name: event.name,
      description: event.description,
        image_url: event.image_url || null,
      start_date: event.start_date,
      duration_in_minutes: event.duration_in_minutes,
      price: event.price,
      enabled_for_enrollment: event.enabled_for_enrollment,
      max_assistance: event.max_assistance,
      creator: event.users ? {
        id: event.users.id,
        username: event.users.username,
        first_name: event.users.first_name,
        last_name: event.users.last_name
      } : null,
      location: event.event_locations ? {
        name: event.event_locations.name,
        address: event.event_locations.full_address,
        latitude: event.event_locations.latitude,
        longitude: event.event_locations.longitude
      } : null,
      category: event.event_categories ? event.event_categories.name : null
    }));
    
    res.json(transformedEvents);
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
});

// Detalle de evento con información completa
router.get('/:id', async (req, res) => {
  try {
    const result = await db.getEventById(req.params.id);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    
    const event = result.rows[0];
    
    // Transformar la estructura de datos
    const transformedEvent = {
      id: event.id,
      name: event.name,
      description: event.description,
        image_url: event.image_url || null,
      start_date: event.start_date,
      duration_in_minutes: event.duration_in_minutes,
      price: event.price,
      enabled_for_enrollment: event.enabled_for_enrollment,
      max_assistance: event.max_assistance,
      creator: event.users ? {
        id: event.users.id,
        username: event.users.username,
        first_name: event.users.first_name,
        last_name: event.users.last_name
      } : null,
      location: event.event_locations ? {
        name: event.event_locations.name,
        address: event.event_locations.full_address,
        latitude: event.event_locations.latitude,
        longitude: event.event_locations.longitude,
        location: event.event_locations.locations ? {
          name: event.event_locations.locations.name,
          province: event.event_locations.locations.provinces ? event.event_locations.locations.provinces.name : null
        } : null
      } : null,
      category: event.event_categories ? event.event_categories.name : null,
      tags: event.event_tags ? event.event_tags.map(et => et.tags ? et.tags.name : null).filter(tag => tag) : []
    };
    
    res.json(transformedEvent);
  } catch (error) {
    console.error('Error getting event details:', error);
    res.status(500).json({ error: 'Error al obtener detalles del evento' });
  }
});

// Crear evento
router.post('/', async (req, res) => {
  try {
    const { name, description, id_event_category, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance, id_creator_user } = req.body;
    
    const result = await db.insert('events', {
      name,
      description,
      category_id: id_event_category,
      location_id: id_event_location,
      start_date,
      duration_in_minutes,
      price,
      enabled_for_enrollment,
      max_assistance,
      creator_id: id_creator_user
    });
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Error al crear evento' });
  }
});

// Modificar evento
router.put('/:id', async (req, res) => {
  try {
    const { name, description, id_event_category, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance, id_creator_user } = req.body;
    
    const result = await db.update('events', {
      name,
      description,
      category_id: id_event_category,
      location_id: id_event_location,
      start_date,
      duration_in_minutes,
      price,
      enabled_for_enrollment,
      max_assistance,
      creator_id: id_creator_user
    }, { id: req.params.id });
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Error al actualizar evento' });
  }
});

// Inscribirse a un evento
router.post('/:id/enroll', async (req, res) => {
  try {
    const { id_user, description } = req.body;
    
    const result = await db.insert('event_enrollments', {
      id_event: req.params.id,
      id_user,
      description,
      registration_date_time: new Date().toISOString()
    });
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error enrolling in event:', error);
    res.status(500).json({ error: 'Error al inscribirse al evento' });
  }
});

// Listar inscriptos a un evento
router.get('/:id/enrollments', async (req, res) => {
  try {
    const { data, error } = await db.supabase
      .from('event_enrollments')
      .select(`
        *,
        users(
          id,
          first_name,
          last_name,
          username
        )
      `)
      .eq('id_event', req.params.id);
    
    if (error) throw error;
    
    const enrollments = data.map(enrollment => ({
      id: enrollment.users.id,
      first_name: enrollment.users.first_name,
      last_name: enrollment.users.last_name,
      username: enrollment.users.username,
      registration_date_time: enrollment.registration_date_time
    }));
    
    res.json(enrollments);
  } catch (error) {
    console.error('Error getting enrollments:', error);
    res.status(500).json({ error: 'Error al obtener inscriptos' });
  }
});

module.exports = router;
