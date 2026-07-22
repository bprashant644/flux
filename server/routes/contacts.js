const router = require('express').Router();
const pool = require('../db/pool');
const verifyJWT = require('../middleware/auth');
const { createOutlookEvent, deleteOutlookEvent } = require('../services/graph');

// Build the SELECT: value is masked for contacts not owned by current user (unless admin).
// effective_value = sum of active (non-won/non-lost) deals if any exist, else manual c.value.
function contactSelect(userId, isAdmin) {
  const dFilter = isAdmin
    ? `d.contact_id=c.id AND d.stage NOT IN ('won','lost')`
    : `d.contact_id=c.id AND d.owner_id='${userId}' AND d.stage NOT IN ('won','lost')`;

  // Cast to FLOAT8: SUM returns BIGINT which pg returns as a string, causing JS string
  // concatenation instead of numeric addition on the client side.
  const activeDealSum  = `(SELECT COALESCE(SUM(d.value),0)::float8 FROM deals d WHERE ${dFilter})`;
  const hasActiveDeal  = `EXISTS (SELECT 1 FROM deals d WHERE ${dFilter})`;
  const effFormula     = `(CASE WHEN ${hasActiveDeal} THEN ${activeDealSum} ELSE c.value END)::float8`;

  const valueExpr = isAdmin
    ? 'c.value'
    : `CASE WHEN c.owner_id='${userId}' THEN c.value ELSE NULL END AS value`;

  const effectiveExpr = isAdmin
    ? `${effFormula} AS effective_value`
    : `CASE WHEN c.owner_id='${userId}' THEN ${effFormula} ELSE NULL END AS effective_value`;

  return `c.id, c.name, c.company, c.title, c.email, c.phone, c.source,
          c.stage, ${valueExpr}, ${effectiveExpr}, c.notes, c.owner_id, c.next_followup,
          c.recurrence, c.last_contacted, c.created_at, c.updated_at,
          c.custom_fields, u.name AS owner_name, u.color AS owner_color`;
}

// GET /api/contacts — everyone can read all contacts
router.get('/', verifyJWT, async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const sel = contactSelect(req.user.id, isAdmin);
  try {
    const { rows } = await pool.query(
      `SELECT ${sel} FROM contacts c
       LEFT JOIN users u ON u.id = c.owner_id
       ORDER BY c.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/contacts/pipeline — pipeline view: admin=all, rep=own only
router.get('/pipeline', verifyJWT, async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const sel = contactSelect(req.user.id, isAdmin);
  const where = isAdmin ? '' : `WHERE c.owner_id = $1`;
  const params = isAdmin ? [] : [req.user.id];
  try {
    const { rows } = await pool.query(
      `SELECT ${sel} FROM contacts c
       LEFT JOIN users u ON u.id = c.owner_id
       ${where}
       ORDER BY c.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/contacts/reminders — due follow-ups for current user (or all for admin)
router.get('/reminders', verifyJWT, async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const sel = contactSelect(req.user.id, isAdmin);
  const where = isAdmin
    ? `WHERE c.next_followup IS NOT NULL`
    : `WHERE c.owner_id = $1 AND c.next_followup IS NOT NULL`;
  const params = isAdmin ? [] : [req.user.id];
  try {
    const { rows } = await pool.query(
      `SELECT ${sel} FROM contacts c
       LEFT JOIN users u ON u.id = c.owner_id
       ${where}
       ORDER BY c.next_followup ASC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/contacts
router.post('/', verifyJWT, async (req, res) => {
  const { name, company, title, email, phone, source, stage = 'new',
          value = 0, notes, next_followup, recurrence = 'none',
          custom_fields = {}, force = false } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    // Duplicate detection — warn unless force=true
    if (!force && (email || phone)) {
      const conditions = [];
      const dVals = [];
      let di = 1;
      if (email) { conditions.push(`email ILIKE $${di++}`); dVals.push(email); }
      if (phone) { conditions.push(`phone = $${di++}`); dVals.push(phone); }
      const { rows: dupes } = await pool.query(
        `SELECT id, name, company, email, phone FROM contacts WHERE ${conditions.join(' OR ')}`,
        dVals
      );
      if (dupes.length > 0) {
        return res.status(409).json({ duplicates: dupes, error: 'Possible duplicates found' });
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO contacts (name, company, title, email, phone, source, stage, value, notes, owner_id, next_followup, recurrence, last_contacted, custom_fields)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,CURRENT_DATE,$13)
       RETURNING *`,
      [name, company, title, email, phone, source, stage, value, notes,
       req.user.id, next_followup || null, recurrence, JSON.stringify(custom_fields)]
    );
    const contact = rows[0];
    await pool.query(
      `INSERT INTO activity (contact_id, user_id, type, text) VALUES ($1,$2,'new','Added to pipeline')`,
      [contact.id, req.user.id]
    );
    if (next_followup) {
      createOutlookEvent(req.user.id, contact, next_followup).catch(() => {});
    }
    res.status(201).json(contact);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/contacts/:id
router.put('/:id', verifyJWT, async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  try {
    const { rows: existing } = await pool.query('SELECT * FROM contacts WHERE id=$1', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ error: 'Not found' });
    if (!isAdmin && existing[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const allowed = ['name','company','title','email','phone','source','stage','value',
                     'notes','next_followup','recurrence','last_contacted','owner_id','custom_fields'];
    const fields = [];
    const vals = [];
    let i = 1;
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key}=$${i++}`);
        const v = req.body[key] === '' ? null : req.body[key];
        vals.push(key === 'custom_fields' ? JSON.stringify(v || {}) : v);
      }
    }
    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    fields.push(`updated_at=NOW()`);
    vals.push(req.params.id);

    const { rows } = await pool.query(
      `UPDATE contacts SET ${fields.join(',')} WHERE id=$${i} RETURNING *`,
      vals
    );

    // Log stage change
    if (req.body.stage && req.body.stage !== existing[0].stage) {
      const stageName = req.body.stage.charAt(0).toUpperCase() + req.body.stage.slice(1).replace(/_/g,' ');
      await pool.query(
        `INSERT INTO activity (contact_id, user_id, type, text) VALUES ($1,$2,'stage',$3)`,
        [req.params.id, req.user.id, `Moved to ${stageName}`]
      );
    }

    // Update Outlook event if followup date changed
    if (req.body.next_followup !== undefined) {
      if (req.body.next_followup) {
        createOutlookEvent(req.user.id, rows[0], req.body.next_followup).catch(() => {});
      }
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/contacts/:id
router.delete('/:id', verifyJWT, async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  try {
    const { rows } = await pool.query('SELECT owner_id FROM contacts WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    if (!isAdmin && rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await pool.query('DELETE FROM contacts WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
