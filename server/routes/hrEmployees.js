const router  = require('express').Router();
const pool    = require('../db/pool');
const verify  = require('../middleware/auth');
const { isHRAdmin, isHRManager } = require('../utils/hrHelpers');

const FULL_SELECT = (sensitiveAllowed) => `
  SELECT u.id, u.name, u.email, u.role, u.hr_role, u.color, u.manager_id,
         m.name AS manager_name,
         ep.employee_id, ep.department, ep.designation, ep.joining_date, ep.date_of_birth,
         ep.phone, ep.address, ep.emergency_contact_name, ep.emergency_contact_phone,
         ${sensitiveAllowed
           ? 'ep.pan_number, ep.bank_account_number, ep.bank_ifsc'
           : 'NULL AS pan_number, NULL AS bank_account_number, NULL AS bank_ifsc'}
  FROM users u
  LEFT JOIN users m ON m.id = u.manager_id
  LEFT JOIN employee_profiles ep ON ep.user_id = u.id
`;

// GET /api/hr/employees
router.get('/', verify, async (req, res) => {
  const u = req.user;
  try {
    let rows;
    if (isHRAdmin(u)) {
      const r = await pool.query(FULL_SELECT(true) + ' WHERE ep.user_id IS NOT NULL ORDER BY u.name');
      rows = r.rows;
    } else if (isHRManager(u)) {
      const r = await pool.query(
        FULL_SELECT(false) + ' WHERE u.id=$1 OR u.manager_id=$1 ORDER BY u.name',
        [u.id]
      );
      rows = r.rows;
    } else {
      const r = await pool.query(FULL_SELECT(true) + ' WHERE u.id=$1', [u.id]);
      rows = r.rows;
    }
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/hr/employees/profile-requests/pending  (must be before /:id)
router.get('/profile-requests/pending', verify, async (req, res) => {
  if (!isHRAdmin(req.user)) return res.status(403).json({ error: 'Forbidden' });
  try {
    const r = await pool.query(`
      SELECT pcr.*, u.name AS user_name, u.color AS user_color
      FROM profile_change_requests pcr
      JOIN users u ON u.id = pcr.user_id
      WHERE pcr.status='pending'
      ORDER BY pcr.requested_at DESC
    `);
    res.json(r.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/hr/employees/profile-requests/:reqId
router.put('/profile-requests/:reqId', verify, async (req, res) => {
  if (!isHRAdmin(req.user)) return res.status(403).json({ error: 'Forbidden' });
  const { status, rejection_reason } = req.body;
  if (!['approved','rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const r = await pool.query(
      `UPDATE profile_change_requests
       SET status=$1, reviewed_by=$2, reviewed_at=NOW(), rejection_reason=$3
       WHERE id=$4 RETURNING *`,
      [status, req.user.id, rejection_reason || null, req.params.reqId]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    if (status === 'approved') {
      const rec = r.rows[0];
      await pool.query(
        `INSERT INTO employee_profiles (user_id) VALUES ($1)
         ON CONFLICT (user_id) DO UPDATE SET ${rec.field_name}=$2, updated_at=NOW()`,
        [rec.user_id, rec.new_value]
      );
    }
    res.json(r.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// GET /api/hr/employees/:id
router.get('/:id', verify, async (req, res) => {
  const u = req.user;
  const tid = req.params.id;
  const isSelf = u.id === tid;
  if (!isSelf && !isHRAdmin(u)) {
    if (isHRManager(u)) {
      const chk = await pool.query('SELECT 1 FROM users WHERE id=$1 AND manager_id=$2', [tid, u.id]);
      if (!chk.rows[0]) return res.status(403).json({ error: 'Forbidden' });
    } else return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const r = await pool.query(FULL_SELECT(isSelf || isHRAdmin(u)) + ' WHERE u.id=$1', [tid]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// PUT /api/hr/employees/:id/profile
router.put('/:id/profile', verify, async (req, res) => {
  const u = req.user;
  const tid = req.params.id;
  const isSelf = u.id === tid;
  if (!isSelf && !isHRAdmin(u)) return res.status(403).json({ error: 'Forbidden' });
  const {
    employee_id, department, designation, joining_date, date_of_birth,
    phone, address, emergency_contact_name, emergency_contact_phone,
    pan_number, bank_account_number, bank_ifsc,
    manager_id, hr_role,
  } = req.body;
  try {
    const epFields = [], epVals = [];
    let i = 1;
    if (phone !== undefined)                   { epFields.push(`phone=$${i++}`);                   epVals.push(phone || null); }
    if (address !== undefined)                 { epFields.push(`address=$${i++}`);                 epVals.push(address || null); }
    if (emergency_contact_name !== undefined)  { epFields.push(`emergency_contact_name=$${i++}`);  epVals.push(emergency_contact_name || null); }
    if (emergency_contact_phone !== undefined) { epFields.push(`emergency_contact_phone=$${i++}`); epVals.push(emergency_contact_phone || null); }
    if (isHRAdmin(u)) {
      if (employee_id !== undefined)          { epFields.push(`employee_id=$${i++}`);          epVals.push(employee_id || null); }
      if (department !== undefined)           { epFields.push(`department=$${i++}`);           epVals.push(department || null); }
      if (designation !== undefined)          { epFields.push(`designation=$${i++}`);          epVals.push(designation || null); }
      if (joining_date !== undefined)         { epFields.push(`joining_date=$${i++}`);         epVals.push(joining_date || null); }
      if (date_of_birth !== undefined)        { epFields.push(`date_of_birth=$${i++}`);        epVals.push(date_of_birth || null); }
      if (pan_number !== undefined)           { epFields.push(`pan_number=$${i++}`);           epVals.push(pan_number || null); }
      if (bank_account_number !== undefined)  { epFields.push(`bank_account_number=$${i++}`);  epVals.push(bank_account_number || null); }
      if (bank_ifsc !== undefined)            { epFields.push(`bank_ifsc=$${i++}`);            epVals.push(bank_ifsc || null); }
    }
    if (epFields.length) {
      epFields.push(`updated_at=NOW()`);
      epVals.push(tid);
      await pool.query(
        `INSERT INTO employee_profiles (user_id) VALUES ($${epVals.length})
         ON CONFLICT (user_id) DO UPDATE SET ${epFields.join(',')}`,
        epVals
      );
    }
    if (isHRAdmin(u)) {
      const uFields = [], uVals = []; let j = 1;
      if (manager_id !== undefined) { uFields.push(`manager_id=$${j++}`); uVals.push(manager_id || null); }
      if (hr_role    !== undefined) { uFields.push(`hr_role=$${j++}`);    uVals.push(hr_role    || null); }
      if (uFields.length) {
        uVals.push(tid);
        await pool.query(`UPDATE users SET ${uFields.join(',')} WHERE id=$${j}`, uVals);
      }
    }
    const r = await pool.query(FULL_SELECT(true) + ' WHERE u.id=$1', [tid]);
    res.json(r.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// POST /api/hr/employees/:id/profile-requests
router.post('/:id/profile-requests', verify, async (req, res) => {
  const u = req.user;
  if (u.id !== req.params.id) return res.status(403).json({ error: 'Forbidden' });
  const { field_name, new_value } = req.body;
  const allowed = ['pan_number','bank_account_number','bank_ifsc'];
  if (!allowed.includes(field_name) || !new_value) return res.status(400).json({ error: 'Invalid request' });
  try {
    const ep = await pool.query('SELECT * FROM employee_profiles WHERE user_id=$1', [u.id]);
    const old_value = ep.rows[0]?.[field_name] || null;
    const r = await pool.query(
      `INSERT INTO profile_change_requests (user_id, field_name, old_value, new_value)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [u.id, field_name, old_value, new_value]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
