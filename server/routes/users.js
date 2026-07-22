const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const verifyJWT = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

// List all users (admin only)
router.get('/', verifyJWT, requireAdmin, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, email, role, hr_role, manager_id, color, teams_webhook_url, email_digest, module_access, created_at FROM users ORDER BY name'
  );
  res.json(rows);
});

// Create user (admin only)
router.post('/', verifyJWT, requireAdmin, async (req, res) => {
  const { name, email, password, role = 'rep', color = '#5B5BD6', module_access, hr_role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, password required' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const ma = module_access || { crm: false, projects: false, hr: true };
    const effectiveHrRole = role === 'admin' ? null : (hr_role || 'employee');
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, color, module_access, hr_role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, role, hr_role, color, module_access, created_at`,
      [name, email.toLowerCase().trim(), hash, role, color, JSON.stringify(ma), effectiveHrRole]
    );
    if (role !== 'admin') {
      await pool.query(
        'INSERT INTO employee_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING',
        [rows[0].id]
      );
    }
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already in use' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user — admin can update any; reps can only update their own notification prefs
router.put('/:id', verifyJWT, async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const isSelf = req.user.id === req.params.id;
  if (!isAdmin && !isSelf) return res.status(403).json({ error: 'Forbidden' });

  const { name, email, password, role, color, hr_role, manager_id, teams_webhook_url, email_digest, module_access } = req.body;
  try {
    const fields = [];
    const vals = [];
    let i = 1;
    if ((isAdmin || isSelf) && name)  { fields.push(`name=$${i++}`); vals.push(name); }
    if ((isAdmin || isSelf) && email) { fields.push(`email=$${i++}`); vals.push(email.toLowerCase().trim()); }
    if (isAdmin && role)        { fields.push(`role=$${i++}`);       vals.push(role); }
    if (isAdmin && hr_role !== undefined) { fields.push(`hr_role=$${i++}`); vals.push(hr_role || null); }
    if (isAdmin && manager_id !== undefined) { fields.push(`manager_id=$${i++}`); vals.push(manager_id || null); }
    if (isAdmin && module_access !== undefined) { fields.push(`module_access=$${i++}`); vals.push(JSON.stringify(module_access)); }
    if ((isAdmin || isSelf) && color)  { fields.push(`color=$${i++}`); vals.push(color); }
    if (password) { fields.push(`password_hash=$${i++}`); vals.push(await bcrypt.hash(password, 10)); }
    if (teams_webhook_url !== undefined) { fields.push(`teams_webhook_url=$${i++}`); vals.push(teams_webhook_url || null); }
    if (email_digest !== undefined) { fields.push(`email_digest=$${i++}`); vals.push(Boolean(email_digest)); }

    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    vals.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(',')} WHERE id=$${i} RETURNING id, name, email, role, hr_role, manager_id, color, teams_webhook_url, email_digest, module_access`,
      vals
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', verifyJWT, requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
