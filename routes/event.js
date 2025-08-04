const express = require('express');
const router = express.Router();
const db = require('../db-supabase');
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No autenticado.' });
    }
    jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
        if (err) return res.status(401).json({ message: 'Token inválido.' });
        req.user = user;
        next();
    });
}

// GET /api/event - Listar eventos con filtros
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const { name, startdate, tag } = req.query;

        // Construir filtros para Supabase
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

        // Aplicar filtros
        if (name) {
            query = query.ilike('name', `%${name}%`);
        }
        if (startdate) {
            query = query.eq('start_date::date', startdate);
        }

        // Aplicar límite y offset
        query = query.range(offset, offset + limit - 1);
        query = query.order('start_date', { ascending: false });

        const { data: events, error } = await query;

        if (error) throw error;

        // Filtrar por tag si se especifica
        let filteredEvents = events;
        if (tag) {
            // Para filtrar por tag necesitamos hacer una consulta adicional
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

        // Transformar la respuesta
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

// GET /api/event/:id - Obtener evento específico
router.get('/:id', async (req, res) => {
    const eventId = req.params.id;
    try {
        // Obtener evento con todas sus relaciones
        const { data: event, error } = await db.supabase
            .from('events')
            .select(`
                *,
                event_categories(name),
                event_locations(
                    *,
                    locations(
                        *,
                        provinces(*)
                    ),
                    users!event_locations_id_creator_user_fkey(
                        id,
                        first_name,
                        last_name,
                        username
                    )
                ),
                users!events_id_creator_user_fkey(
                    id,
                    first_name,
                    last_name,
                    username
                ),
                event_tags(
                    tags(*)
                )
            `)
            .eq('id', eventId)
            .single();

        if (error || !event) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }

        // Transformar la respuesta
        const response = {
            id: event.id,
            name: event.name,
            description: event.description,
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

// POST /api/event/ - Crear evento
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
            tags // array de ids de tags opcional
        } = req.body;

        // Validaciones básicas
        if (!name || !description || !id_event_category || !id_event_location || !start_date) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        // Verificar que la ubicación del evento existe y tiene capacidad
        const { data: locationData, error: locationError } = await db.supabase
            .from('event_locations')
            .select('max_capacity')
            .eq('id', id_event_location)
            .single();

        if (locationError || !locationData) {
            return res.status(400).json({ error: 'Ubicación del evento no válida' });
        }

        // Crear el evento
        const eventData = {
            name,
            description,
            id_event_category,
            id_event_location,
            start_date,
            duration_in_minutes: duration_in_minutes || 0,
            price: price || 0,
            enabled_for_enrollment: enabled_for_enrollment !== undefined ? enabled_for_enrollment : true,
            max_assistance: max_assistance || locationData.max_capacity,
            id_creator_user: req.user.id
        };

        const { data: newEvent, error: eventError } = await db.supabase
            .from('events')
            .insert(eventData)
            .select()
            .single();

        if (eventError) throw eventError;

        // Agregar tags si se proporcionan
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
                // No fallamos la creación del evento si fallan los tags
            }
        }

        res.status(201).json(newEvent);
    } catch (err) {
        console.error('Error creating event:', err);
        res.status(500).json({ error: 'Error al crear evento' });
    }
});

