const router = require('express').Router();
const pool   = require('../db/pool');
const verify = require('../middleware/auth');
const { isHRAdmin, isHRManager } = require('../utils/hrHelpers');

// GET /api/hr/leaves/types
router.get('/types', verify, async (req, res) => {
  const r = await pool.query('SELECT * FROM leave_types WHERE is_active=TRUE ORDER BY name');
  res.json(r.rows);
});

// POST /api/hr/leaves/types
router.post('/types', verify, async (req, res) => {
  if (!isHRAdmin(req.user)) return res.status(403).json({ error: 'Forbidden' });
  const { name, days_per_year, carry_forward } = req.body;
  if (!name || days_per_year == null) return res.status(400).json({ error: 'name and days_per_year required' });
  try {
    const r = await pool.query(
      'INSERT INTO leave_types (name,days_per_year,carry_forward,created_by) VALUES ($1,$2,$3,$4) RETURNING *',
      [name, days_per_year, carry_forward || false, req.user.id]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Leave type name already exists' });
    console.error(err); res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/hr/leaves/types/:id
router.put('/types/:id', verify, async (req, res) => {
  if (!isHRAdmin(req.user)) return res.status(403).json({ error: 'Forbidden' });
  const { name, days_per_year, carry_forward, is_active } = req.body;
  const r = await pool.query(
    `UPDATE leave_types SET
       name=COALESCE($1,name), days_per_year=COALESCE($2,days_per_year),
       carry_forward=COALESCE($3,carry_forward), is_active=COALESCE($4,is_active)
     WHERE id=$5 RETURNING *`,
    [name||null, days_per_year??null, carry_forward??null, is_active??null, req.params.id]
  );
  if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(r.rows[0]);
});

// GET /api/hr/leaves/balances?userId=&year=
router.get('/balances', verify, async (req, res) => {
  const u = req.user;
  const year = parseInt(req.query.year) || new Date().getFullYear();
  const tid  = req.query.userId || u.id;
  if (tid !== u.id && !isHRAdmin(u) && !isHRManager(u)) return res.status(403).json({ error: 'Forbidden' });
  try {
    const r = await pool.query(`
      SELECT lt.id, lt.name, lt.days_per_year, lt.carry_forward,
             COALESCE(lb.allocated_days, lt.days_per_year) AS allocated_days,
             COALESCE(
               (SELECT SUM(lr.days)::float FROM leave_requests lr
                WHERE lr.user_id=$1 AND lr.leave_type_id=lt.id
                  AND lr.status='approved'
                  AND EXTRACT(YEAR FROM lr.start_date)=$2),
               0
             ) AS used_days
      FROM leave_types lt
      LEFT JOIN leave_balances lb ON lb.leave_type_id=lt.id AND lb.user_id=$1 AND lb.year=$2
      WHERE lt.is_active=TRUE
      ORDER BY lt.name
    `, [tid, year]);
    res.json(r.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/hr/leaves/requests?status=&userId=
router.get('/requests', verify, async (req, res) => {
  const u = req.user;
  const { status, userId } = req.query;
  const clauses = [], params = [];
  let i = 1;

  if (isHRAdmin(u)) {
    if (userId) { clauses.push(`lr.user_id=$${i++}`); params.push(userId); }
  } else if (isHRManager(u)) {
    clauses.push(`(lr.user_id=$${i++} OR em.manager_id=$${i++})`);
    params.push(u.id, u.id);
  } else {
    clauses.push(`lr.user_id=$${i++}`); params.push(u.id);
  }
  if (status) { clauses.push(`lr.status=$${i++}`); params.push(status); }

  const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
  try {
    const r = await pool.query(`
      SELECT lr.*, lt.name AS leave_type_name,
             em.name AS user_name, em.color AS user_color,
             rv.name AS reviewed_by_name
      FROM leave_requests lr
      JOIN users em ON em.id = lr.user_id
      JOIN leave_types lt ON lt.id = lr.leave_type_id
      LEFT JOIN users rv ON rv.id = lr.reviewed_by
      ${where}
      ORDER BY lr.created_at DESC
    `, params);
    res.json(r.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/hr/leaves/requests
router.post('/requests', verify, async (req, res) => {
  const { leave_type_id, start_date, end_date, days, reason } = req.body;
  if (!leave_type_id || !start_date || !end_date || !days)
    return res.status(400).json({ error: 'leave_type_id, start_date, end_date, days required' });
  try {
    const r = await pool.query(
      `INSERT INTO leave_requests (user_id,leave_type_id,start_date,end_date,days,reason)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.id, leave_type_id, start_date, end_date, days, reason || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/hr/leaves/requests/:id  — approve / reject / cancel
router.put('/requests/:id', verify, async (req, res) => {
  const u = req.user;
  const { status, rejection_reason } = req.body;
  if (!['approved','rejected','cancelled'].includes(status))
    return res.status(400).json({ error: 'Invalid status' });
  try {
    const existing = await pool.query(`
      SELECT lr.*, em.manager_id FROM leave_requests lr
      JOIN users em ON em.id = lr.user_id
      WHERE lr.id=$1
    `, [req.params.id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Not found' });
    const lr = existing.rows[0];

    if (status === 'cancelled') {
      if (lr.user_id !== u.id) return res.status(403).json({ error: 'Forbidden' });
      if (lr.status !== 'pending') return res.status(400).json({ error: 'Only pending requests can be cancelled' });
    } else {
      const canAct = isHRAdmin(u) || (isHRManager(u) && lr.manager_id === u.id);
      if (!canAct) return res.status(403).json({ error: 'Forbidden' });
    }

    const reviewer   = ['approved','rejected'].includes(status) ? u.id : null;
    const reviewedAt = reviewer ? new Date() : null;
    const r = await pool.query(
      `UPDATE leave_requests
       SET status=$1, reviewed_by=$2, reviewed_at=$5, rejection_reason=$3
       WHERE id=$4 RETURNING *`,
      [status, reviewer, rejection_reason || null, req.params.id, reviewedAt]
    );
    res.json(r.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
