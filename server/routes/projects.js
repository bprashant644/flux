const router = require('express').Router();
const pool = require('../db/pool');
const verifyJWT = require('../middleware/auth');

async function checkAccess(projectId, userId) {
  const { rows } = await pool.query('SELECT * FROM projects WHERE id=$1', [projectId]);
  if (!rows[0]) return { status: 404, error: 'Not found' };
  if (rows[0].owner_id !== userId && rows[0].created_by !== userId)
    return { status: 403, error: 'Forbidden' };
  return { project: rows[0] };
}

// GET /api/projects
router.get('/', verifyJWT, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*,
              u.name  AS owner_name,  u.color AS owner_color,
              c.name  AS contact_name,
              d.title AS deal_title,
              COALESCE(ic.total,0)   AS item_count,
              COALESCE(io.overdue,0) AS overdue_count,
              ed.earliest_due        AS earliest_due_date
       FROM projects p
       LEFT JOIN users    u  ON u.id = p.owner_id
       LEFT JOIN contacts c  ON c.id = p.contact_id
       LEFT JOIN deals    d  ON d.id = p.deal_id
       LEFT JOIN (
         SELECT project_id, COUNT(*) AS total
         FROM project_items
         WHERE status NOT IN ('done','delivered','approved')
           AND section_type IN ('task','deliverable','followup')
         GROUP BY project_id
       ) ic ON ic.project_id = p.id
       LEFT JOIN (
         SELECT project_id, COUNT(*) AS overdue
         FROM project_items
         WHERE status NOT IN ('done','delivered','approved')
           AND section_type IN ('task','deliverable','followup')
           AND due_date < CURRENT_DATE
         GROUP BY project_id
       ) io ON io.project_id = p.id
       LEFT JOIN (
         SELECT project_id, MIN(due_date) AS earliest_due
         FROM project_items
         WHERE status NOT IN ('done','delivered','approved')
           AND section_type IN ('task','deliverable','followup')
           AND due_date IS NOT NULL
         GROUP BY project_id
       ) ed ON ed.project_id = p.id
       WHERE (p.owner_id = $1 OR p.created_by = $1)
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/projects
router.post('/', verifyJWT, async (req, res) => {
  const { title, description, contact_id, deal_id, color } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO projects (title, description, contact_id, deal_id, color, owner_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$6) RETURNING *`,
      [title, description || null, contact_id || null, deal_id || null, color || '#5B5BD6', req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/projects/weekly-review  (must precede /:id)
router.get('/weekly-review', verifyJWT, async (req, res) => {
  const uid = req.user.id;
  const access = 'AND (p.owner_id = $1 OR p.created_by = $1)';
  try {
    const [triage, overdueFollowups, stalled, milestones] = await Promise.all([
      pool.query(`
        SELECT pi.id, pi.title, pi.section_type, pi.due_date,
               p.id AS project_id, p.title AS project_title, p.color AS project_color
        FROM project_items pi JOIN projects p ON p.id = pi.project_id
        WHERE p.status = 'active'
          AND pi.section_type IN ('task','deliverable','followup')
          AND pi.status NOT IN ('done','delivered','approved')
          AND (pi.importance IS NULL OR pi.urgency IS NULL)
          ${access}
        ORDER BY pi.created_at ASC LIMIT 30`, [uid]),
      pool.query(`
        SELECT pi.id, pi.title, pi.due_date,
               p.id AS project_id, p.title AS project_title, p.color AS project_color,
               fc.name AS contact_name
        FROM project_items pi JOIN projects p ON p.id = pi.project_id
        LEFT JOIN contacts fc ON fc.id = pi.followup_contact_id
        WHERE p.status = 'active'
          AND pi.section_type = 'followup' AND pi.status = 'open'
          AND pi.due_date < CURRENT_DATE
          ${access}
        ORDER BY pi.due_date ASC LIMIT 20`, [uid]),
      pool.query(`
        SELECT pi.id, pi.title, pi.status, pi.doc_type, pi.updated_at,
               p.id AS project_id, p.title AS project_title, p.color AS project_color
        FROM project_items pi JOIN projects p ON p.id = pi.project_id
        WHERE p.status = 'active'
          AND pi.section_type = 'deliverable'
          AND pi.status IN ('draft','review')
          AND pi.updated_at < NOW() - INTERVAL '14 days'
          ${access}
        ORDER BY pi.updated_at ASC LIMIT 20`, [uid]),
      pool.query(`
        SELECT pm.id, pm.title, pm.due_date,
               p.id AS project_id, p.title AS project_title, p.color AS project_color
        FROM project_milestones pm JOIN projects p ON p.id = pm.project_id
        WHERE p.status = 'active' AND pm.completed = FALSE
          AND pm.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
          ${access}
        ORDER BY pm.due_date ASC`, [uid]),
    ]);
    res.json({
      triage:           triage.rows,
      overdueFollowups: overdueFollowups.rows,
      stalled:          stalled.rows,
      milestones:       milestones.rows,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/projects/followups-due  (must precede /:id)
router.get('/followups-due', verifyJWT, async (req, res) => {
  const uid = req.user.id;
  try {
    const { rows } = await pool.query(`
      SELECT pi.id, pi.title, pi.due_date, pi.recurrence, pi.sync_to_crm,
             pi.followup_contact_id, pi.importance, pi.urgency, pi.committed,
             p.id AS project_id, p.title AS project_title, p.color AS project_color,
             c.name AS contact_name, c.company AS contact_company,
             u.name AS assignee_name, u.color AS assignee_color
      FROM project_items pi
      JOIN projects p ON p.id = pi.project_id
      LEFT JOIN contacts c ON c.id = pi.followup_contact_id
      LEFT JOIN users    u ON u.id = pi.assignee_id
      WHERE pi.section_type = 'followup'
        AND pi.status = 'open'
        AND pi.followup_contact_id IS NOT NULL
        AND p.status = 'active'
        AND (p.owner_id = $1 OR p.created_by = $1)
      ORDER BY pi.due_date ASC NULLS LAST
    `, [uid]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/projects/ppc  — commitment reliability (planned percent complete)
router.get('/ppc', verifyJWT, async (req, res) => {
  const uid = req.user.id;
  try {
    const { rows } = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('week', pi.committed_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS week_start,
        COUNT(*)::int                                                                   AS total_committed,
        COUNT(*) FILTER (WHERE pi.status IN ('done','delivered','approved'))::int       AS completed
      FROM project_items pi
      JOIN projects p ON p.id = pi.project_id
      WHERE pi.committed = TRUE
        AND pi.committed_at >= NOW() - INTERVAL '8 weeks'
        AND (pi.assignee_id = $1 OR pi.created_by = $1)
      GROUP BY 1 ORDER BY 1 DESC
    `, [uid]);
    res.json(rows.map(r => ({
      ...r,
      ppc: r.total_committed > 0 ? Math.round(r.completed / r.total_committed * 100) : null,
    })));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/projects/all-items — actionable items across all active projects for the current user
router.get('/all-items', verifyJWT, async (req, res) => {
  const uid = req.user.id;
  try {
    const { rows } = await pool.query(`
      SELECT pi.id, pi.title, pi.section_type, pi.status,
             pi.importance, pi.urgency, pi.due_date, pi.assignee_id,
             u.name AS assignee_name, u.color AS assignee_color,
             p.id AS project_id, p.title AS project_title, p.color AS project_color
      FROM project_items pi
      JOIN projects p ON p.id = pi.project_id
      LEFT JOIN users u ON u.id = pi.assignee_id
      WHERE p.status = 'active'
        AND (p.owner_id = $1 OR p.created_by = $1)
        AND pi.section_type IN ('task','deliverable','followup')
        AND pi.status NOT IN ('done','delivered','approved')
      ORDER BY pi.due_date ASC NULLS LAST, pi.created_at ASC
    `, [uid]);
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/projects/:id
router.get('/:id', verifyJWT, async (req, res) => {
  try {
    const result = await checkAccess(req.params.id, req.user.id);
    if (result.status) return res.status(result.status).json({ error: result.error });
    const { rows } = await pool.query(
      `SELECT p.*, u.name AS owner_name, u.color AS owner_color,
              c.name AS contact_name, d.title AS deal_title
       FROM projects p
       LEFT JOIN users    u ON u.id = p.owner_id
       LEFT JOIN contacts c ON c.id = p.contact_id
       LEFT JOIN deals    d ON d.id = p.deal_id
       WHERE p.id = $1`,
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/projects/:id
router.put('/:id', verifyJWT, async (req, res) => {
  try {
    const { rows: ex } = await pool.query('SELECT * FROM projects WHERE id=$1', [req.params.id]);
    if (!ex[0]) return res.status(404).json({ error: 'Not found' });
    if (ex[0].owner_id !== req.user.id && ex[0].created_by !== req.user.id)
      return res.status(403).json({ error: 'Forbidden' });

    const allowed = ['title','description','contact_id','deal_id','color','status','owner_id','notes','retro'];
    const fields = []; const vals = []; let i = 1;
    for (const k of allowed) {
      if (req.body[k] !== undefined) { fields.push(`${k}=$${i++}`); vals.push(req.body[k] === '' ? null : req.body[k]); }
    }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    fields.push(`updated_at=NOW()`);
    vals.push(req.params.id);
    const { rows } = await pool.query(`UPDATE projects SET ${fields.join(',')} WHERE id=$${i} RETURNING *`, vals);
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/projects/:id
router.delete('/:id', verifyJWT, async (req, res) => {
  try {
    const result = await checkAccess(req.params.id, req.user.id);
    if (result.status) return res.status(result.status).json({ error: result.error });
    await pool.query('DELETE FROM projects WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
