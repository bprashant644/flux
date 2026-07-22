const router = require('express').Router();
const pool   = require('../db/pool');
const verify = require('../middleware/auth');
const { isHRAdmin, isHRManager } = require('../utils/hrHelpers');

// GET /api/hr/attendance?userId=&month=YYYY-MM
router.get('/', verify, async (req, res) => {
  const u = req.user;
  const { month, userId } = req.query;
  const tid = userId || u.id;

  if (tid !== u.id && !isHRAdmin(u)) {
    if (isHRManager(u)) {
      const chk = await pool.query('SELECT 1 FROM users WHERE id=$1 AND manager_id=$2', [tid, u.id]);
      if (!chk.rows[0]) return res.status(403).json({ error: 'Forbidden' });
    } else return res.status(403).json({ error: 'Forbidden' });
  }

  const params = [tid];
  let where = 'WHERE al.user_id=$1';
  if (month) { where += ` AND TO_CHAR(al.date,'YYYY-MM')=$2`; params.push(month); }

  try {
    const r = await pool.query(`
      SELECT al.*, mb.name AS marked_by_name
      FROM attendance_logs al
      LEFT JOIN users mb ON mb.id = al.marked_by
      ${where}
      ORDER BY al.date
    `, params);
    res.json(r.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/hr/attendance/team?month=YYYY-MM
router.get('/team', verify, async (req, res) => {
  const u = req.user;
  if (!isHRManager(u)) return res.status(403).json({ error: 'Forbidden' });
  const { month } = req.query;
  const params = [];
  let monthFilter = '';
  if (month) { params.push(month); monthFilter = `AND TO_CHAR(al.date,'YYYY-MM')=$1`; }

  let teamFilter = '';
  if (!isHRAdmin(u)) { params.push(u.id); teamFilter = `AND u.manager_id=$${params.length}`; }
  try {
    const r = await pool.query(`
      SELECT u.id AS user_id, u.name, u.color,
             al.date, al.status
      FROM users u
      LEFT JOIN attendance_logs al ON al.user_id=u.id ${monthFilter}
      WHERE u.hr_role IS NOT NULL ${teamFilter}
      ORDER BY u.name, al.date
    `, params);
    res.json(r.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/hr/attendance/:userId/:date
router.put('/:userId/:date', verify, async (req, res) => {
  const u = req.user;
  const { userId, date } = req.params;
  const { status, note } = req.body;

  if (userId !== u.id && !isHRAdmin(u)) {
    if (isHRManager(u)) {
      const chk = await pool.query('SELECT 1 FROM users WHERE id=$1 AND manager_id=$2', [userId, u.id]);
      if (!chk.rows[0]) return res.status(403).json({ error: 'Forbidden' });
    } else return res.status(403).json({ error: 'Forbidden' });
  }

  const valid = ['present','absent','wfh','half_day','leave'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  try {
    const r = await pool.query(`
      INSERT INTO attendance_logs (user_id, date, status, marked_by, note)
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (user_id, date) DO UPDATE SET status=$3, marked_by=$4, note=$5
      RETURNING *
    `, [userId, date, status, u.id, note || null]);
    res.json(r.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
