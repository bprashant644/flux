const router = require('express').Router({ mergeParams: true });
const pool = require('../db/pool');
const verifyJWT = require('../middleware/auth');

async function checkAccess(projectId, userId) {
  const { rows } = await pool.query('SELECT * FROM projects WHERE id=$1', [projectId]);
  if (!rows[0]) return { status: 404, error: 'Not found' };
  if (rows[0].owner_id !== userId && rows[0].created_by !== userId)
    return { status: 403, error: 'Forbidden' };
  return { project: rows[0] };
}

// GET /api/projects/:projectId/milestones
router.get('/', verifyJWT, async (req, res) => {
  try {
    const result = await checkAccess(req.params.projectId, req.user.id);
    if (result.status) return res.status(result.status).json({ error: result.error });
    const { rows } = await pool.query(
      `SELECT * FROM project_milestones WHERE project_id=$1
       ORDER BY position ASC, due_date ASC NULLS LAST, created_at ASC`,
      [req.params.projectId]
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/projects/:projectId/milestones
router.post('/', verifyJWT, async (req, res) => {
  const { title, due_date, position } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  try {
    const result = await checkAccess(req.params.projectId, req.user.id);
    if (result.status) return res.status(result.status).json({ error: result.error });
    const { rows } = await pool.query(
      `INSERT INTO project_milestones (project_id, title, due_date, position)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.projectId, title, due_date || null, position ?? 0]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/projects/:projectId/milestones/:id
router.put('/:id', verifyJWT, async (req, res) => {
  try {
    const result = await checkAccess(req.params.projectId, req.user.id);
    if (result.status) return res.status(result.status).json({ error: result.error });
    const { rows: ex } = await pool.query(
      'SELECT * FROM project_milestones WHERE id=$1 AND project_id=$2',
      [req.params.id, req.params.projectId]
    );
    if (!ex[0]) return res.status(404).json({ error: 'Not found' });

    const allowed = ['title','due_date','completed','position'];
    const fields = []; const vals = []; let i = 1;
    for (const k of allowed) {
      if (req.body[k] !== undefined) { fields.push(`${k}=$${i++}`); vals.push(req.body[k] === '' ? null : req.body[k]); }
    }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    vals.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE project_milestones SET ${fields.join(',')} WHERE id=$${i} RETURNING *`, vals
    );
    const updated = rows[0];

    // Log milestone completion to linked contact's activity timeline
    const beingCompleted = req.body.completed === true && !ex[0].completed;
    if (beingCompleted && result.project.contact_id) {
      await pool.query(
        `INSERT INTO activity (contact_id, user_id, type, text) VALUES ($1,$2,'note',$3)`,
        [result.project.contact_id, req.user.id,
         `Milestone completed in "${result.project.title}": ${updated.title}`]
      );
    }

    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/projects/:projectId/milestones/:id
router.delete('/:id', verifyJWT, async (req, res) => {
  try {
    const result = await checkAccess(req.params.projectId, req.user.id);
    if (result.status) return res.status(result.status).json({ error: result.error });
    const { rows } = await pool.query(
      'SELECT id FROM project_milestones WHERE id=$1 AND project_id=$2',
      [req.params.id, req.params.projectId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    await pool.query('DELETE FROM project_milestones WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
