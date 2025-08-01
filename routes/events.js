const express = require('express');
const router = express.Router();
const db = require('../db');

// Listar eventos futuros
router.get('/', async (req, res) => {
  const now = new Date();
  const result = await db.query(
    `SELECT * FROM events WHERE start_date > $1 ORDER BY start_date ASC`, [now]
  );
  res.json(result.rows);
});

// Detalle de evento
router.get('/:id', async (req, res) => {
  const result = await db.query(
    `SELECT * FROM events WHERE id = $1`, [req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Evento no encontrado' });
  res.json(result.rows[0]);
});

// Crear evento
router.post('/', async (req, res) => {
  const { name, description, id_event_category, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance, id_creator_user } = req.body;
  const result = await db.query(
    `INSERT INTO events (name, description, id_event_category, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance, id_creator_user)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [name, description, id_event_category, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance, id_creator_user]
  );
  res.status(201).json(result.rows[0]);
});

// Modificar evento
router.put('/:id', async (req, res) => {
  const { name, description, id_event_category, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance, id_creator_user } = req.body;
  const result = await db.query(
    `UPDATE events SET name=$1, description=$2, id_event_category=$3, id_event_location=$4, start_date=$5, duration_in_minutes=$6, price=$7, enabled_for_enrollment=$8, max_assistance=$9, id_creator_user=$10 WHERE id=$11 RETURNING *`,
    [name, description, id_event_category, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance, id_creator_user, req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Evento no encontrado' });
  res.json(result.rows[0]);
});

// Inscribirse a un evento
router.post('/:id/enroll', async (req, res) => {
  const { id_user, description } = req.body;
  const result = await db.query(
    `INSERT INTO event_enrollments (id_event, id_user, description, registration_date_time) VALUES ($1, $2, $3, NOW()) RETURNING *`,
    [req.params.id, id_user, description]
  );
  res.status(201).json(result.rows[0]);
});

// Listar inscriptos a un evento
router.get('/:id/enrollments', async (req, res) => {
  const result = await db.query(
    `SELECT u.id, u.first_name, u.last_name, u.username, e.registration_date_time
     FROM event_enrollments e
     JOIN users u ON e.id_user = u.id
     WHERE e.id_event = $1`, [req.params.id]
  );
  res.json(result.rows);
});

module.exports = router;
