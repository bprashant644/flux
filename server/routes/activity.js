const router = require('express').Router({ mergeParams: true });
const pool = require('../db/pool');
const verifyJWT = require('../middleware/auth');

// GET /api/contacts/:id/activity
router.get('/', verifyJWT, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT a.id, a.type, a.text, a.created_at, u.name AS user_name, u.color AS user_color
       FROM activity a LEFT JOIN users u ON u.id = a.user_id
       WHERE a.contact_id = $1
       ORDER BY a.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/contacts/:id/activity
router.post('/', verifyJWT, async (req, res) => {
  const { type = 'note', text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO activity (contact_id, user_id, type, text)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.id, req.user.id, type, text]
    );
    // Update last_contacted timestamp
    await pool.query(
      'UPDATE contacts SET last_contacted=CURRENT_DATE, updated_at=NOW() WHERE id=$1',
      [req.params.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
