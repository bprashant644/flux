const router = require('express').Router();
const pool = require('../db/pool');
const verifyJWT = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

// GET /api/custom-fields — all authenticated users can read defs
router.get('/', verifyJWT, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM custom_field_defs ORDER BY position, created_at');
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/custom-fields — admin only
router.post('/', verifyJWT, requireAdmin, async (req, res) => {
  const { name, label, field_type = 'text', options = [], required = false, position = 0 } = req.body;
  if (!name || !label) return res.status(400).json({ error: 'name and label required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO custom_field_defs (name, label, field_type, options, required, position)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name.toLowerCase().replace(/\s+/g,'_'), label, field_type, JSON.stringify(options), required, position]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Field name already exists' });
    console.error(err); res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/custom-fields/:id — admin only
router.put('/:id', verifyJWT, requireAdmin, async (req, res) => {
  const { label, field_type, options, required, position } = req.body;
  try {
    const allowed = { label, field_type, options: options ? JSON.stringify(options) : undefined, required, position };
    const fields = []; const vals = []; let i = 1;
    for (const [k, v] of Object.entries(allowed)) {
      if (v !== undefined) { fields.push(`${k}=$${i++}`); vals.push(v); }
    }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    vals.push(req.params.id);
    const { rows } = await pool.query(`UPDATE custom_field_defs SET ${fields.join(',')} WHERE id=$${i} RETURNING *`, vals);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/custom-fields/:id — admin only
router.delete('/:id', verifyJWT, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM custom_field_defs WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
