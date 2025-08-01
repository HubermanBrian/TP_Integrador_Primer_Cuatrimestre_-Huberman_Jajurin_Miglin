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

// GET /api/event-location (paginado, solo del usuario autenticado)
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
        res.status(500).json({ message: "Database error" });
    }
});

// GET /api/event-location/:id (solo si es del usuario autenticado)
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
        res.status(500).json({ message: "Database error" });
    }
});

// POST /api/event-location/ (crear event_location)
router.post('/', authenticateToken, async (req, res) => {
    const {
        id_location,
        name,
        full_address,
        max_capacity,
        latitude,
        longitude
    } = req.body;

    // Validaciones
    if (!name || name.length < 3) {
        return res.status(400).json({ message: "El campo name es obligatorio y debe tener al menos 3 letras." });
    }
    if (!full_address || full_address.length < 3) {
        return res.status(400).json({ message: "El campo full_address es obligatorio y debe tener al menos 3 letras." });
    }
    if (!id_location) {
        return res.status(400).json({ message: "El campo id_location es obligatorio." });
    }
    if (typeof max_capacity !== 'number' || max_capacity <= 0) {
        return res.status(400).json({ message: "El campo max_capacity debe ser un número mayor a cero." });
    }

    try {
        // Verificar existencia de la localidad
        const locRes = await db.query('SELECT id FROM locations WHERE id = $1', [id_location]);
        if (locRes.rows.length === 0) {
            return res.status(400).json({ message: "El id_location no existe." });
        }

        // Insertar event_location
        const insertSql = `
            INSERT INTO event_locations
            (id_location, name, full_address, max_capacity, latitude, longitude, id_creator_user)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const { rows } = await db.query(insertSql, [
            id_location,
            name,
            full_address,
            max_capacity,
            latitude,
            longitude,
            req.user.id
        ]);
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: "Database error" });
    }
});

module.exports = router;
