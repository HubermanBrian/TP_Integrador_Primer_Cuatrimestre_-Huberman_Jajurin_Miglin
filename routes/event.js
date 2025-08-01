const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

// Middleware de autenticación
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

// GET /api/event/
router.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Filtros de búsqueda
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
        // Buscar eventos que tengan el tag indicado (por nombre de tag)
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

    // Consulta principal con paginación
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

// GET /api/event/:id
router.get('/:id', async (req, res) => {
    const eventId = req.params.id;
    try {
        // Obtener el evento y su ubicación
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

        // Obtener event_location
        const eventLocationSql = `
            SELECT *
            FROM event_locations
            WHERE id = $1
        `;
        const { rows: eventLocationRows } = await db.query(eventLocationSql, [event.id_event_location]);
        const eventLocation = eventLocationRows[0] || null;

        // Obtener location (localidad)
        let location = null;
        let province = null;
        if (eventLocation && eventLocation.id_location) {
            const locationSql = `SELECT * FROM locations WHERE id = $1`;
            const { rows: locationRows } = await db.query(locationSql, [eventLocation.id_location]);
            location = locationRows[0] || null;

            // Obtener provincia
            if (location && location.id_province) {
                const provinceSql = `SELECT * FROM provinces WHERE id = $1`;
                const { rows: provinceRows } = await db.query(provinceSql, [location.id_province]);
                province = provinceRows[0] || null;
            }
        }

        // Obtener usuario creador
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

        // Armar respuesta
        res.json({
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
            event_location: eventLocation && {
                ...eventLocation,
                location: location && {
                    ...location,
                    province: province || undefined
                },
                creator_user: eventLocationCreatorUser || undefined
            },
            tags: tags,
            creator_user: creatorUser || undefined
        });
    } catch (err) {
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

    // Validaciones
    if (!name || name.length < 3) {
        return res.status(400).json({ message: "El campo name es obligatorio y debe tener al menos 3 letras." });
    }
    if (!description || description.length < 3) {
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

    // Validar max_assistance <= max_capacity del event_location
    try {
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
            (name, description, id_event_location, start_date, duration_in_minutes, price, habilitado_inscripcion, capacidad, id_creator_user)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;
        const { rows } = await db.query(insertSql, [
            name,
            description,
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

    // Validaciones
    if (!id) {
        return res.status(400).json({ message: "El campo id es obligatorio." });
    }
    if (!name || name.length < 3) {
        return res.status(400).json({ message: "El campo name es obligatorio y debe tener al menos 3 letras." });
    }
    if (!description || description.length < 3) {
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
            SET name = $1, description = $2, id_event_location = $3, start_date = $4,
                duration_in_minutes = $5, price = $6, habilitado_inscripcion = $7, capacidad = $8
            WHERE id = $9
            RETURNING *
        `;
        const { rows } = await db.query(updateSql, [
            name,
            description,
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

        // 3. Verificar capacidad máxima
        const countRes = await db.query(
            'SELECT COUNT(*)::int AS count FROM event_enrollments WHERE id_event = $1',
            [eventId]
        );
        if (countRes.rows[0].count >= event.capacidad) {
            return res.status(400).json({ message: "Exceda la capacidad máxima de registrados al evento." });
        }

        // 4. Verificar fecha del evento (no puede ser hoy ni pasada)
        const eventDate = new Date(event.fecha_evento || event.start_date);
        const now = new Date();
        // Comparar solo fechas (sin hora)
        const eventDateStr = eventDate.toISOString().slice(0, 10);
        const todayStr = now.toISOString().slice(0, 10);
        if (eventDateStr <= todayStr) {
            return res.status(400).json({ message: "No puede registrarse a un evento que ya sucedió o es hoy." });
        }

        // 5. Verificar habilitado para inscripción
        if (!event.habilitado_inscripcion && !event.enabled_for_enrollment) {
            return res.status(400).json({ message: "El evento no está habilitado para la inscripción." });
        }

        // 6. Registrar inscripción
        await db.query(
            `INSERT INTO event_enrollments (id_event, id_user, registration_date_time)
             VALUES ($1, $2, NOW())`,
            [eventId, userId]
        );

        res.status(201).json({ message: "Inscripción exitosa." });
    } catch (err) {
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
        const eventDate = new Date(event.fecha_evento || event.start_date);
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
        res.status(500).json({ message: "Database error" });
    }
});

module.exports = router;