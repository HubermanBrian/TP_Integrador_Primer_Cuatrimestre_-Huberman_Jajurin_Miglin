const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_key';

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
        const existingUser = await db.query('SELECT id FROM users WHERE username = $1', [username]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: "El usuario ya existe.",
                token: ""
            });
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar nuevo usuario
        const { rows } = await db.query(
            'INSERT INTO users (first_name, last_name, username, password) VALUES ($1, $2, $3, $4) RETURNING id, first_name, last_name, username',
            [first_name.trim(), last_name.trim(), username, hashedPassword]
        );

        const newUser = rows[0];

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
        // Buscar usuario por username
        const { rows } = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        
        if (rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: "Usuario o clave inválida.",
                token: ""
            });
        }

        const user = rows[0];

        // Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ 
                success: false, 
                message: "Usuario o clave inválida.",
                token: ""
            });
        }

        // Generar token JWT
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

module.exports = router;
