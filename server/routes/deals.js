const router = require('express').Router();
const pool = require('../db/pool');
const verifyJWT = require('../middleware/auth');

const DEAL_STAGES = ['prospect','qualified','proposal','negotiation','won','lost'];

// GET /api/deals[?contact_id=xxx]
router.get('/', verifyJWT, async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const { contact_id } = req.query;
  try {
    const conditions = [];
    const vals = [];
    let i = 1;
    if (!isAdmin) { conditions.push(`d.owner_id = $${i++}`); vals.push(req.user.id); }
    if (contact_id) { conditions.push(`d.contact_id = $${i++}`); vals.push(contact_id); }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const { rows } = await pool.query(
      `SELECT d.*, c.name AS contact_name, c.company AS contact_company, u.name AS owner_name, u.color AS owner_color,
              COALESCE(pc.project_count, 0) AS project_count
       FROM deals d
       LEFT JOIN contacts c ON c.id = d.contact_id
       LEFT JOIN users u ON u.id = d.owner_id
       LEFT JOIN (
         SELECT deal_id, COUNT(*) AS project_count
         FROM projects WHERE deal_id IS NOT NULL GROUP BY deal_id
       ) pc ON pc.deal_id = d.id
       ${where}
       ORDER BY d.created_at DESC`,
      vals
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/deals
router.post('/', verifyJWT, async (req, res) => {
  const { contact_id, title, value = 0, stage = 'prospect', expected_close, notes } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO deals (contact_id, title, value, stage, expected_close, owner_id, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [contact_id || null, title, value, stage, expected_close || null, req.user.id, notes || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/deals/:id
router.put('/:id', verifyJWT, async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  try {
    const { rows: ex } = await pool.query('SELECT * FROM deals WHERE id=$1', [req.params.id]);
    if (!ex[0]) return res.status(404).json({ error: 'Not found' });
    if (!isAdmin && ex[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const allowed = ['title','value','stage','expected_close','notes','contact_id'];
    const fields = []; const vals = []; let i = 1;
    for (const k of allowed) {
      if (req.body[k] !== undefined) { fields.push(`${k}=$${i++}`); vals.push(req.body[k] === '' ? null : req.body[k]); }
    }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    fields.push(`updated_at=NOW()`); vals.push(req.params.id);
    const { rows } = await pool.query(`UPDATE deals SET ${fields.join(',')} WHERE id=$${i} RETURNING *`, vals);
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/deals/:id
router.delete('/:id', verifyJWT, async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  try {
    const { rows } = await pool.query('SELECT owner_id FROM deals WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    if (!isAdmin && rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    await pool.query('DELETE FROM deals WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