// PUT /api/event/ (editar evento)
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
        tags // array de ids de tags opcional
    } = req.body;

    // Validaciones según especificación
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
        // Verificar existencia y propiedad del evento
        const eventRes = await db.query('SELECT * FROM events WHERE id = $1', [id]);
        if (eventRes.rows.length === 0) {
            return res.status(404).json({ message: "El evento no existe." });
        }
        const event = eventRes.rows[0];
        if (event.id_creator_user !== req.user.id) {
            return res.status(404).json({ message: "El evento no pertenece al usuario autenticado." });
        }

        // Validar max_assistance <= max_capacity del event_location
        const locRes = await db.query('SELECT max_capacity FROM event_locations WHERE id = $1', [id_event_location]);
        if (locRes.rows.length === 0) {
            return res.status(400).json({ message: "El id_event_location no existe." });
        }
        const max_capacity = parseInt(locRes.rows[0].max_capacity, 10);
        if (max_assistance > max_capacity) {
            return res.status(400).json({ message: "El max_assistance no puede ser mayor que el max_capacity del event_location." });
        }

        // Actualizar evento
        const updateSql = `
            UPDATE events
            SET nombre = $1, descripcion = $2, id_event_location = $3, fecha_evento = $4,
                duracion = $5, precio_entrada = $6, habilitado_inscripcion = $7, capacidad = $8
            WHERE id = $9
            RETURNING *
        `;
        const { rows } = await db.query(updateSql, [
            name.trim(),
            description.trim(),
            id_event_location,
            start_date,
            duration_in_minutes,
            price,
            enabled_for_enrollment,
            max_assistance,
            id
        ]);
        const updatedEvent = rows[0];

        // Actualizar tags si vienen
        if (Array.isArray(tags)) {
            await db.query('DELETE FROM event_tags WHERE id_event = $1', [id]);
            for (const tagId of tags) {
                await db.query(
                    'INSERT INTO event_tags (id_event, id_tag) VALUES ($1, $2)',
                    [id, tagId]
                );
            }
        }

        res.status(200).json(updatedEvent);
    } catch (err) {
        console.error('Error updating event:', err);
        res.status(500).json({ message: "Database error" });
    }
});

// DELETE /api/event/:id (eliminar evento)
router.delete('/:id', authenticateToken, async (req, res) => {
    const eventId = req.params.id;
    try {
        // Verificar existencia y propiedad del evento
        const eventRes = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
        if (eventRes.rows.length === 0) {
            return res.status(404).json({ message: "El evento no existe." });
        }
        const event = eventRes.rows[0];
        if (event.id_creator_user !== req.user.id) {
            return res.status(404).json({ message: "El evento no pertenece al usuario autenticado." });
        }

        // Verificar si hay usuarios inscriptos
        const enrollRes = await db.query('SELECT 1 FROM event_enrollments WHERE id_event = $1 LIMIT 1', [eventId]);
        if (enrollRes.rows.length > 0) {
            return res.status(400).json({ message: "No se puede eliminar el evento porque existen usuarios inscriptos." });
        }

        // Eliminar tags asociados
        await db.query('DELETE FROM event_tags WHERE id_event = $1', [eventId]);
        // Eliminar el evento
        const { rows: deletedRows } = await db.query('DELETE FROM events WHERE id = $1 RETURNING *', [eventId]);
        res.status(200).json(deletedRows[0]);
    } catch (err) {
        res.status(500).json({ message: "Database error" });
    }
});

// POST /api/event/:id/enrollment/ (inscribir usuario autenticado a un evento)
router.post('/:id/enrollment', authenticateToken, async (req, res) => {
    const eventId = req.params.id;
    const userId = req.user.id;

    try {
        // 1. Verificar existencia del evento
        const eventRes = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
        if (eventRes.rows.length === 0) {
            return res.status(404).json({ message: "El evento no existe." });
        }
        const event = eventRes.rows[0];

        // 2. Verificar si el usuario ya está inscripto
        const alreadyEnrolled = await db.query(
            'SELECT 1 FROM event_enrollments WHERE id_event = $1 AND id_user = $2',
            [eventId, userId]
        );
        if (alreadyEnrolled.rows.length > 0) {
            return res.status(400).json({ message: "El usuario ya se encuentra registrado en el evento." });
        }

        // 3. Verificar capacidad máxima (max_assistance)
        const countRes = await db.query(
            'SELECT COUNT(*)::int AS count FROM event_enrollments WHERE id_event = $1',
            [eventId]
        );
        if (countRes.rows[0].count >= event.capacidad) {
            return res.status(400).json({ message: "Exceda la capacidad máxima de registrados al evento." });
        }

        // 4. Verificar fecha del evento (no puede ser hoy ni pasada)
        const eventDate = new Date(event.fecha_evento);
        const now = new Date();
        // Comparar solo fechas (sin hora)
        const eventDateStr = eventDate.toISOString().slice(0, 10);
        const todayStr = now.toISOString().slice(0, 10);
        if (eventDateStr <= todayStr) {
            return res.status(400).json({ message: "No puede registrarse a un evento que ya sucedió o es hoy." });
        }

        // 5. Verificar habilitado para inscripción (enabled_for_enrollment)
        if (!event.habilitado_inscripcion) {
            return res.status(400).json({ message: "El evento no está habilitado para la inscripción." });
        }

        // 6. Registrar inscripción con fecha y hora actual
        await db.query(
            `INSERT INTO event_enrollments (id_event, id_user, registration_date_time)
             VALUES ($1, $2, NOW())`,
            [eventId, userId]
        );

        res.status(201).json({ message: "Inscripción exitosa." });
    } catch (err) {
        console.error('Error en inscripción:', err);
        res.status(500).json({ message: "Database error" });
    }
});

