const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_key';

// Registro de usuario usando stored procedure
router.post('/register', async (req, res) => {
    const { username, password, first_name, last_name } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username y password requeridos' });
    }
    try {
        // Hash the password
        const hashed = await bcrypt.hash(password, 10);
        
        // Use the stored procedure for registration
        const { rows } = await db.query(
            'SELECT * FROM register_user($1, $2, $3, $4)',
            [username, hashed, first_name || '', last_name || '']
        );
        
        const result = rows[0];
        
        if (result.success) {
            res.status(201).json({
                id: result.id,
                username: result.username,
                first_name: result.first_name,
                last_name: result.last_name,
                message: result.message
            });
        } else {
            res.status(409).json({ error: result.message });
        }
    } catch (err) {
        console.error('Error en registro:', err);
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
