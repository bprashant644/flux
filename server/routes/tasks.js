const router = require('express').Router();
const pool = require('../db/pool');
const verifyJWT = require('../middleware/auth');

// GET /api/tasks[?contact_id=xxx]
router.get('/', verifyJWT, async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const { contact_id } = req.query;
  try {
    const conditions = [];
    const vals = [];
    let i = 1;
    if (!isAdmin) {
      conditions.push(`(t.assigned_to = $${i} OR t.created_by = $${i})`);
      vals.push(req.user.id); i++;
    }
    if (contact_id) { conditions.push(`t.contact_id = $${i++}`); vals.push(contact_id); }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const { rows } = await pool.query(
      `SELECT t.*, c.name AS contact_name, u.name AS assigned_name, u.color AS assigned_color
       FROM tasks t
       LEFT JOIN contacts c ON c.id = t.contact_id
       LEFT JOIN users u ON u.id = t.assigned_to
       ${where}
       ORDER BY t.completed ASC, t.due_date ASC NULLS LAST, t.created_at ASC`,
      vals
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/tasks
router.post('/', verifyJWT, async (req, res) => {
  const { contact_id, title, due_date, assigned_to } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO tasks (contact_id, title, due_date, assigned_to, created_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [contact_id || null, title, due_date || null, assigned_to || req.user.id, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/tasks/:id
router.put('/:id', verifyJWT, async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  try {
    const { rows: ex } = await pool.query('SELECT * FROM tasks WHERE id=$1', [req.params.id]);
    if (!ex[0]) return res.status(404).json({ error: 'Not found' });
    if (!isAdmin && ex[0].assigned_to !== req.user.id && ex[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const allowed = ['title','due_date','assigned_to','contact_id'];
    const fields = []; const vals = []; let i = 1;
    for (const k of allowed) {
      if (req.body[k] !== undefined) { fields.push(`${k}=$${i++}`); vals.push(req.body[k] === '' ? null : req.body[k]); }
    }
    if (req.body.completed !== undefined) {
      fields.push(`completed=$${i++}`); vals.push(req.body.completed);
      fields.push(`completed_at=$${i++}`); vals.push(req.body.completed ? new Date() : null);
    }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    vals.push(req.params.id);
    const { rows } = await pool.query(`UPDATE tasks SET ${fields.join(',')} WHERE id=$${i} RETURNING *`, vals);
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/tasks/:id
router.delete('/:id', verifyJWT, async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  try {
    const { rows } = await pool.query('SELECT created_by, assigned_to FROM tasks WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    if (!isAdmin && rows[0].created_by !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
    await pool.query('DELETE FROM tasks WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
