const router = require('express').Router();
const pool   = require('../db/pool');
const verify = require('../middleware/auth');
const { isHRAdmin, isHRManager } = require('../utils/hrHelpers');

const todayDateStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

// Allocated vs. already-committed (approved + pending) days for a user/leave-type/year —
// used to stop a request from being submitted for more leave than the employee has left.
async function getLeaveAvailability(userId, leaveTypeId, year) {
  const ltR = await pool.query(
    'SELECT days_per_year, carry_forward, max_carry_forward_days FROM leave_types WHERE id=$1',
    [leaveTypeId]
  );
  const lt = ltR.rows[0];
  if (!lt) return null;

  const overrideR = await pool.query(
    'SELECT allocated_days FROM leave_balances WHERE user_id=$1 AND leave_type_id=$2 AND year=$3',
    [userId, leaveTypeId, year]
  );
  const override = overrideR.rows[0]?.allocated_days;

  let carried = 0;
  if (lt.carry_forward) {
    const prevOverrideR = await pool.query(
      'SELECT allocated_days FROM leave_balances WHERE user_id=$1 AND leave_type_id=$2 AND year=$3',
      [userId, leaveTypeId, year - 1]
    );
    const prevAllocated = prevOverrideR.rows[0]?.allocated_days ?? lt.days_per_year;
    const prevUsedR = await pool.query(
      `SELECT COALESCE(SUM(days),0)::float AS used FROM leave_requests
       WHERE user_id=$1 AND leave_type_id=$2 AND status='approved' AND EXTRACT(YEAR FROM start_date)=$3`,
      [userId, leaveTypeId, year - 1]
    );
    carried = Math.max(0, Math.min(lt.max_carry_forward_days, Number(prevAllocated) - Number(prevUsedR.rows[0].used)));
  }

  const allocated = override != null ? Number(override) : Number(lt.days_per_year) + carried;

  const usedR = await pool.query(
    `SELECT COALESCE(SUM(days),0)::float AS used FROM leave_requests
     WHERE user_id=$1 AND leave_type_id=$2 AND status IN ('approved','pending') AND EXTRACT(YEAR FROM start_date)=$3`,
    [userId, leaveTypeId, year]
  );
  const used = Number(usedR.rows[0].used);

  return { allocated, used, available: allocated - used };
}

