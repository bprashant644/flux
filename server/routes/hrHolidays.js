const router = require('express').Router();
const pool   = require('../db/pool');
const verify = require('../middleware/auth');
const { isHRAdmin } = require('../utils/hrHelpers');

// GET /api/hr/holidays?year=YYYY
router.get('/', verify, async (req, res) => {
  const { year } = req.query;
  const params = [];
  let where = '';
  if (year) { params.push(`${year}-01-01`, `${year}-12-31`); where = `WHERE date BETWEEN $1 AND $2`; }
  try {
    const r = await pool.query(`SELECT * FROM holidays ${where} ORDER BY date`, params);
    res.json(r.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/hr/holidays
router.post('/', verify, async (req, res) => {
  if (!isHRAdmin(req.user)) return res.status(403).json({ error: 'Forbidden' });
  const { date, name } = req.body;
  if (!date || !name) return res.status(400).json({ error: 'date and name required' });
  try {
    const r = await pool.query(
      'INSERT INTO holidays (date, name, created_by) VALUES ($1,$2,$3) RETURNING *',
      [date, name, req.user.id]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'A holiday already exists on this date' });
    console.error(err); res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/hr/holidays/:id
router.delete('/:id', verify, async (req, res) => {
  if (!isHRAdmin(req.user)) return res.status(403).json({ error: 'Forbidden' });
  const r = await pool.query('DELETE FROM holidays WHERE id=$1 RETURNING id', [req.params.id]);
  if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

module.exports = router;
