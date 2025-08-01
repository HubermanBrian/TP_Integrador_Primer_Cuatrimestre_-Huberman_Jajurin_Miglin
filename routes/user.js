const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

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