// GET /api/hr/leaves/roster — all HR-tracked users (id/name/color only), for the Leave Calendar's team rows
router.get('/roster', verify, async (req, res) => {
  try {
    const r = await pool.query(`SELECT id, name, color FROM users WHERE hr_role IS NOT NULL ORDER BY name`);
    res.json(r.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/hr/leaves/types
router.get('/types', verify, async (req, res) => {
  const r = await pool.query('SELECT * FROM leave_types WHERE is_active=TRUE ORDER BY name');
  res.json(r.rows);
});

// POST /api/hr/leaves/types
router.post('/types', verify, async (req, res) => {
  if (!isHRAdmin(req.user)) return res.status(403).json({ error: 'Forbidden' });
  const { name, days_per_year, carry_forward, max_carry_forward_days } = req.body;
  if (!name || days_per_year == null) return res.status(400).json({ error: 'name and days_per_year required' });
  try {
    const r = await pool.query(
      'INSERT INTO leave_types (name,days_per_year,carry_forward,max_carry_forward_days,created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, days_per_year, carry_forward || false, max_carry_forward_days || 0, req.user.id]
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
  const { name, days_per_year, carry_forward, max_carry_forward_days, is_active } = req.body;
  const r = await pool.query(
    `UPDATE leave_types SET
       name=COALESCE($1,name), days_per_year=COALESCE($2,days_per_year),
       carry_forward=COALESCE($3,carry_forward), max_carry_forward_days=COALESCE($4,max_carry_forward_days),
       is_active=COALESCE($5,is_active)
     WHERE id=$6 RETURNING *`,
    [name||null, days_per_year??null, carry_forward??null, max_carry_forward_days??null, is_active??null, req.params.id]
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
      SELECT lt.id, lt.name, lt.days_per_year, lt.carry_forward, lt.max_carry_forward_days,
             lb.allocated_days AS override_days,
             GREATEST(0, LEAST(
               lt.max_carry_forward_days,
               COALESCE(prev_lb.allocated_days, lt.days_per_year)
                 - COALESCE((
                     SELECT SUM(lr.days)::float FROM leave_requests lr
                     WHERE lr.user_id=$1 AND lr.leave_type_id=lt.id AND lr.status='approved'
                       AND EXTRACT(YEAR FROM lr.start_date)=$2-1
                   ), 0)
             )) AS carried_forward,
             COALESCE(
               (SELECT SUM(lr.days)::float FROM leave_requests lr
                WHERE lr.user_id=$1 AND lr.leave_type_id=lt.id
                  AND lr.status='approved'
                  AND EXTRACT(YEAR FROM lr.start_date)=$2),
               0
             ) AS used_days
      FROM leave_types lt
      LEFT JOIN leave_balances lb ON lb.leave_type_id=lt.id AND lb.user_id=$1 AND lb.year=$2
      LEFT JOIN leave_balances prev_lb ON prev_lb.leave_type_id=lt.id AND prev_lb.user_id=$1 AND prev_lb.year=$2-1
      WHERE lt.is_active=TRUE
      ORDER BY lt.name
    `, [tid, year]);

    const rows = r.rows.map(row => {
      const carried = row.carry_forward ? Number(row.carried_forward) : 0;
      const allocated_days = row.override_days != null
        ? Number(row.override_days)
        : Number(row.days_per_year) + carried;
      return {
        id: row.id, name: row.name, days_per_year: row.days_per_year,
        carry_forward: row.carry_forward, max_carry_forward_days: row.max_carry_forward_days,
        allocated_days, carried_forward_days: carried, used_days: row.used_days,
      };
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/hr/leaves/balances/:userId/:leaveTypeId?year=YYYY
router.put('/balances/:userId/:leaveTypeId', verify, async (req, res) => {
  if (!isHRAdmin(req.user)) return res.status(403).json({ error: 'Forbidden' });
  const { userId, leaveTypeId } = req.params;
  const year = parseInt(req.query.year) || new Date().getFullYear();
  const { allocated_days } = req.body;
  if (allocated_days == null || isNaN(allocated_days))
    return res.status(400).json({ error: 'allocated_days required' });
  try {
    const r = await pool.query(`
      INSERT INTO leave_balances (user_id, leave_type_id, year, allocated_days)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (user_id, leave_type_id, year) DO UPDATE SET allocated_days=$4
      RETURNING *
    `, [userId, leaveTypeId, year, allocated_days]);
    res.json(r.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/hr/leaves/calendar?month=YYYY-MM — approved leaves overlapping month, all users
router.get('/calendar', verify, async (req, res) => {
  const { month } = req.query;
  if (!month) return res.status(400).json({ error: 'month required' });
  try {
    const r = await pool.query(`
      SELECT lr.id, lr.user_id, lr.leave_type_id, lr.start_date, lr.end_date,
             lt.name AS leave_type_name, em.name AS user_name, em.color AS user_color
      FROM leave_requests lr
      JOIN leave_types lt ON lt.id = lr.leave_type_id
      JOIN users em ON em.id = lr.user_id
      WHERE lr.status='approved'
        AND lr.start_date <= (TO_DATE($1,'YYYY-MM') + INTERVAL '1 month' - INTERVAL '1 day')
        AND lr.end_date   >= TO_DATE($1,'YYYY-MM')
    `, [month]);
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
  const { leave_type_id, start_date, end_date, days, reason, user_id } = req.body;
  if (!leave_type_id || !start_date || !end_date || !days)
    return res.status(400).json({ error: 'leave_type_id, start_date, end_date, days required' });

  const targetUserId = user_id && isHRAdmin(req.user) ? user_id : req.user.id;
  const isAdhocAdminGrant = isHRAdmin(req.user) && !!user_id;

  // Admins can backdate a grant made via the Adhoc form (always sends user_id, even for
  // themselves) to log leave that already happened; self-service "Apply Leave" requests
  // (which never send user_id) must still be today or later.
  if (!isAdhocAdminGrant && start_date < todayDateStr())
    return res.status(400).json({ error: 'Start date cannot be in the past' });
  if (end_date < start_date)
    return res.status(400).json({ error: 'End date cannot be before start date' });
  const status = isAdhocAdminGrant ? 'approved' : 'pending';
  const reviewedBy = isAdhocAdminGrant ? req.user.id : null;
  const reviewedAt = isAdhocAdminGrant ? new Date() : null;

  try {
    const year = new Date(start_date).getFullYear();
    const availability = await getLeaveAvailability(targetUserId, leave_type_id, year);
    if (!availability) return res.status(400).json({ error: 'Invalid leave type' });
    if (Number(days) > availability.available) {
      return res.status(400).json({
        error: `Insufficient leave balance: ${availability.available} day(s) available, ${days} requested`,
      });
    }

    const r = await pool.query(
      `INSERT INTO leave_requests (user_id,leave_type_id,start_date,end_date,days,reason,status,reviewed_by,reviewed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [targetUserId, leave_type_id, start_date, end_date, days, reason || null, status, reviewedBy, reviewedAt]
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
      if (!['pending','approved'].includes(lr.status))
        return res.status(400).json({ error: 'Only pending or approved requests can be revoked' });
      const startDateStr = lr.start_date instanceof Date ? lr.start_date.toISOString().slice(0,10) : lr.start_date;
      if (startDateStr < todayDateStr())
        return res.status(400).json({ error: 'Leave that has already started or passed cannot be revoked' });
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
