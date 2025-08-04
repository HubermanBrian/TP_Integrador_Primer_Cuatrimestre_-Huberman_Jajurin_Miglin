const express = require('express');
const router = express.Router();
const db = require('../db');
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

router.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { name, startdate, tag } = req.query;
    let whereClauses = [];
    let params = [];
    let paramIdx = 1;

    if (name) {
        whereClauses.push(`LOWER(nombre) LIKE $${paramIdx++}`);
        params.push(`%${name.toLowerCase()}%`);
    }
    if (startdate) {
        whereClauses.push(`fecha_evento::date = $${paramIdx++}`);
        params.push(startdate);
    }
    if (tag) {
        whereClauses.push(`id IN (
            SELECT e.id
            FROM events e
            JOIN event_tags et ON et.id_event = e.id
            JOIN tags t ON t.id = et.id_tag
            WHERE LOWER(t.name) = $${paramIdx++}
        )`);
        params.push(tag.toLowerCase());
    }

    let whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `
        SELECT *
        FROM events
        ${whereSQL}
        ORDER BY fecha_evento DESC
        LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;
    params.push(limit, offset);

    try {
        const { rows: events } = await db.query(sql, params);
        res.json(events);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

router.get('/:id', async (req, res) => {
    const eventId = req.params.id;
    try {
        const eventSql = `
            SELECT *
            FROM events
            WHERE id = $1
        `;
        const { rows: eventRows } = await db.query(eventSql, [eventId]);
        if (eventRows.length === 0) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }
        const event = eventRows[0];

        const eventLocationSql = `
            SELECT *
            FROM event_locations
            WHERE id = $1
        `;
        const { rows: eventLocationRows } = await db.query(eventLocationSql, [event.id_event_location]);
        const eventLocation = eventLocationRows[0] || null;

        let location = null;
        let province = null;
        if (eventLocation && eventLocation.id_location) {
            const locationSql = `SELECT * FROM locations WHERE id = $1`;
            const { rows: locationRows } = await db.query(locationSql, [eventLocation.id_location]);
            location = locationRows[0] || null;

            if (location && location.id_province) {
                const provinceSql = `SELECT * FROM provinces WHERE id = $1`;
                const { rows: provinceRows } = await db.query(provinceSql, [location.id_province]);
                province = provinceRows[0] || null;
            }
        }

        const userSql = `SELECT * FROM users WHERE id = $1`;
        const { rows: userRows } = await db.query(userSql, [event.id_creator_user]);
        const creatorUser = userRows[0] || null;

        // Obtener tags
        const tagsSql = `
            SELECT t.id, t.name
            FROM tags t
            JOIN event_tags et ON et.id_tag = t.id
            WHERE et.id_event = $1
        `;
        const { rows: tags } = await db.query(tagsSql, [eventId]);

        // Obtener usuario creador de la ubicación del evento
        let eventLocationCreatorUser = null;
        if (eventLocation && eventLocation.id_creator_user) {
            const { rows: elUserRows } = await db.query(userSql, [eventLocation.id_creator_user]);
            eventLocationCreatorUser = elUserRows[0] || null;
        }

        // Armar respuesta según especificación
        const response = {
            id: event.id,
            name: event.nombre,
            description: event.descripcion,
            id_event_location: event.id_event_location,
            start_date: event.fecha_evento,
            duration_in_minutes: event.duracion,
            price: event.precio_entrada,
            enabled_for_enrollment: event.habilitado_inscripcion,
            max_assistance: event.capacidad,
            id_creator_user: event.id_creator_user,
            event_location: eventLocation ? {
                id: eventLocation.id,
                id_location: eventLocation.id_location,
                name: eventLocation.nombre,
                full_address: eventLocation.direccion_completa,
                max_capacity: eventLocation.capacidad_maxima,
                latitude: eventLocation.latitud,
                longitude: eventLocation.longitud,
                id_creator_user: eventLocation.id_creator_user,
                location: location ? {
                    id: location.id,
                    name: location.nombre,
                    id_province: location.id_province,
                    latitude: location.latitud,
                    longitude: location.longitud,
                    province: province ? {
                        id: province.id,
                        name: province.nombre,
                        full_name: province.nombre_completo,
                        latitude: province.latitud,
                        longitude: province.longitud,
                        display_order: province.orden_visualizacion
                    } : null
                } : null,
                creator_user: eventLocationCreatorUser ? {
                    id: eventLocationCreatorUser.id,
                    first_name: eventLocationCreatorUser.nombre,
                    last_name: eventLocationCreatorUser.apellido,
                    username: eventLocationCreatorUser.username,
                    password: "******"
                } : null
            } : null,
            tags: tags.map(tag => ({
                id: tag.id,
                name: tag.name
            })),
            creator_user: creatorUser ? {
                id: creatorUser.id,
                first_name: creatorUser.nombre,
                last_name: creatorUser.apellido,
                username: creatorUser.username,
                password: "******"
            } : null
        };

        res.json(response);
    } catch (err) {
        console.error('Error getting event details:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// POST /api/event/ (crear evento)
router.post('/', authenticateToken, async (req, res) => {
    const {
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
        // Validar max_assistance <= max_capacity del event_location
        const locRes = await db.query('SELECT max_capacity FROM event_locations WHERE id = $1', [id_event_location]);
        if (locRes.rows.length === 0) {
            return res.status(400).json({ message: "El id_event_location no existe." });
        }
        const max_capacity = parseInt(locRes.rows[0].max_capacity, 10);
        if (max_assistance > max_capacity) {
            return res.status(400).json({ message: "El max_assistance no puede ser mayor que el max_capacity del event_location." });
        }

        // Insertar evento
        const insertSql = `
            INSERT INTO events
            (nombre, descripcion, id_event_location, fecha_evento, duracion, precio_entrada, habilitado_inscripcion, capacidad, id_creator_user)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;
        const { rows } = await db.query(insertSql, [
            name.trim(),
            description.trim(),
            id_event_location,
            start_date,
            duration_in_minutes,
            price,
            enabled_for_enrollment,
            max_assistance,
            req.user.id
        ]);
        const event = rows[0];

        // Insertar tags si vienen
        if (Array.isArray(tags) && tags.length > 0) {
            for (const tagId of tags) {
                await db.query(
                    'INSERT INTO event_tags (id_event, id_tag) VALUES ($1, $2)',
                    [event.id, tagId]
                );
            }
        }

        res.status(201).json(event);
    } catch (err) {
        console.error('Error creating event:', err);
        res.status(500).json({ message: "Database error" });
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