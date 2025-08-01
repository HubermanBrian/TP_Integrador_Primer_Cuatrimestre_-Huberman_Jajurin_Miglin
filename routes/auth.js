const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_key';

// Registro de usuario
router.post('/register', async (req, res) => {
    const { username, password, first_name, last_name } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username y password requeridos' });
    }
    try {
        // Verificar si el usuario ya existe
        const { rows: existing } = await db.query('SELECT id FROM users WHERE username = $1', [username]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'El usuario ya existe' });
        }
        const hashed = await bcrypt.hash(password, 10);
        const insertSql = `
            INSERT INTO users (username, password, first_name, last_name)
            VALUES ($1, $2, $3, $4)
            RETURNING id, username, first_name, last_name
        `;
        const { rows } = await db.query(insertSql, [username, hashed, first_name || '', last_name || '']);
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Error en el registro' });
    }
});

// Login de usuario
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username y password requeridos' });
    }
    try {
        const { rows } = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        const user = rows[0];
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        // Generar token JWT
        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '12h' }
        );
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: 'Error en el login' });
    }
});

module.exports = router;
