const express = require('express');
const router = express.Router();
const db = require('../db');

// Listar eventos futuros con información completa usando stored procedure
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0, category_id, location_id, search, name, startdate, tag } = req.query;
    const now = new Date();
    
    // Use the stored procedure to get events with complete information
    const result = await db.query(
      `SELECT * FROM get_events_with_details($1, $2, $3, $4, $5, $6, $7, $8) WHERE start_date > $9 ORDER BY start_date ASC`,
      [limit, offset, category_id || null, location_id || null, search || null, name || null, startdate || null, tag || null, now]
    );
    
    // Transform the data to match the required structure with nested objects
    const events = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      start_date: row.start_date,
      duration_in_minutes: row.duration_in_minutes,
      price: row.price,
      enabled_for_enrollment: row.enabled_for_enrollment === '1',
      max_assistance: row.max_assistance,
      creator: {
        id: row.creator_id,
        username: row.creator_username,
        first_name: row.creator_first_name,
        last_name: row.creator_last_name,
        email: row.creator_email
      },
      location: {
        name: row.location_name,
        address: row.location_address,
        latitude: row.location_latitude,
        longitude: row.location_longitude
      },
      tags: row.tags || []
    }));
    
    res.json(events);
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
});

// Detalle de evento con información completa usando stored procedure
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM get_event_by_id($1)`, [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting event details:', error);
    res.status(500).json({ error: 'Error al obtener detalles del evento' });
  }
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
