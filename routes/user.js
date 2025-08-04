const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');

// POST /api/user/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    // Validar sintaxis de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username)) {
        return res.status(400).json({
            success: false,
            message: "El email es invalido.",
            token: ""
        });
    }
    try {
        // Buscar usuario por username
        const sql = `
            SELECT * FROM users WHERE username = $1
        `;
        const { rows } = await db.query(sql, [username]);
        if (rows.length === 0 || rows[0].password !== password) {
            return res.status(401).json({
                success: false,
                message: "Usuario o clave inválida.",
                token: ""
            });
        }
        const user = rows[0];
        // Generar token JWT
        const token = jwt.sign(
            {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                username: user.username
            },
            process.env.JWT_SECRET || 'secret', // Usa variable de entorno en producción
            { expiresIn: '1d' }
        );
        res.json({
            success: true,
            message: '',
            token
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// GET /api/users/me/events/created - Obtener eventos creados por el usuario
router.get('/me/events/created', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const result = await db.query(`
            SELECT 
                e.id,
                e.name,
                e.description,
                e.start_date,
                e.duration_in_minutes,
                e.price,
                e.enabled_for_enrollment,
                e.max_assistance,
                el.name as location_name,
                el.full_address as location_address,
                el.latitude as location_latitude,
                el.longitude as location_longitude,
                ARRAY_AGG(t.name) FILTER (WHERE t.name IS NOT NULL) as tags
            FROM events e
            LEFT JOIN event_locations el ON e.id_event_location = el.id
            LEFT JOIN event_tags et ON e.id = et.id_event
            LEFT JOIN tags t ON et.id_tag = t.id
            WHERE e.id_creator_user = $1
            GROUP BY e.id, el.name, el.full_address, el.latitude, el.longitude
            ORDER BY e.start_date DESC
        `, [userId]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting user created events:', error);
        res.status(500).json({ error: 'Error al obtener eventos creados' });
    }
});

// GET /api/users/me/events/joined - Obtener eventos a los que se unió el usuario
router.get('/me/events/joined', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const result = await db.query(`
            SELECT 
                e.id,
                e.name,
                e.description,
                e.start_date,
                e.duration_in_minutes,
                e.price,
                e.enabled_for_enrollment,
                e.max_assistance,
                el.name as location_name,
                el.full_address as location_address,
                el.latitude as location_latitude,
                el.longitude as location_longitude,
                u.username as creator_username,
                u.first_name as creator_first_name,
                u.last_name as creator_last_name,
                ARRAY_AGG(t.name) FILTER (WHERE t.name IS NOT NULL) as tags
            FROM event_enrollments ee
            JOIN events e ON ee.id_event = e.id
            LEFT JOIN event_locations el ON e.id_event_location = el.id
            LEFT JOIN users u ON e.id_creator_user = u.id
            LEFT JOIN event_tags et ON e.id = et.id_event
            LEFT JOIN tags t ON et.id_tag = t.id
            WHERE ee.id_user = $1
            GROUP BY e.id, el.name, el.full_address, el.latitude, el.longitude, u.username, u.first_name, u.last_name
            ORDER BY e.start_date DESC
        `, [userId]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting user joined events:', error);
        res.status(500).json({ error: 'Error al obtener eventos unidos' });
    }
});

// POST /api/user/register
router.post('/register', async (req, res) => {
    const { first_name, last_name, username, password } = req.body;

    // Validaciones
    if (!first_name || first_name.length < 3) {
        return res.status(400).json({ message: "El campo first_name es obligatorio y debe tener al menos 3 letras." });
    }
    if (!last_name || last_name.length < 3) {
        return res.status(400).json({ message: "El campo last_name es obligatorio y debe tener al menos 3 letras." });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username)) {
        return res.status(400).json({ message: "El email es invalido." });
    }
    if (!password || password.length < 3) {
        return res.status(400).json({ message: "El campo password es obligatorio y debe tener al menos 3 letras." });
    }

    try {
        // Verificar si el usuario ya existe
        const exists = await db.query('SELECT id FROM users WHERE username = $1', [username]);
        if (exists.rows.length > 0) {
            return res.status(400).json({ message: "El usuario ya existe." });
        }
        // Insertar usuario
        const insertSql = `
            INSERT INTO users (first_name, last_name, username, password)
            VALUES ($1, $2, $3, $4)
            RETURNING id, first_name, last_name, username
        `;
        const { rows } = await db.query(insertSql, [first_name, last_name, username, password]);
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: "Database error" });
    }
});

module.exports = router;
