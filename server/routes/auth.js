const router = require('express').Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { jwtSecret } = require('../config');
const verifyJWT = require('../middleware/auth');
const { isValidPassword, PASSWORD_RULE_MESSAGE } = require('../utils/password');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email');

function issueToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role, color: user.color, hr_role: user.hr_role || null, org_id: user.org_id },
    jwtSecret,
    { expiresIn: '8h' }
  );
}

function newAuthToken() {
  return crypto.randomBytes(32).toString('hex');
}

// POST /api/auth/signup — creates a brand-new organization and its first (admin) user.
// No auth required: this is the entry point for someone with no account yet.
router.post('/signup', async (req, res) => {
  const { orgName, name, email, password } = req.body;
  if (!orgName || !name || !email || !password) {
    return res.status(400).json({ error: 'orgName, name, email, password required' });
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({ error: PASSWORD_RULE_MESSAGE });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const hash = await bcrypt.hash(password, 10);
    const { rows: [org] } = await client.query(
      'INSERT INTO organizations (name) VALUES ($1) RETURNING id',
      [orgName]
    );
    const { rows: [user] } = await client.query(
      `INSERT INTO users (name, email, password_hash, role, color, module_access, email_verified)
       VALUES ($1, $2, $3, 'admin', '#5B5BD6', $4, FALSE)
       RETURNING id, name, email`,
      [name, email.toLowerCase().trim(), hash, JSON.stringify({ crm: true, projects: true, hr: true })]
    );
    await client.query(
      'INSERT INTO memberships (org_id, user_id, role) VALUES ($1, $2, $3)',
      [org.id, user.id, 'admin']
    );

    // Best-effort verification email — if SMTP isn't configured (common for a fresh
    // self-hosted trial, same as the digest feature), don't leave the account stuck
    // forever unverified with no way to confirm it: just mark it verified now.
    const token = newAuthToken();
    await client.query(
      `INSERT INTO auth_tokens (user_id, token, type, expires_at)
       VALUES ($1, $2, 'verify_email', NOW() + INTERVAL '24 hours')`,
      [user.id, token]
    );
    await client.query('COMMIT');

    const sent = await sendVerificationEmail(user, token).catch(() => false);
    if (!sent) {
      await pool.query('UPDATE users SET email_verified = TRUE WHERE id=$1', [user.id]);
    }
    res.status(201).json({ ok: true, emailSent: sent });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    if (err.code === '23505') return res.status(409).json({ error: 'Email already in use' });
    console.error('[auth/signup] failed:', err.message);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// GET /api/auth/verify-email?token=... — one-shot link from the verification email.
router.get('/verify-email', async (req, res) => {
  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const { token } = req.query;
  if (!token) return res.redirect(`${appUrl}/login?verifyError=1`);
  try {
    const { rows } = await pool.query(
      `SELECT user_id FROM auth_tokens
       WHERE token=$1 AND type='verify_email' AND used_at IS NULL AND expires_at > NOW()`,
      [token]
    );
    if (!rows[0]) return res.redirect(`${appUrl}/login?verifyError=1`);
    await pool.query('UPDATE users SET email_verified = TRUE WHERE id=$1', [rows[0].user_id]);
    await pool.query('UPDATE auth_tokens SET used_at = NOW() WHERE token=$1', [token]);
    res.redirect(`${appUrl}/login?verified=1`);
  } catch (err) {
    console.error('[auth/verify-email] failed:', err.message);
    res.redirect(`${appUrl}/login?verifyError=1`);
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.role, u.color, u.photo_url,
              u.two_factor_enabled, u.hr_role, u.module_access, u.email_verified, m.org_id
       FROM users u
       LEFT JOIN memberships m ON m.user_id = u.id
       WHERE u.email = $1`,
      [email.toLowerCase().trim()]
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!user.email_verified) {
      return res.status(403).json({ error: 'Please confirm your email before signing in — check your inbox for the confirmation link.' });
    }
    const token = issueToken(user);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, color: user.color, photo_url: user.photo_url, two_factor_enabled: user.two_factor_enabled, hr_role: user.hr_role, module_access: user.module_access, org_id: user.org_id } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/forgot-password — no auth required. Always responds the same way
// regardless of whether the email exists, to avoid leaking which emails are registered.
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    const { rows } = await pool.query('SELECT id, name, email FROM users WHERE email=$1', [email.toLowerCase().trim()]);
    if (rows[0]) {
      const token = newAuthToken();
      await pool.query(
        `INSERT INTO auth_tokens (user_id, token, type, expires_at)
         VALUES ($1, $2, 'reset_password', NOW() + INTERVAL '1 hour')`,
        [rows[0].id, token]
      );
      const sent = await sendPasswordResetEmail(rows[0], token).catch(() => false);
      if (!sent) {
        return res.status(503).json({ error: 'Email isn\'t configured on this server — contact your administrator to reset your password.' });
      }
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('[auth/forgot-password] failed:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'token and password required' });
  if (!isValidPassword(password)) return res.status(400).json({ error: PASSWORD_RULE_MESSAGE });
  try {
    const { rows } = await pool.query(
      `SELECT user_id FROM auth_tokens
       WHERE token=$1 AND type='reset_password' AND used_at IS NULL AND expires_at > NOW()`,
      [token]
    );
    if (!rows[0]) return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, rows[0].user_id]);
    await pool.query('UPDATE auth_tokens SET used_at = NOW() WHERE token=$1', [token]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[auth/reset-password] failed:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', verifyJWT, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.role, u.hr_role, u.manager_id, u.color, u.photo_url,
              u.two_factor_enabled, u.teams_webhook_url, u.email_digest, u.module_access, m.org_id
       FROM users u
       LEFT JOIN memberships m ON m.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
