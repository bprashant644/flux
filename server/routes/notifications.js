const router = require('express').Router();
const verifyJWT = require('../middleware/auth');
const { buildAdaptiveCard } = require('../services/teams');
const { sendDigest } = require('../services/email');
const { runDailyNotifications } = require('../services/scheduler');
const pool = require('../db/pool');

// POST /api/notifications/test-teams — send a test Teams message and report back the real result
router.post('/test-teams', verifyJWT, async (req, res) => {
  const { webhookUrl } = req.body;
  if (!webhookUrl) return res.status(400).json({ error: 'webhookUrl required' });
  try {
    const payload = buildAdaptiveCard(req.user.name, [{
      name: 'Test Contact',
      company: 'Flux',
      stage: 'contacted',
      value: 5000,
      next_followup: new Date().toISOString().slice(0, 10),
    }]);
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await response.text();
    if (!response.ok) {
      return res.status(400).json({ error: `Teams returned ${response.status}: ${body}` });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notifications/trigger — admin-only manual trigger (useful for testing)
router.post('/trigger', verifyJWT, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  runDailyNotifications().catch(console.error);
  res.json({ ok: true, message: 'Digest triggered — check server logs' });
});

// GET /api/notifications/cron — invoked by a Vercel Cron Job (see vercel.json), which only
// issues GET requests carrying no user identity. Vercel automatically attaches
// `Authorization: Bearer $CRON_SECRET` to its own cron requests when that env var is set;
// verifying it here is what stops anyone else from hitting this otherwise-public path.
// Not used on a traditional host (Render, a VPS) — those keep the node-cron scheduler.
router.get('/cron', async (req, res) => {
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  runDailyNotifications().catch(console.error);
  res.json({ ok: true, message: 'Digest triggered via cron' });
});

module.exports = router;
