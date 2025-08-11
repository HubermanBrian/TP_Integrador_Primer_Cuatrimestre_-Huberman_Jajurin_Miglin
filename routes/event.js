const express = require('express');
const router = express.Router();
const db = require('../db-supabase');
const { authenticateToken } = require('../middleware/auth');


router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { name, startdate, tag } = req.query;


        let query = db.supabase
            .from('events')
            .select(`
                *,
                event_categories(name),
                event_locations(
                    *,
                    locations(
                        *,
                        provinces(*)
                    )
                ),
                users!events_id_creator_user_fkey(
                    id,
                    first_name,
                    last_name,
                    username
                )
            `);

        if (name) {
            query = query.ilike('name', `%${name}%`);
        }
        if (startdate) {
            query = query.eq('start_date::date', startdate);
        }

  
        query = query.range(offset, offset + limit - 1);
        query = query.order('start_date', { ascending: false });

        const { data: events, error } = await query;

        if (error) throw error;

  
        let filteredEvents = events;
        if (tag) {

            const { data: tagEvents, error: tagError } = await db.supabase
                .from('event_tags')
                .select('id_event')
                .eq('tags.name', tag)
                .eq('tags.name', tag);

            if (!tagError && tagEvents) {
                const eventIds = tagEvents.map(te => te.id_event);
                filteredEvents = events.filter(event => eventIds.includes(event.id));
            }
        }

        const transformedEvents = filteredEvents.map(event => ({
            id: event.id,
            name: event.name,
            description: event.description,
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
    } catch (err) {
        console.error('Error getting events:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

router.get('/tags', async (req, res) => {
    try {
        const { data: tags, error } = await db.supabase
            .from('tags')
            .select('*')
            .order('name');
        
        if (error) throw error;
        
        res.json(tags || []);
    } catch (err) {
        console.error('Error getting tags:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

router.get('/categories', async (req, res) => {
    try {
        const { data: categories, error } = await db.supabase
            .from('event_categories')
            .select('id, name')
            .order('name');
        if (error) throw error;
        res.json(categories || []);
    } catch (err) {
        console.error('Error getting categories:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

router.get('/locations', async (req, res) => {
    try {
        const { data: locations, error } = await db.supabase
            .from('event_locations')
            .select('id, name, full_address, max_capacity')
            .order('name');
        if (error) throw error;
        res.json(locations || []);
    } catch (err) {
        console.error('Error getting locations:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

router.get('/:id', async (req, res) => {
    const eventId = req.params.id;
    try {
        const { data: event, error } = await db.supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (error || !event) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }

        const response = {
            id: event.id,
            name: event.name,
            description: event.description,
            Img_url: event.Img_url || null,
            id_event_location: event.id_event_location,
            start_date: event.start_date,
            duration_in_minutes: event.duration_in_minutes,
            price: event.price,
            enabled_for_enrollment: event.enabled_for_enrollment,
            max_assistance: event.max_assistance,
            id_creator_user: event.id_creator_user,
            event_location: event.event_locations ? {
                id: event.event_locations.id,
                id_location: event.event_locations.id_location,
                name: event.event_locations.name,
                full_address: event.event_locations.full_address,
                max_capacity: event.event_locations.max_capacity,
                latitude: event.event_locations.latitude,
                longitude: event.event_locations.longitude,
                id_creator_user: event.event_locations.id_creator_user,
                location: event.event_locations.locations ? {
                    id: event.event_locations.locations.id,
                    name: event.event_locations.locations.name,
                    id_province: event.event_locations.locations.id_province,
                    latitude: event.event_locations.locations.latitude,
                    longitude: event.event_locations.locations.longitude,
                    province: event.event_locations.locations.provinces ? {
                        id: event.event_locations.locations.provinces.id,
                        name: event.event_locations.locations.provinces.name,
                        full_name: event.event_locations.locations.provinces.full_name,
                        latitude: event.event_locations.locations.provinces.latitude,
                        longitude: event.event_locations.locations.provinces.longitude,
                        display_order: event.event_locations.locations.provinces.display_order
                    } : null
                } : null,
                creator_user: event.event_locations.users ? {
                    id: event.event_locations.users.id,
                    first_name: event.event_locations.users.first_name,
                    last_name: event.event_locations.users.last_name,
                    username: event.event_locations.users.username,
                    password: "******"
                } : null
            } : null,
            tags: event.event_tags ? event.event_tags.map(et => ({
                id: et.tags.id,
                name: et.tags.name
            })) : [],
            creator_user: event.users ? {
                id: event.users.id,
                first_name: event.users.first_name,
                last_name: event.users.last_name,
                username: event.users.username,
                password: "******"
            } : null
        };

        res.json(response);
    } catch (err) {
        console.error('Error getting event details:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            name,
            description,
            id_event_category,
            id_event_location,
            start_date,
            duration_in_minutes,
            price,
            enabled_for_enrollment,
            max_assistance,
            tags 
        } = req.body;

        if (!name || !description || !id_event_category || !id_event_location || !start_date) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        let locationMaxCapacity = null;
        try {
            const { data: locationData } = await db.supabase
                .from('event_locations')
                .select('max_capacity')
                .eq('id', id_event_location)
                .single();
            locationMaxCapacity = locationData ? locationData.max_capacity : null;
        } catch (_) {
            locationMaxCapacity = null;
        }

        const eventData = {
            name,
            description,
            Img_url: req.body.Img_url || null,
            category_id: id_event_category,
            location_id: id_event_location,
            start_date,
            duration_in_minutes: duration_in_minutes || 0,
            price: price || 0,
            enabled_for_enrollment: enabled_for_enrollment !== undefined ? enabled_for_enrollment : true,
            max_assistance: typeof max_assistance === 'number' ? max_assistance : (locationMaxCapacity ?? 100),
            creator_id: req.user.id
        };

        const { data: newEvent, error: eventError } = await db.supabase
            .from('events')
            .insert(eventData)
            .select('*')
            .single();

        if (eventError) throw eventError;

        if (tags && Array.isArray(tags) && tags.length > 0) {
            const tagData = tags.map(tagId => ({
                id_event: newEvent.id,
                id_tag: tagId
            }));

            const { error: tagError } = await db.supabase
                .from('event_tags')
                .insert(tagData);

            if (tagError) {
                console.error('Error adding tags:', tagError);
            }
        }

        res.status(201).json(newEvent);
    } catch (err) {
        console.error('Error creating event:', err);
        res.status(500).json({ error: 'Error al crear evento' });
    }
});

router.put('/', authenticateToken, async (req, res) => {
    const {
        id,
        name,
        description,
        id_event_location,
        start_date,
        duration_in_minutes,
        price,
        enabled_for_enrollment,
        max_assistance,
        tags 
    } = req.body;

    if (!id) {
        return res.status(400).json({ message: "El campo id es obligatorio." });
    }
    if (!name || name.trim().length < 3) {
        return res.status(400).json({ message: "El campo name es obligatorio y debe tener al menos 3 letras." });
    }
    if (!description || description.trim().length < 3) {
        return res.status(400).json({ message: "El campo description es obligatorio y debe tener al menos 3 letras." });
    }
    if (typeof price !== 'number' || price < 0) {
        return res.status(400).json({ message: "El campo price debe ser un número mayor o igual a cero." });
    }
    if (typeof duration_in_minutes !== 'number' || duration_in_minutes < 0) {
        return res.status(400).json({ message: "El campo duration_in_minutes debe ser un número mayor o igual a cero." });
    }
    if (!id_event_location) {
        return res.status(400).json({ message: "El campo id_event_location es obligatorio." });
    }
    if (typeof max_assistance !== 'number' || max_assistance < 0) {
        return res.status(400).json({ message: "El campo max_assistance debe ser un número mayor o igual a cero." });
    }

    try {
        // Verificar que el evento existe y pertenece al usuario
        const { data: event, error: eventError } = await db.supabase
            .from('events')
            .select('*')
            .eq('id', id)
            .single();
        
        if (eventError || !event) {
            return res.status(404).json({ message: "El evento no existe." });
        }
        
        if (event.creator_id !== req.user.id) {
            return res.status(403).json({ message: "El evento no pertenece al usuario autenticado." });
        }

        // Verificar que la ubicación existe y obtener su capacidad máxima
        const { data: location, error: locationError } = await db.supabase
            .from('event_locations')
            .select('max_capacity')
            .eq('id', id_event_location)
            .single();
        
        if (locationError || !location) {
            return res.status(400).json({ message: "El id_event_location no existe." });
        }
        
        if (max_assistance > location.max_capacity) {
            return res.status(400).json({ message: "El max_assistance no puede ser mayor que el max_capacity del event_location." });
        }

        // Actualizar el evento
        const updateData = {
            name: name.trim(),
            description: description.trim(),
            location_id: id_event_location,
            start_date,
            duration_in_minutes,
            price,
            enabled_for_enrollment,
            max_assistance,
            Img_url: req.body.Img_url || null
        };

        const { data: updatedEvent, error: updateError } = await db.supabase
            .from('events')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        
        if (updateError) throw updateError;

        // Actualizar tags si se proporcionan
        if (Array.isArray(tags)) {
            // Eliminar tags existentes
            const { error: deleteTagsError } = await db.supabase
                .from('event_tags')
                .delete()
                .eq('id_event', id);
            
            if (deleteTagsError) throw deleteTagsError;

            // Insertar nuevos tags
            if (tags.length > 0) {
                const tagData = tags.map(tagId => ({
                    id_event: id,
                    id_tag: tagId
                }));

                const { error: insertTagsError } = await db.supabase
                    .from('event_tags')
                    .insert(tagData);
                
                if (insertTagsError) throw insertTagsError;
            }
        }

        res.status(200).json(updatedEvent);
    } catch (err) {
        console.error('Error updating event:', err);
        res.status(500).json({ message: "Database error" });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    const eventId = req.params.id;
    try {
        // Verificar que el evento existe
        const { data: event, error: eventError } = await db.supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();
        
        if (eventError || !event) {
            return res.status(404).json({ message: "El evento no existe." });
        }
        
        // Verificar propiedad del evento usando el campo creator_id
        const eventCreatorId = Number(event.creator_id);
        const userId = Number(req.user.id);
        
        if (eventCreatorId !== userId) {
            return res.status(403).json({ 
                message: "El evento no pertenece al usuario autenticado."
            });
        }

        // Eliminar automáticamente todos los usuarios inscritos
        const { error: enrollmentsDeleteError } = await db.supabase
            .from('event_enrollments')
            .delete()
            .eq('id_event', eventId);
        
        if (enrollmentsDeleteError) {
            return res.status(500).json({ message: "Error al eliminar las inscripciones del evento." });
        }

        // Eliminar tags del evento
        const { error: tagError } = await db.supabase
            .from('event_tags')
            .delete()
            .eq('id_event', eventId);
        
        if (tagError) throw tagError;

        // Eliminar el evento
        const { data: deletedEvent, error: deleteError } = await db.supabase
            .from('events')
            .delete()
            .eq('id', eventId)
            .select()
            .single();
        
        if (deleteError) throw deleteError;
        
        res.status(200).json(deletedEvent);
    } catch (err) {
        console.error('Error deleting event:', err);
        res.status(500).json({ message: "Database error" });
    }
});

router.post('/:id/enrollment', authenticateToken, async (req, res) => {
    const eventId = req.params.id;
    const userId = req.user.id;

    try {
        const { data: event, error: eventError } = await db.supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();
        if (eventError || !event) {
            return res.status(404).json({ message: 'El evento no existe.' });
        }

        const { data: existing, error: existsError } = await db.supabase
            .from('event_enrollments')
            .select('id')
            .eq('id_event', eventId)
            .eq('id_user', userId);
        if (existsError) throw existsError;
        if (existing && existing.length > 0) {
            return res.status(400).json({ message: 'El usuario ya se encuentra registrado en el evento.' });
        }

        const { count, error: countError } = await db.supabase
            .from('event_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('id_event', eventId);
        if (countError) throw countError;
        if ((count || 0) >= (event.max_assistance || 0)) {
            return res.status(400).json({ message: 'Exceda la capacidad máxima de registrados al evento.' });
        }

        const eventDate = new Date(event.start_date);
        const now = new Date();
        const eventDateStr = eventDate.toISOString().slice(0, 10);
        const todayStr = now.toISOString().slice(0, 10);
        if (eventDateStr <= todayStr) {
            return res.status(400).json({ message: 'No puede registrarse a un evento que ya sucedió o es hoy.' });
        }

        if (event.enabled_for_enrollment === false) {
            return res.status(400).json({ message: 'El evento no está habilitado para la inscripción.' });
        }

        const { error: enrollError } = await db.supabase
            .from('event_enrollments')
            .insert({ id_event: eventId, id_user: userId, registration_date_time: new Date().toISOString() });
        if (enrollError) throw enrollError;

        res.status(201).json({ message: 'Inscripción exitosa.' });
    } catch (err) {
        console.error('Error en inscripción:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

router.delete('/:id/enrollment', authenticateToken, async (req, res) => {
    const eventId = req.params.id;
    const userId = req.user.id;

    try {
        const { data: event, error: eventError } = await db.supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();
        if (eventError || !event) {
            return res.status(404).json({ message: 'El evento no existe.' });
        }

        const { data: enrollment, error: enrollmentError } = await db.supabase
            .from('event_enrollments')
            .select('*')
            .eq('id_event', eventId)
            .eq('id_user', userId);
        if (enrollmentError) throw enrollmentError;
        if (!enrollment || enrollment.length === 0) {
            return res.status(400).json({ message: 'El usuario no se encuentra registrado al evento.' });
        }

        const eventDate = new Date(event.start_date);
        const now = new Date();
        const eventDateStr = eventDate.toISOString().slice(0, 10);
        const todayStr = now.toISOString().slice(0, 10);
        if (eventDateStr <= todayStr) {
            return res.status(400).json({ message: 'No puede removerse de un evento que ya sucedió o es hoy.' });
        }

        const { error: deleteError } = await db.supabase
            .from('event_enrollments')
            .delete()
            .eq('id_event', eventId)
            .eq('id_user', userId);
        if (deleteError) throw deleteError;

        res.status(200).json({ message: 'El usuario fue removido de la inscripción al evento.' });
    } catch (err) {
        console.error('Error al remover inscripción:', err);
        res.status(500).json({ message: 'Database error' });
    }
});

router.post('/:id/join', authenticateToken, async (req, res) => {
    const eventId = req.params.id;
    const userId = req.user.id;

    try {
        const alreadyEnrolled = await db.query(
            'SELECT 1 FROM event_enrollments WHERE id_event = $1 AND id_user = $2',
            [eventId, userId]
        );
        if (alreadyEnrolled.rows.length > 0) {
            return res.status(400).json({ message: "Ya estás inscripto en este evento." });
        }

        const eventRes = await db.query('SELECT capacidad FROM events WHERE id = $1', [eventId]);
        if (eventRes.rows.length === 0) {
            return res.status(404).json({ message: "Evento no encontrado." });
        }

        const currentEnrollments = await db.query(
            'SELECT COUNT(*)::int AS count FROM event_enrollments WHERE id_event = $1',
            [eventId]
        );

        if (currentEnrollments.rows[0].count >= eventRes.rows[0].capacidad) {
            return res.status(400).json({ message: "El evento está completo." });
        }

        await db.query(
            'INSERT INTO event_enrollments (id_event, id_user, registration_date_time) VALUES ($1, $2, NOW())',
            [eventId, userId]
        );

        res.status(201).json({ message: "Te has unido al evento exitosamente." });
    } catch (err) {
        res.status(500).json({ message: "Database error" });
    }
});

router.delete('/:id/leave', authenticateToken, async (req, res) => {
    const eventId = req.params.id;
    const userId = req.user.id;

    try {
        const enrollmentRes = await db.query(
            'SELECT 1 FROM event_enrollments WHERE id_event = $1 AND id_user = $2',
            [eventId, userId]
        );
        if (enrollmentRes.rows.length === 0) {
            return res.status(400).json({ message: "No estás inscripto en este evento." });
        }

        await db.query(
            'DELETE FROM event_enrollments WHERE id_event = $1 AND id_user = $2',
            [eventId, userId]
        );

        res.status(200).json({ message: "Has salido del evento exitosamente." });
    } catch (err) {
        res.status(500).json({ message: "Database error" });
    }
});

router.get('/:id/participants', async (req, res) => {
    const eventId = req.params.id;
    try {
        const { data: participants, error } = await db.supabase
            .from('event_enrollments')
            .select(`
                id_user,
                registration_date_time,
                users!event_enrollments_id_user_fkey(
                    id,
                    first_name,
                    last_name,
                    username
                )
            `)
            .eq('id_event', eventId)
            .order('registration_date_time', { ascending: true });

        if (error) throw error;

        const transformedParticipants = participants.map(p => ({
            id: p.id_user,
            registration_date: p.registration_date_time,
            user: p.users ? {
                id: p.users.id,
                first_name: p.users.first_name,
                last_name: p.users.last_name,
                username: p.users.username
            } : null
        }));

        res.json(transformedParticipants);
    } catch (err) {
        console.error('Error getting event participants:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;