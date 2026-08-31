const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const verifyJWT = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const { isValidPassword, PASSWORD_RULE_MESSAGE } = require('../utils/password');
const { isHRAdmin } = require('../utils/hrHelpers');

const { resolveUploadDir } = require('../utils/uploadDir');
const AVATAR_DIR = resolveUploadDir('avatars');
const photoStorage = multer.diskStorage({
  destination: AVATAR_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${req.params.id}-${Date.now()}${ext}`);
  },
});
const uploadPhoto = multer({
  storage: photoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype)),
});

// List all users. Admins get full profile detail; everyone else gets just enough
// (id/name/color/photo) to populate assignee/owner pickers across contacts and projects.
router.get('/', verifyJWT, async (req, res) => {
  if (req.user.role === 'admin') {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, hr_role, manager_id, color, photo_url, two_factor_enabled, teams_webhook_url, email_digest, module_access, created_at FROM users ORDER BY name'
    );
    return res.json(rows);
  }
  const { rows } = await pool.query('SELECT id, name, color, photo_url FROM users ORDER BY name');
  res.json(rows);
});

// Create user (CRM admin or HR admin) — this is the invite flow: the new user always
// lands in the inviter's own org (req.user.org_id), never an arbitrary one. Invited users
// are pre-verified (an admin created them directly) — no confirmation email needed.
router.post('/', verifyJWT, async (req, res) => {
  if (!isHRAdmin(req.user)) return res.status(403).json({ error: 'Forbidden' });
  const { name, email, password, role = 'rep', color = '#5B5BD6', module_access, hr_role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, password required' });
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({ error: PASSWORD_RULE_MESSAGE });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const hash = await bcrypt.hash(password, 10);
    const ma = module_access || { crm: false, projects: false, hr: true };
    const effectiveHrRole = role === 'admin' ? null : (hr_role || 'employee');
    const { rows } = await client.query(
      `INSERT INTO users (name, email, password_hash, role, color, module_access, hr_role, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
       RETURNING id, name, email, role, hr_role, color, module_access, created_at`,
      [name, email.toLowerCase().trim(), hash, role, color, JSON.stringify(ma), effectiveHrRole]
    );
    if (role !== 'admin') {
      await client.query(
        'INSERT INTO employee_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING',
        [rows[0].id]
      );
    }
    await client.query(
      'INSERT INTO memberships (org_id, user_id, role) VALUES ($1, $2, $3)',
      [req.user.org_id, rows[0].id, role]
    );
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    if (err.code === '23505') return res.status(409).json({ error: 'Email already in use' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// Update user — admin can update any; reps can only update their own notification prefs
router.put('/:id', verifyJWT, async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const isSelf = req.user.id === req.params.id;
  if (!isAdmin && !isSelf) return res.status(403).json({ error: 'Forbidden' });

  const { name, email, password, currentPassword, role, color, hr_role, manager_id, teams_webhook_url, email_digest, module_access, two_factor_enabled } = req.body;
  try {
    // Self-service password changes must prove the current password; an admin resetting
    // someone else's password (e.g. from the Users page) is an intentional override and skips this.
    if (password && isSelf) {
      const { rows: cur } = await pool.query('SELECT password_hash FROM users WHERE id=$1', [req.params.id]);
      if (!cur[0] || !currentPassword || !(await bcrypt.compare(currentPassword, cur[0].password_hash))) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
    }

    if (password && !isValidPassword(password)) {
      return res.status(400).json({ error: PASSWORD_RULE_MESSAGE });
    }

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
    if ((isAdmin || isSelf) && two_factor_enabled !== undefined) { fields.push(`two_factor_enabled=$${i++}`); vals.push(Boolean(two_factor_enabled)); }

    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
    vals.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(',')} WHERE id=$${i} RETURNING id, name, email, role, hr_role, manager_id, color, photo_url, two_factor_enabled, teams_webhook_url, email_digest, module_access`,
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

// POST /api/users/:id/photo — upload/replace avatar photo
router.post('/:id/photo', verifyJWT, uploadPhoto.single('photo'), async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const isSelf = req.user.id === req.params.id;
  if (!isAdmin && !isSelf) return res.status(403).json({ error: 'Forbidden' });
  if (!req.file) return res.status(400).json({ error: 'photo file required' });
  try {
    const { rows: old } = await pool.query('SELECT photo_url FROM users WHERE id=$1', [req.params.id]);
    if (old[0]?.photo_url) {
      fs.unlink(path.join(AVATAR_DIR, path.basename(old[0].photo_url)), () => {});
    }
    const photo_url = `/api/uploads/avatars/${req.file.filename}`;
    const { rows } = await pool.query(
      `UPDATE users SET photo_url=$1 WHERE id=$2
       RETURNING id, name, email, role, hr_role, manager_id, color, photo_url, two_factor_enabled, teams_webhook_url, email_digest, module_access`,
      [photo_url, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/users/:id/photo — remove avatar photo
router.delete('/:id/photo', verifyJWT, async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const isSelf = req.user.id === req.params.id;
  if (!isAdmin && !isSelf) return res.status(403).json({ error: 'Forbidden' });
  try {
    const { rows: old } = await pool.query('SELECT photo_url FROM users WHERE id=$1', [req.params.id]);
    if (old[0]?.photo_url) {
      fs.unlink(path.join(AVATAR_DIR, path.basename(old[0].photo_url)), () => {});
    }
    const { rows } = await pool.query(
      `UPDATE users SET photo_url=NULL WHERE id=$1
       RETURNING id, name, email, role, hr_role, manager_id, color, photo_url, two_factor_enabled, teams_webhook_url, email_digest, module_access`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