// DELETE /api/event/:id/enrollment/ (remover inscripción del usuario autenticado)
router.delete('/:id/enrollment', authenticateToken, async (req, res) => {
    const eventId = req.params.id;
    const userId = req.user.id;

    try {
        // 1. Verificar existencia del evento
        const eventRes = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
        if (eventRes.rows.length === 0) {
            return res.status(404).json({ message: "El evento no existe." });
        }
        const event = eventRes.rows[0];

        // 2. Verificar si el usuario está inscripto
        const enrollmentRes = await db.query(
            'SELECT * FROM event_enrollments WHERE id_event = $1 AND id_user = $2',
            [eventId, userId]
        );
        if (enrollmentRes.rows.length === 0) {
            return res.status(400).json({ message: "El usuario no se encuentra registrado al evento." });
        }

        // 3. Verificar fecha del evento (no puede ser hoy ni pasada)
        const eventDate = new Date(event.fecha_evento);
        const now = new Date();
        const eventDateStr = eventDate.toISOString().slice(0, 10);
        const todayStr = now.toISOString().slice(0, 10);
        if (eventDateStr <= todayStr) {
            return res.status(400).json({ message: "No puede removerse de un evento que ya sucedió o es hoy." });
        }

        // 4. Remover inscripción
        await db.query(
            'DELETE FROM event_enrollments WHERE id_event = $1 AND id_user = $2',
            [eventId, userId]
        );

        res.status(200).json({ message: "El usuario fue removido de la inscripción al evento." });
    } catch (err) {
        console.error('Error al remover inscripción:', err);
        res.status(500).json({ message: "Database error" });
    }
});

// GET /api/event/tags - obtener todos los tags
router.get('/tags', async (req, res) => {
    try {
        const { rows: tags } = await db.query('SELECT * FROM tags ORDER BY name');
        res.json(tags);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

// POST /api/event/:id/join - unirse a un evento
router.post('/:id/join', authenticateToken, async (req, res) => {
    const eventId = req.params.id;
    const userId = req.user.id;

    try {
        // Verificar si el usuario ya está inscripto
        const alreadyEnrolled = await db.query(
            'SELECT 1 FROM event_enrollments WHERE id_event = $1 AND id_user = $2',
            [eventId, userId]
        );
        if (alreadyEnrolled.rows.length > 0) {
            return res.status(400).json({ message: "Ya estás inscripto en este evento." });
        }

        // Verificar capacidad del evento
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

        // Inscribir al usuario
        await db.query(
            'INSERT INTO event_enrollments (id_event, id_user, registration_date_time) VALUES ($1, $2, NOW())',
            [eventId, userId]
        );

        res.status(201).json({ message: "Te has unido al evento exitosamente." });
    } catch (err) {
        res.status(500).json({ message: "Database error" });
    }
});

// DELETE /api/event/:id/leave - salir de un evento
router.delete('/:id/leave', authenticateToken, async (req, res) => {
    const eventId = req.params.id;
    const userId = req.user.id;

    try {
        // Verificar si el usuario está inscripto
        const enrollmentRes = await db.query(
            'SELECT 1 FROM event_enrollments WHERE id_event = $1 AND id_user = $2',
            [eventId, userId]
        );
        if (enrollmentRes.rows.length === 0) {
            return res.status(400).json({ message: "No estás inscripto en este evento." });
        }

        // Remover inscripción
        await db.query(
            'DELETE FROM event_enrollments WHERE id_event = $1 AND id_user = $2',
            [eventId, userId]
        );

        res.status(200).json({ message: "Has salido del evento exitosamente." });
    } catch (err) {
        res.status(500).json({ message: "Database error" });
    }
});

module.exports = router;