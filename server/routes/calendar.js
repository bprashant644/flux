const router = require('express').Router();
const { graph, appUrl } = require('../config');
const pool = require('../db/pool');
const verifyJWT = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

const SCOPES = 'offline_access Calendars.ReadWrite';

// GET /api/calendar/connect — initiate Microsoft OAuth
// Token passed as query param because this is a browser redirect (no Auth header possible)
router.get('/connect', (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(401).json({ error: 'Missing token' });

  let user;
  try {
    user = jwt.verify(token, jwtSecret);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (!graph.clientId || !graph.tenantId) {
    return res.status(503).json({ error: 'Microsoft Graph not configured. Set GRAPH_CLIENT_ID and GRAPH_TENANT_ID in .env' });
  }
  const params = new URLSearchParams({
    client_id: graph.clientId,
    response_type: 'code',
    redirect_uri: graph.redirectUri,
    scope: SCOPES,
    state: user.id,
    response_mode: 'query',
  });
  res.redirect(`https://login.microsoftonline.com/${graph.tenantId}/oauth2/v2.0/authorize?${params}`);
});

// GET /api/calendar/callback
router.get('/callback', async (req, res) => {
  const { code, state: userId, error } = req.query;
  if (error) return res.redirect(`${appUrl}/?calendarError=${error}`);
  if (!code || !userId) return res.status(400).send('Bad request');

  try {
    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${graph.tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: graph.clientId,
          client_secret: graph.clientSecret,
          code,
          redirect_uri: graph.redirectUri,
          grant_type: 'authorization_code',
          scope: SCOPES,
        }),
      }
    );
    const tokens = await tokenRes.json();
    if (tokens.error) throw new Error(tokens.error_description);

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    await pool.query(
      `INSERT INTO outlook_tokens (user_id, access_token, refresh_token, expires_at)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id) DO UPDATE
       SET access_token=$2, refresh_token=$3, expires_at=$4`,
      [userId, tokens.access_token, tokens.refresh_token, expiresAt]
    );
    res.redirect(`${appUrl}/?calendarConnected=1`);
  } catch (err) {
    console.error('Calendar OAuth error:', err);
    res.redirect(`${appUrl}/?calendarError=token_exchange_failed`);
  }
});

// GET /api/calendar/status — check if current user has connected
router.get('/status', verifyJWT, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT expires_at FROM outlook_tokens WHERE user_id=$1',
    [req.user.id]
  );
  res.json({ connected: !!rows[0], expiresAt: rows[0]?.expires_at || null });
});

// DELETE /api/calendar/disconnect
router.delete('/disconnect', verifyJWT, async (req, res) => {
  await pool.query('DELETE FROM outlook_tokens WHERE user_id=$1', [req.user.id]);
  res.json({ ok: true });
});

module.exports = router;
