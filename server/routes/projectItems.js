const router = require('express').Router({ mergeParams: true });
const pool = require('../db/pool');
const verifyJWT = require('../middleware/auth');

const VALID_TYPES = ['task','context','deliverable','followup'];
const DEFAULT_STATUS = { task:'open', context:'open', followup:'open', deliverable:'draft' };

async function checkAccess(projectId, userId) {
  const { rows } = await pool.query('SELECT * FROM projects WHERE id=$1', [projectId]);
  if (!rows[0]) return { status: 404, error: 'Not found' };
  if (rows[0].owner_id !== userId && rows[0].created_by !== userId)
    return { status: 403, error: 'Forbidden' };
  return { project: rows[0] };
}

// GET /api/projects/:projectId/items
router.get('/', verifyJWT, async (req, res) => {
  try {
    const result = await checkAccess(req.params.projectId, req.user.id);
    if (result.status) return res.status(result.status).json({ error: result.error });

    const conditions = ['pi.project_id=$1'];
    const vals = [req.params.projectId];
    let i = 2;
    if (req.query.section_type) { conditions.push(`pi.section_type=$${i++}`); vals.push(req.query.section_type); }
    if (req.query.milestone_id) { conditions.push(`pi.milestone_id=$${i++}`); vals.push(req.query.milestone_id); }

    const { rows } = await pool.query(
      `SELECT pi.*,
              u.name  AS assignee_name,  u.color AS assignee_color,
              cb.name AS created_by_name, cb.color AS created_by_color,
              fc.name AS followup_contact_name, fc.company AS followup_contact_company
       FROM project_items pi
       LEFT JOIN users    u  ON u.id  = pi.assignee_id
       LEFT JOIN users    cb ON cb.id = pi.created_by
       LEFT JOIN contacts fc ON fc.id = pi.followup_contact_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY pi.created_at ASC`,
      vals
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/projects/:projectId/items
router.post('/', verifyJWT, async (req, res) => {
  const { section_type, title, body, status, importance, urgency, assignee_id, due_date, milestone_id, doc_type, sync_to_crm, followup_contact_id, recurrence } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  if (!VALID_TYPES.includes(section_type)) return res.status(400).json({ error: 'invalid section_type' });
  try {
    const result = await checkAccess(req.params.projectId, req.user.id);
    if (result.status) return res.status(result.status).json({ error: result.error });

    const resolvedStatus = status || DEFAULT_STATUS[section_type];
    // context items never get I/U
    const imp = section_type === 'context' ? null : (importance ?? null);
    const urg = section_type === 'context' ? null : (urgency ?? null);

    const { rows } = await pool.query(
      `INSERT INTO project_items
         (project_id, milestone_id, section_type, title, body, status,
          importance, urgency, assignee_id, due_date, doc_type, sync_to_crm,
          followup_contact_id, recurrence, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [
        req.params.projectId,
        milestone_id || null,
        section_type,
        title,
        body || null,
        resolvedStatus,
        imp,
        urg,
        assignee_id || null,
        due_date || null,
        doc_type || null,
        sync_to_crm || false,
        section_type === 'followup' ? (followup_contact_id || null) : null,
        section_type === 'followup' ? (recurrence || 'none') : 'none',
        req.user.id,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/projects/:projectId/items/:id
router.put('/:id', verifyJWT, async (req, res) => {
  try {
    const result = await checkAccess(req.params.projectId, req.user.id);
    if (result.status) return res.status(result.status).json({ error: result.error });

    const { rows: ex } = await pool.query(
      'SELECT * FROM project_items WHERE id=$1 AND project_id=$2',
      [req.params.id, req.params.projectId]
    );
    if (!ex[0]) return res.status(404).json({ error: 'Not found' });

    const item = ex[0];
    const allowed = ['title','body','status','assignee_id','due_date','milestone_id','doc_type','sync_to_crm','followup_contact_id','recurrence','committed'];
    const fields = []; const vals = []; let i = 1;

    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        fields.push(`${k}=$${i++}`);
        vals.push(req.body[k] === '' ? null : req.body[k]);
      }
    }

    // Auto-stamp committed_at when commitment is first set
    if (req.body.committed === true && !item.committed) {
      fields.push(`committed_at=NOW()`);
    }
    if (req.body.committed === false) {
      fields.push(`committed_at=NULL`);
    }

    // importance and urgency: allow explicit null to unclassify; skip if not sent
    for (const k of ['importance','urgency']) {
      if (req.body[k] !== undefined) {
        if (item.section_type === 'context') {
          fields.push(`${k}=$${i++}`); vals.push(null);
        } else {
          fields.push(`${k}=$${i++}`); vals.push(req.body[k]);
        }
      }
    }

    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    fields.push(`updated_at=NOW()`);
    vals.push(req.params.id);

    const { rows } = await pool.query(
      `UPDATE project_items SET ${fields.join(',')} WHERE id=$${i} RETURNING *`, vals
    );
    const updated = rows[0];

    // CRM bridge: followup marked done with sync_to_crm
    const beingDone = req.body.status === 'done' && item.status !== 'done';
    if (updated.section_type === 'followup' && updated.sync_to_crm && beingDone) {
      if (result.project.contact_id) {
        await pool.query(
          `UPDATE contacts SET next_followup=NULL, last_contacted=CURRENT_DATE, updated_at=NOW() WHERE id=$1`,
          [result.project.contact_id]
        );
        await pool.query(
          `INSERT INTO activity (contact_id, user_id, type, text) VALUES ($1,$2,'note',$3)`,
          [result.project.contact_id, req.user.id, `Follow-up completed (via project "${result.project.title}"): ${updated.title}`]
        );
      }
      // Also log to the item's own linked contact if different from project contact
      if (updated.followup_contact_id && updated.followup_contact_id !== result.project.contact_id) {
        await pool.query(
          `INSERT INTO activity (contact_id, user_id, type, text) VALUES ($1,$2,'note',$3)`,
          [updated.followup_contact_id, req.user.id, `Follow-up completed (via project "${result.project.title}"): ${updated.title}`]
        );
      }
    }

    // Contact timeline: log deliverable status advances
    const delivStatusChange = item.section_type === 'deliverable' &&
      req.body.status && req.body.status !== item.status &&
      ['approved','delivered'].includes(req.body.status);
    if (delivStatusChange && result.project.contact_id) {
      const verb = req.body.status === 'approved' ? 'approved' : 'delivered';
      await pool.query(
        `INSERT INTO activity (contact_id, user_id, type, text) VALUES ($1,$2,'note',$3)`,
        [result.project.contact_id, req.user.id,
         `Deliverable ${verb} (project "${result.project.title}"): ${updated.title}`]
      );
    }

    // Deal stage advance: Proposal/SoW/Contract approved → push deal forward
    if (delivStatusChange && req.body.status === 'approved' && result.project.deal_id &&
        ['Proposal','SoW','Contract'].includes(item.doc_type)) {
      const { rows: [deal] } = await pool.query('SELECT stage FROM deals WHERE id=$1', [result.project.deal_id]);
      const advance = { prospect: 'proposal', proposal: 'negotiation' };
      if (deal && advance[deal.stage]) {
        await pool.query(`UPDATE deals SET stage=$1, updated_at=NOW() WHERE id=$2`, [advance[deal.stage], result.project.deal_id]);
      }
    }

    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// DELETE /api/projects/:projectId/items/:id
router.delete('/:id', verifyJWT, async (req, res) => {
  try {
    const result = await checkAccess(req.params.projectId, req.user.id);
    if (result.status) return res.status(result.status).json({ error: result.error });

    const { rows } = await pool.query(
      'SELECT * FROM project_items WHERE id=$1 AND project_id=$2',
      [req.params.id, req.params.projectId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });

    const item = rows[0];
    if (item.created_by !== req.user.id && result.project.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await pool.query('DELETE FROM project_items WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
