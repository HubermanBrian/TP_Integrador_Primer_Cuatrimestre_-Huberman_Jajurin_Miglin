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

router.get('/', authenticateToken, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    try {
        const { rows } = await db.query(
            `SELECT * FROM event_locations WHERE id_creator_user = $1 ORDER BY id LIMIT $2 OFFSET $3`,
            [req.user.id, limit, offset]
        );
        res.status(200).json(rows);
    } catch (err) {
        console.error('Error getting event locations:', err);
        res.status(500).json({ message: "Database error" });
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;
    try {
        const { rows } = await db.query(
            `SELECT * FROM event_locations WHERE id = $1 AND id_creator_user = $2`,
            [id, req.user.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: "La event-location no existe o no pertenece al usuario autenticado." });
        }
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error('Error getting event location by id:', err);
        res.status(500).json({ message: "Database error" });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    const {
        id_location,
        name,
        full_address,
        max_capacity,
        latitude,
        longitude
    } = req.body;

    if (!name || name.trim().length < 3) {
        return res.status(400).json({ message: "El campo name es obligatorio y debe tener al menos 3 letras." });
    }
    if (!full_address || full_address.trim().length < 3) {
        return res.status(400).json({ message: "El campo full_address es obligatorio y debe tener al menos 3 letras." });
    }
    if (!id_location) {
        return res.status(400).json({ message: "El campo id_location es obligatorio." });
    }
    if (typeof max_capacity !== 'number' || max_capacity <= 0) {
        return res.status(400).json({ message: "El campo max_capacity debe ser un número mayor a cero." });
    }

    try {
        const locRes = await db.query('SELECT id FROM locations WHERE id = $1', [id_location]);
        if (locRes.rows.length === 0) {
            return res.status(400).json({ message: "El id_location no existe." });
        }

        const insertSql = `
            INSERT INTO event_locations
            (id_location, nombre, direccion_completa, capacidad_maxima, latitud, longitud, id_creator_user)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const { rows } = await db.query(insertSql, [
            id_location,
            name.trim(),
            full_address.trim(),
            max_capacity,
            latitude,
            longitude,
            req.user.id
        ]);
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error creating event location:', err);
        res.status(500).json({ message: "Database error" });
    }
});

router.put('/', authenticateToken, async (req, res) => {
    const {
        id,
        id_location,
        name,
        full_address,
        max_capacity,
        latitude,
        longitude
    } = req.body;

    if (!id) {
        return res.status(400).json({ message: "El campo id es obligatorio." });
    }
    if (!name || name.trim().length < 3) {
        return res.status(400).json({ message: "El campo name es obligatorio y debe tener al menos 3 letras." });
    }
    if (!full_address || full_address.trim().length < 3) {
        return res.status(400).json({ message: "El campo full_address es obligatorio y debe tener al menos 3 letras." });
    }
    if (!id_location) {
        return res.status(400).json({ message: "El campo id_location es obligatorio." });
    }
    if (typeof max_capacity !== 'number' || max_capacity <= 0) {
        return res.status(400).json({ message: "El campo max_capacity debe ser un número mayor a cero." });
    }

    try {
        const eventLocationRes = await db.query('SELECT * FROM event_locations WHERE id = $1', [id]);
        if (eventLocationRes.rows.length === 0) {
            return res.status(404).json({ message: "La event-location no existe." });
        }
        const eventLocation = eventLocationRes.rows[0];
        if (eventLocation.id_creator_user !== req.user.id) {
            return res.status(404).json({ message: "La event-location no pertenece al usuario autenticado." });
        }

        const locRes = await db.query('SELECT id FROM locations WHERE id = $1', [id_location]);
        if (locRes.rows.length === 0) {
            return res.status(400).json({ message: "El id_location no existe." });
        }

        const updateSql = `
            UPDATE event_locations
            SET id_location = $1, nombre = $2, direccion_completa = $3, capacidad_maxima = $4, latitud = $5, longitud = $6
            WHERE id = $7
            RETURNING *
        `;
        const { rows } = await db.query(updateSql, [
            id_location,
            name.trim(),
            full_address.trim(),
            max_capacity,
            latitude,
            longitude,
            id
        ]);
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error('Error updating event location:', err);
        res.status(500).json({ message: "Database error" });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    const eventLocationId = req.params.id;
    try {
        const eventLocationRes = await db.query('SELECT * FROM event_locations WHERE id = $1', [eventLocationId]);
        if (eventLocationRes.rows.length === 0) {
            return res.status(404).json({ message: "La event-location no existe." });
        }
        const eventLocation = eventLocationRes.rows[0];
        if (eventLocation.id_creator_user !== req.user.id) {
            return res.status(404).json({ message: "La event-location no pertenece al usuario autenticado." });
        }

        const eventsRes = await db.query('SELECT 1 FROM events WHERE id_event_location = $1 LIMIT 1', [eventLocationId]);
        if (eventsRes.rows.length > 0) {
            return res.status(400).json({ message: "No se puede eliminar la event-location porque existen eventos asociados." });
        }

        const { rows: deletedRows } = await db.query('DELETE FROM event_locations WHERE id = $1 RETURNING *', [eventLocationId]);
        res.status(200).json(deletedRows[0]);
    } catch (err) {
        console.error('Error deleting event location:', err);
        res.status(500).json({ message: "Database error" });
    }
});

module.exports = router;
