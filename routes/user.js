const express = require('express');
const router = express.Router();
const db = require('../db-supabase');
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
        const { data, error } = await db.supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();
        
        if (error || !data || data.password !== password) {
            return res.status(401).json({
                success: false,
                message: "Usuario o clave inválida.",
                token: ""
            });
        }
        
        const user = data;
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
        
        const result = await db.getUserCreatedEvents(userId);
        
        // Transformar la estructura de datos
        const transformedEvents = result.rows.map(event => ({
            id: event.id,
            name: event.name,
            description: event.description,
            start_date: event.start_date,
            duration_in_minutes: event.duration_in_minutes,
            price: event.price,
            enabled_for_enrollment: event.enabled_for_enrollment,
            max_assistance: event.max_assistance,
            location_name: event.event_locations ? event.event_locations.name : null,
            location_address: event.event_locations ? event.event_locations.full_address : null,
            location_latitude: event.event_locations ? event.event_locations.latitude : null,
            location_longitude: event.event_locations ? event.event_locations.longitude : null,
            tags: [] // Los tags se pueden agregar después si es necesario
        }));
        
        res.json(transformedEvents);
    } catch (error) {
        console.error('Error getting user created events:', error);
        res.status(500).json({ error: 'Error al obtener eventos creados' });
    }
});

// GET /api/users/me/events/joined - Obtener eventos a los que se unió el usuario
router.get('/me/events/joined', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const result = await db.getUserJoinedEvents(userId);
        
        // Transformar la estructura de datos
        const transformedEvents = result.rows.map(enrollment => {
            const event = enrollment.events;
            return {
                id: event.id,
                name: event.name,
                description: event.description,
                start_date: event.start_date,
                duration_in_minutes: event.duration_in_minutes,
                price: event.price,
                enabled_for_enrollment: event.enabled_for_enrollment,
                max_assistance: event.max_assistance,
                location_name: event.event_locations ? event.event_locations.name : null,
                location_address: event.event_locations ? event.event_locations.full_address : null,
                location_latitude: event.event_locations ? event.event_locations.latitude : null,
                location_longitude: event.event_locations ? event.event_locations.longitude : null,
                creator_username: event.users ? event.users.username : null,
                creator_first_name: event.users ? event.users.first_name : null,
                creator_last_name: event.users ? event.users.last_name : null,
                tags: [] // Los tags se pueden agregar después si es necesario
            };
        });
        
        res.json(transformedEvents);
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
        const { data: existingUser, error: checkError } = await db.supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .single();
        
        if (existingUser) {
            return res.status(400).json({ message: "El usuario ya existe." });
        }
        
        // Insertar usuario
        const result = await db.insert('users', {
            first_name,
            last_name,
            username,
            password
        });
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: "Database error" });
    }
});

module.exports = router;
