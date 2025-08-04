const express = require('express');
const router = express.Router();
const { supabase, insert, select } = require('../db-supabase');
const bcrypt = require('bcrypt');

// Función para validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// POST /api/user/register
router.post('/register', async (req, res) => {
    const { first_name, last_name, username, password } = req.body;

    // Validaciones según especificación
    if (!first_name || first_name.trim().length < 3) {
        return res.status(400).json({ 
            success: false, 
            message: "El campo first_name debe tener al menos 3 letras.",
            token: ""
        });
    }

    if (!last_name || last_name.trim().length < 3) {
        return res.status(400).json({ 
            success: false, 
            message: "El campo last_name debe tener al menos 3 letras.",
            token: ""
        });
    }

    if (!username || !isValidEmail(username)) {
        return res.status(400).json({ 
            success: false, 
            message: "El email es invalido.",
            token: ""
        });
    }

    if (!password || password.length < 3) {
        return res.status(400).json({ 
            success: false, 
            message: "El campo password debe tener al menos 3 letras.",
            token: ""
        });
    }

    try {
        // Verificar si el usuario ya existe
        const existingUser = await select('users', 'id', { username });
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: "El usuario ya existe.",
                token: ""
            });
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar nuevo usuario usando Supabase
        const { data: newUser, error } = await supabase
            .from('users')
            .insert({
                first_name: first_name.trim(),
                last_name: last_name.trim(),
                username,
                password: hashedPassword
            })
            .select('id, first_name, last_name, username')
            .single();

        if (error) {
            console.error('Error al insertar usuario:', error);
            return res.status(500).json({ 
                success: false, 
                message: "Error interno del servidor",
                token: ""
            });
        }

        res.status(201).json({
            success: true,
            message: "Usuario registrado exitosamente",
            user: {
                id: newUser.id,
                first_name: newUser.first_name,
                last_name: newUser.last_name,
                username: newUser.username
            }
        });

    } catch (err) {
        console.error('Error en registro:', err);
        res.status(500).json({ 
            success: false, 
            message: "Error interno del servidor",
            token: ""
        });
    }
});

// POST /api/user/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Validar que se proporcionen los campos
    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            message: "Username y password son requeridos.",
            token: ""
        });
    }

    // Validar formato de email
    if (!isValidEmail(username)) {
        return res.status(400).json({ 
            success: false, 
            message: "El email es invalido.",
            token: ""
        });
    }

    try {
        // Buscar usuario por username usando Supabase
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .limit(1);

        if (error) {
            console.error('Error al buscar usuario:', error);
            return res.status(500).json({ 
                success: false, 
                message: "Error interno del servidor",
                token: ""
            });
        }

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: "Usuario o clave inválida.",
                token: ""
            });
        }

        const user = users[0];

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ 
                success: false, 
                message: "Usuario o clave inválida.",
                token: ""
            });
        }

        // Generar token JWT (mantenemos compatibilidad con el código existente)
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_key';
        
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            success: true,
            message: "Login exitoso",
            token: token
        });

    } catch (err) {
        console.error('Error en login:', err);
        res.status(500).json({ 
            success: false, 
            message: "Error interno del servidor",
            token: ""
        });
    }
});

// GET /api/user/profile - Obtener perfil del usuario
router.get('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: "Token requerido"
            });
        }

        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_key';
        
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const { data: user, error } = await supabase
            .from('users')
            .select('id, first_name, last_name, username, created_at')
            .eq('id', decoded.id)
            .single();

        if (error || !user) {
            return res.status(404).json({ 
                success: false, 
                message: "Usuario no encontrado"
            });
        }

        res.json({
            success: true,
            user
        });

    } catch (err) {
        console.error('Error al obtener perfil:', err);
        res.status(401).json({ 
            success: false, 
            message: "Token inválido"
        });
    }
});

module.exports = router; 