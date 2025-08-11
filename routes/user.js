const express = require('express');
const router = express.Router();
const db = require('../db-supabase');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(username)) {
        return res.status(400).json({
            success: false,
            message: "El email es invalido.",
            token: ""
        });
    }
    try {
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
        const token = jwt.sign(
            {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                username: user.username
            },
            process.env.JWT_SECRET || 'secret', 
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

router.get('/me/events/created', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const result = await db.getUserCreatedEvents(userId);
        
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
            tags: [] 
        }));
        
        res.json(transformedEvents);
    } catch (error) {
        console.error('Error getting user created events:', error);
        res.status(500).json({ error: 'Error al obtener eventos creados' });
    }
});

router.get('/me/events/joined', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const result = await db.getUserJoinedEvents(userId);
        
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
                tags: [] 
            };
        });
        
        res.json(transformedEvents);
    } catch (error) {
        console.error('Error getting user joined events:', error);
        res.status(500).json({ error: 'Error al obtener eventos unidos' });
    }
});

router.post('/register', async (req, res) => {
    const { first_name, last_name, username, password } = req.body;

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
        const { data: existingUser, error: checkError } = await db.supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .single();
        
        if (existingUser) {
            return res.status(400).json({ message: "El usuario ya existe." });
        }
        
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
